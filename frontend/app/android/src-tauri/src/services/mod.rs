use std::{env, sync::Arc};

use decopon_runtime::{ServiceContext, ServiceRuntimeBuilder};
use migration::{Migrator, MigratorTrait};
use sea_orm::Database;
use thiserror::Error;
use tracing::info;

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
        let skip_bootstrap = env_flag_enabled("DECO_SKIP_SERVICE_BOOTSTRAP");
        info!(
            "Connecting to application database at {} (skip_bootstrap={})",
            database_url, skip_bootstrap
        );
        let db = Database::connect(database_url).await?;
        if skip_bootstrap {
            info!("Skipping migration execution because DECO_SKIP_SERVICE_BOOTSTRAP is enabled");
        } else {
            info!("Running database migrations");
            Migrator::up(&db, None)
                .await
                .map_err(ServiceInitError::Migration)?;
        }

        if single_user_mode && !skip_bootstrap {
            info!("Ensuring single-user bootstrap data is present");
        } else if skip_bootstrap && single_user_mode {
            info!("Single-user bootstrap skipped because DECO_SKIP_SERVICE_BOOTSTRAP is enabled");
        } else {
            info!(
                "Single-user bootstrap disabled (single_user_mode={})",
                single_user_mode
            );
        }

        let runtime = ServiceRuntimeBuilder::new(database_url.to_string(), jwt_secret)
            .ensure_single_user_session(single_user_mode && !skip_bootstrap)
            .enable_mailer(false)
            .build()
            .await?;

        info!("Service context initialized");

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

fn env_flag_enabled(key: &str) -> bool {
    env::var(key)
        .map(|value| {
            let normalized = value.trim().to_ascii_lowercase();
            matches!(
                normalized.as_str(),
                "1" | "true" | "yes" | "on" | "enabled"
            )
        })
        .unwrap_or(false)
}
