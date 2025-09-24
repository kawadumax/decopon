use std::sync::Arc;

use async_trait::async_trait;
use axum_password_worker::{Bcrypt, PasswordWorker};
use decopon_app_ipc::{
    AuthHandler, AuthLoginRequest, AuthSession, CreateTaskRequest, DeleteTaskRequest, Task,
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

    fn context(&self) -> &ServiceContext {
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
}

#[async_trait]
impl TaskHandler for AppServices {
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
