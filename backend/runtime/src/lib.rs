use std::sync::Arc;

use axum_password_worker::{Bcrypt, PasswordWorker};
pub use decopon_services::{
    entities, usecases, ServiceContext, ServiceContextBuilder, ServiceError,
};
use sea_orm::Database;
use thiserror::Error;
use tracing::info;

#[derive(Clone)]
pub struct ServiceRuntime {
    context: Arc<ServiceContext>,
}

impl ServiceRuntime {
    pub fn service_context(&self) -> Arc<ServiceContext> {
        Arc::clone(&self.context)
    }

    pub fn into_service_context(self) -> Arc<ServiceContext> {
        self.context
    }
}

#[derive(Clone, Debug)]
pub struct ServiceRuntimeBuilder {
    database_url: String,
    jwt_secret: String,
    ensure_single_user_session: bool,
    enable_mailer: bool,
    password_worker_threads: usize,
}

impl ServiceRuntimeBuilder {
    pub fn new(database_url: impl Into<String>, jwt_secret: impl Into<String>) -> Self {
        Self {
            database_url: database_url.into(),
            jwt_secret: jwt_secret.into(),
            ensure_single_user_session: false,
            enable_mailer: false,
            password_worker_threads: 4,
        }
    }

    pub fn ensure_single_user_session(mut self, enabled: bool) -> Self {
        self.ensure_single_user_session = enabled;
        self
    }

    pub fn enable_mailer(mut self, enabled: bool) -> Self {
        self.enable_mailer = enabled;
        self
    }

    pub fn password_worker_threads(mut self, threads: usize) -> Self {
        self.password_worker_threads = threads.max(1);
        self
    }

    pub async fn build(self) -> Result<ServiceRuntime, RuntimeError> {
        let db = Arc::new(Database::connect(&self.database_url).await?);
        let password_worker = Arc::new(PasswordWorker::new_bcrypt(self.password_worker_threads)?);

        let mailer = if self.enable_mailer {
            match usecases::mails::setup_mailer()? {
                Some(mailer) => Some(mailer),
                None => {
                    info!("Mailer feature enabled but SMTP transport is not fully configured");
                    None
                }
            }
        } else {
            info!("Mailer disabled in runtime configuration");
            None
        };

        let single_user_session = if self.ensure_single_user_session {
            Some(
                usecases::single_user::ensure_user(
                    db.as_ref(),
                    password_worker.as_ref(),
                    &self.jwt_secret,
                )
                .await?,
            )
        } else {
            None
        };

        let context = ServiceContext::builder(db, password_worker, self.jwt_secret)
            .mailer(mailer)
            .single_user_session(single_user_session)
            .build();

        Ok(ServiceRuntime {
            context: Arc::new(context),
        })
    }
}

#[derive(Debug, Error)]
pub enum RuntimeError {
    #[error(transparent)]
    Database(#[from] sea_orm::DbErr),
    #[error(transparent)]
    PasswordWorker(#[from] axum_password_worker::PasswordWorkerError<Bcrypt>),
    #[error(transparent)]
    Service(#[from] ServiceError),
}
