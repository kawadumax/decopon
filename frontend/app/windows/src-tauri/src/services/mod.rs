use std::sync::Arc;

use decopon_runtime::{ServiceContext, ServiceRuntimeBuilder};
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
        Migrator::up(&db, None)
            .await
            .map_err(ServiceInitError::Migration)?;

        let runtime = ServiceRuntimeBuilder::new(database_url.to_string(), jwt_secret)
            .ensure_single_user_session(single_user_mode)
            .enable_mailer(false)
            .build()
            .await?;

        Ok(Self {
            context: runtime.service_context(),
        })
    }

    pub fn service_context(&self) -> ServiceContext {
        self.context.as_ref().clone()
    }
}

#[derive(Debug, Error)]
pub enum ServiceInitError {
    #[error(transparent)]
    Database(#[from] sea_orm::DbErr),
    #[error("migration failed: {0}")]
    Migration(#[source] sea_orm_migration::DbErr),
    #[error(transparent)]
    Runtime(#[from] decopon_runtime::RuntimeError),
}
