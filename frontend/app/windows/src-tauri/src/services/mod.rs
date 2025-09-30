use std::sync::Arc;

use async_trait::async_trait;
use axum_password_worker::{Bcrypt, PasswordWorker};
use decopon_app_ipc::{
    AuthConfirmPasswordRequest, AuthCurrentUserRequest, AuthForgotPasswordRequest, AuthHandler,
    AuthLoginRequest, AuthRegisterRequest, AuthResendVerificationRequest, AuthResetPasswordRequest,
    AuthSession, AuthUser, AuthVerifyEmailRequest, CreateTaskRequest, DeleteTaskRequest, Task,
    TaskHandler, TaskListRequest, UpdateTaskRequest,
};
use decopon_services::{
    usecases::{self, auth, tasks as tasks_usecase},
    ServiceContext, ServiceError,
};
use migration::{Migrator, MigratorTrait};
use sea_orm::Database;
use thiserror::Error;

#[derive(Clone)]
pub struct AppServices {
    context: Arc<ServiceContext>,
}

impl AppServices {
    pub async fn initialize(
        database_url: &str,
        jwt_secret: String,
        single_user_mode: bool,
    ) -> Result<Self, ServiceInitError> {
        let db = Database::connect(database_url).await?;
        Migrator::up(&db, None).await?;

        let db = Arc::new(db);
        let password_worker = Arc::new(PasswordWorker::new_bcrypt(4)?);

        let single_user_session = if single_user_mode {
            Some(
                usecases::single_user::ensure_user(
                    db.as_ref(),
                    password_worker.as_ref(),
                    &jwt_secret,
                )
                .await?,
            )
        } else {
            None
        };

        let context = ServiceContext::builder(db, password_worker, jwt_secret)
            .mailer(None)
            .single_user_session(single_user_session)
            .build();

        Ok(Self {
            context: Arc::new(context),
        })
    }

    pub(crate) fn context(&self) -> &ServiceContext {
        self.context.as_ref()
    }
}

#[derive(Debug, Error)]
pub enum ServiceInitError {
    #[error(transparent)]
    Database(#[from] sea_orm::DbErr),
    #[error(transparent)]
    Migration(#[from] sea_orm_migration::DbErr),
    #[error(transparent)]
    PasswordWorker(#[from] axum_password_worker::PasswordWorkerError<Bcrypt>),
    #[error(transparent)]
    Service(#[from] ServiceError),
}

#[async_trait]
impl AuthHandler for AppServices {
    async fn login(&self, request: AuthLoginRequest) -> Result<AuthSession, ServiceError> {
        let response = auth::login_user(
            self.context().db(),
            self.context().password_worker(),
            self.context().jwt_secret(),
            &request.email,
            &request.password,
        )
        .await?;
        Ok(response.into())
    }

    async fn single_user_session(&self) -> Result<AuthSession, ServiceError> {
        self.context()
            .single_user_session_owned()
            .map(|session| AuthSession {
                token: session.token,
                user: session.user.into(),
            })
            .ok_or(ServiceError::NotFound("single-user-session"))
    }

    async fn register(&self, request: AuthRegisterRequest) -> Result<AuthUser, ServiceError> {
        if request.password != request.password_confirmation {
            return Err(ServiceError::BadRequest(
                "password-confirmation-mismatch".to_string(),
            ));
        }

        let result = auth::register_user(
            self.context().db(),
            self.context().password_worker(),
            self.context().mailer(),
            &request.name,
            &request.email,
            &request.password,
        )
        .await?;

        Ok(result.user.into())
    }

    async fn current_user(
        &self,
        request: AuthCurrentUserRequest,
    ) -> Result<AuthUser, ServiceError> {
        let user = auth::get_auth_user_from_token(
            self.context().db(),
            request.token,
            self.context().jwt_secret(),
        )
        .await?;

        Ok(user.into())
    }

    async fn logout(&self) -> Result<(), ServiceError> {
        Ok(())
    }

    async fn forgot_password(
        &self,
        request: AuthForgotPasswordRequest,
    ) -> Result<(), ServiceError> {
        auth::forgot_password(self.context().db(), self.context().mailer(), &request.email).await
    }

    async fn reset_password(&self, request: AuthResetPasswordRequest) -> Result<(), ServiceError> {
        auth::reset_password(
            self.context().db(),
            self.context().password_worker(),
            &request.token,
            &request.email,
            &request.password,
        )
        .await
    }

    async fn confirm_password(
        &self,
        token: String,
        request: AuthConfirmPasswordRequest,
    ) -> Result<(), ServiceError> {
        auth::confirm_password(
            self.context().db(),
            self.context().password_worker(),
            self.context().jwt_secret(),
            &token,
            &request.password,
        )
        .await
    }

    async fn verify_email(
        &self,
        request: AuthVerifyEmailRequest,
    ) -> Result<AuthSession, ServiceError> {
        let response = auth::verify_email(
            self.context().db(),
            request.token,
            self.context().jwt_secret(),
        )
        .await?;

        Ok(response.into())
    }

    async fn resend_verification(
        &self,
        request: AuthResendVerificationRequest,
    ) -> Result<(), ServiceError> {
        auth::resend_verification(self.context().db(), self.context().mailer(), &request.email)
            .await
    }
}

#[async_trait]
impl TaskHandler for AppServices {
    async fn get_task(&self, id: i32, user_id: i32) -> Result<Task, ServiceError> {
        tasks_usecase::get_task_by_id(self.context().db(), user_id, id)
            .await
            .map(Into::into)
    }

    async fn list_tasks(&self, request: TaskListRequest) -> Result<Vec<Task>, ServiceError> {
        let tasks = tasks_usecase::get_tasks(
            self.context().db(),
            request.user_id,
            request.tag_ids.clone(),
        )
        .await?;

        Ok(tasks.into_iter().map(Into::into).collect())
    }

    async fn create_task(&self, request: CreateTaskRequest) -> Result<Task, ServiceError> {
        let new_task = tasks_usecase::NewTask {
            title: request.title,
            description: request.description.unwrap_or_default(),
            parent_task_id: request.parent_task_id,
            tag_ids: request.tag_ids,
            user_id: request.user_id,
        };

        tasks_usecase::insert_task(self.context().db(), new_task)
            .await
            .map(Into::into)
    }

    async fn update_task(&self, request: UpdateTaskRequest) -> Result<Task, ServiceError> {
        let update = tasks_usecase::TaskUpdate {
            id: request.id,
            title: request.title,
            description: request.description,
            completed: request.completed,
            parent_task_id: request.parent_task_id,
            tag_ids: request.tag_ids,
            user_id: request.user_id,
        };

        tasks_usecase::update_task(self.context().db(), update)
            .await
            .map(Into::into)
    }

    async fn delete_task(&self, request: DeleteTaskRequest) -> Result<bool, ServiceError> {
        let result =
            tasks_usecase::delete_task(self.context().db(), request.id, request.user_id).await?;

        Ok(result.rows_affected > 0)
    }
}
