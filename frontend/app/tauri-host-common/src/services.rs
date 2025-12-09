use std::sync::Arc;

use decopon_config::EnvConfig;
use decopon_runtime::{RuntimeConfig, ServiceContext, ServiceRuntimeBuilder};
use thiserror::Error;
use tracing::info;

use crate::should_skip_service_bootstrap;

#[derive(Clone)]
pub struct AppServices {
    context: Arc<ServiceContext>,
}

impl AppServices {
    pub async fn initialize(env_config: EnvConfig) -> Result<Self, ServiceInitError> {
        let skip_bootstrap = should_skip_service_bootstrap();
        info!(
            skip_bootstrap,
            "Initializing service runtime (skip_bootstrap={})", skip_bootstrap
        );

        if env_config.single_user.enabled && !skip_bootstrap {
            info!("Ensuring single-user bootstrap data is present");
        } else if env_config.single_user.enabled {
            info!("Single-user bootstrap skipped because DECO_SKIP_SERVICE_BOOTSTRAP=1");
        } else {
            info!("Single-user bootstrap disabled via APP_SINGLE_USER_MODE");
        }

        let runtime_config = RuntimeConfig {
            database_url: env_config.database_url,
            jwt_secret: env_config.jwt_secret,
            ensure_single_user_session: env_config.single_user.enabled && !skip_bootstrap,
            enable_mailer: env_config.smtp.enabled,
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
