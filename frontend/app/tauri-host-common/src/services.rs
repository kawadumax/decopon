use std::sync::Arc;

use decopon_runtime::{RuntimeConfig, ServiceContext, ServiceRuntimeBuilder};
use thiserror::Error;
use tracing::info;

use crate::should_skip_service_bootstrap;

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
        let skip_bootstrap = should_skip_service_bootstrap();
        info!(
            skip_bootstrap,
            "Initializing service runtime (skip_bootstrap={})", skip_bootstrap
        );

        if single_user_mode && !skip_bootstrap {
            info!("Ensuring single-user bootstrap data is present");
        } else if single_user_mode {
            info!("Single-user bootstrap skipped because DECO_SKIP_SERVICE_BOOTSTRAP=1");
        } else {
            info!("Single-user bootstrap disabled via APP_SINGLE_USER_MODE");
        }

        let runtime_config = RuntimeConfig {
            database_url: database_url.to_string(),
            jwt_secret,
            ensure_single_user_session: single_user_mode && !skip_bootstrap,
            enable_mailer: false,
            run_migrations: !skip_bootstrap,
            password_worker_threads: 4,
        };

        let runtime = ServiceRuntimeBuilder::from_config(runtime_config)
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
    Runtime(#[from] decopon_runtime::RuntimeError),
}
