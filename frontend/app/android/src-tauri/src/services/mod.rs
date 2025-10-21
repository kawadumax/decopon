use std::sync::Arc;

use axum_password_worker::{Bcrypt, PasswordWorker};
use decopon_services::{usecases, ServiceContext, ServiceError};
use migration::{Migrator, MigratorTrait};
use sea_orm::Database;
use thiserror::Error;

#[derive(Clone)]
pub struct AppServices {
    context: ServiceContext,
}

impl AppServices {
    pub async fn initialize(
        database_url: &str,
        jwt_secret: String,
        single_user_mode: bool,
    ) -> Result<Self, ServiceInitError> {
        let db = Database::connect(database_url).await?;
        Migrator::up(&db, None)
            .await
            .map_err(ServiceInitError::Migration)?;

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

        Ok(Self { context })
    }

    pub fn service_context(&self) -> ServiceContext {
        self.context.clone()
    }
}

#[derive(Debug, Error)]
pub enum ServiceInitError {
    #[error(transparent)]
    Database(#[from] sea_orm::DbErr),
    #[error("migration failed: {0}")]
    Migration(#[source] sea_orm_migration::DbErr),
    #[error(transparent)]
    PasswordWorker(#[from] axum_password_worker::PasswordWorkerError<Bcrypt>),
    #[error(transparent)]
    Service(#[from] ServiceError),
}
