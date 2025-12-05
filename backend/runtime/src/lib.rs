use std::{env, sync::Arc};

use axum_password_worker::{Bcrypt, PasswordWorker};
pub use decopon_services::{
    entities, usecases, ServiceContext, ServiceContextBuilder, ServiceError,
};
use migration::{Migrator, MigratorTrait};
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
    run_migrations: bool,
}

impl ServiceRuntimeBuilder {
    pub fn new(database_url: impl Into<String>, jwt_secret: impl Into<String>) -> Self {
        Self {
            database_url: database_url.into(),
            jwt_secret: jwt_secret.into(),
            ensure_single_user_session: false,
            enable_mailer: false,
            password_worker_threads: 4,
            run_migrations: false,
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

    pub fn run_migrations(mut self, enabled: bool) -> Self {
        self.run_migrations = enabled;
        self
    }

    pub fn from_config(config: RuntimeConfig) -> Self {
        Self {
            database_url: config.database_url,
            jwt_secret: config.jwt_secret,
            ensure_single_user_session: config.ensure_single_user_session,
            enable_mailer: config.enable_mailer,
            password_worker_threads: config.password_worker_threads,
            run_migrations: config.run_migrations,
        }
    }

    pub async fn build(self) -> Result<ServiceRuntime, RuntimeError> {
        let db = Arc::new(Database::connect(&self.database_url).await?);
        if self.run_migrations {
            Migrator::up(db.as_ref(), None)
                .await
                .map_err(RuntimeError::Migration)?;
        } else {
            info!("Skipping database migrations (run_migrations = false)");
        }
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

#[derive(Clone, Debug)]
pub struct RuntimeBootstrapOptions {
    pub default_local_app_mode: bool,
    pub run_migrations: bool,
    pub password_worker_threads: usize,
}

impl Default for RuntimeBootstrapOptions {
    fn default() -> Self {
        Self {
            default_local_app_mode: true,
            run_migrations: true,
            password_worker_threads: 4,
        }
    }
}

#[derive(Clone, Debug)]
pub struct RuntimeConfig {
    pub database_url: String,
    pub jwt_secret: String,
    pub ensure_single_user_session: bool,
    pub enable_mailer: bool,
    pub run_migrations: bool,
    pub password_worker_threads: usize,
}

impl RuntimeConfig {
    pub fn from_env(options: RuntimeBootstrapOptions) -> Result<Self, RuntimeError> {
        let database_url = env::var("AXUM_DATABASE_URL")
            .map_err(|_| RuntimeError::MissingEnvVar("AXUM_DATABASE_URL".to_string()))?;
        let jwt_secret = env::var("AXUM_JWT_SECRET")
            .map_err(|_| RuntimeError::MissingEnvVar("AXUM_JWT_SECRET".to_string()))?;
        let (ensure_single_user_session, enable_mailer) =
            resolve_runtime_flags(options.default_local_app_mode);
        let run_migrations = options.run_migrations && !env_flag_enabled("DECO_SKIP_SERVICE_BOOTSTRAP");

        Ok(Self {
            database_url,
            jwt_secret,
            ensure_single_user_session,
            enable_mailer,
            run_migrations,
            password_worker_threads: options.password_worker_threads.max(1),
        })
    }
}

pub async fn bootstrap_runtime_from_env(
    options: RuntimeBootstrapOptions,
) -> Result<ServiceRuntime, RuntimeError> {
    let config = RuntimeConfig::from_env(options)?;
    ServiceRuntimeBuilder::from_config(config).build().await
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

fn resolve_runtime_flags(default_local_app_mode: bool) -> (bool, bool) {
    let fallback = if default_local_app_mode {
        "local".to_string()
    } else {
        "web".to_string()
    };
    let normalized_mode = env::var("APP_MODE")
        .unwrap_or(fallback)
        .trim()
        .to_ascii_lowercase();
    let is_local_mode = normalized_mode != "web";

    let ensure_single_user_session = env::var("APP_SINGLE_USER_MODE")
        .ok()
        .and_then(|value| {
            let normalized = value.trim().to_ascii_lowercase();
            matches!(
                normalized.as_str(),
                "1" | "true" | "yes" | "on" | "enabled"
            )
            .then_some(true)
            .or_else(|| {
                matches!(
                    normalized.as_str(),
                    "0" | "false" | "no" | "off" | "disabled"
                )
                .then_some(false)
            })
        })
        .unwrap_or(is_local_mode);

    let enable_mailer = !is_local_mode && !env_flag_enabled("AXUM_DISABLE_SMTP");

    (ensure_single_user_session, enable_mailer)
}

#[derive(Debug, Error)]
pub enum RuntimeError {
    #[error("required environment variable '{0}' is missing")]
    MissingEnvVar(String),
    #[error(transparent)]
    Database(#[from] sea_orm::DbErr),
    #[error(transparent)]
    PasswordWorker(#[from] axum_password_worker::PasswordWorkerError<Bcrypt>),
    #[error(transparent)]
    Service(#[from] ServiceError),
    #[error("migration failed: {0}")]
    Migration(#[source] migration::DbErr),
}
