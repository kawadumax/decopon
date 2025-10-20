pub mod dto;
pub mod errors;
pub mod extractors;
pub mod middleware;
pub mod routes;

pub use decopon_services::{
    ServiceContext, ServiceContextBuilder, ServiceError, entities, usecases,
};

use axum::{
    extract::FromRef,
    http::{
        HeaderValue, Method,
        header::{AUTHORIZATION, CONTENT_TYPE, HeaderName},
    },
};
use axum_password_worker::{Bcrypt, PasswordWorker};
use dotenvy::{dotenv, from_filename};
use sea_orm::{Database, DatabaseConnection};
use std::{env, io::ErrorKind, net::SocketAddr, sync::Arc};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

use tracing::info;
use usecases::single_user::SingleUserSession;

pub fn load_env_with_fallback(primary: &str) -> Result<(), dotenvy::Error> {
    match from_filename(primary) {
        Ok(_) => Ok(()),
        Err(dotenvy::Error::Io(err)) if err.kind() == ErrorKind::NotFound => match dotenv() {
            Ok(_) => Ok(()),
            Err(dotenvy::Error::Io(err)) if err.kind() == ErrorKind::NotFound => Ok(()),
            Err(err) => Err(err),
        },
        Err(err) => Err(err),
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct BootstrapConfig {
    pub ensure_single_user_session: bool,
    pub enable_mailer: bool,
}

impl BootstrapConfig {
    pub fn app() -> Self {
        Self {
            ensure_single_user_session: true,
            enable_mailer: false,
        }
    }

    pub fn web() -> Self {
        Self {
            ensure_single_user_session: false,
            enable_mailer: true,
        }
    }
}

#[derive(Clone)]
pub struct AppState {
    services: Arc<ServiceContext>,
}

impl AppState {
    pub fn new(services: Arc<ServiceContext>) -> Self {
        Self { services }
    }

    pub fn services(&self) -> &ServiceContext {
        self.services.as_ref()
    }

    pub fn db(&self) -> &DatabaseConnection {
        self.services().db()
    }

    pub fn db_arc(&self) -> Arc<DatabaseConnection> {
        self.services().db_arc()
    }

    pub fn password_worker(&self) -> &PasswordWorker<Bcrypt> {
        self.services().password_worker()
    }

    pub fn password_worker_arc(&self) -> Arc<PasswordWorker<Bcrypt>> {
        self.services().password_worker_arc()
    }

    pub fn mailer(&self) -> Option<&Arc<lettre::SmtpTransport>> {
        self.services().mailer()
    }

    pub fn mailer_arc(&self) -> Option<Arc<lettre::SmtpTransport>> {
        self.services().mailer_arc()
    }

    pub fn jwt_secret(&self) -> &str {
        self.services().jwt_secret()
    }

    pub fn single_user_session(&self) -> Option<SingleUserSession> {
        self.services().single_user_session_owned()
    }
}

impl From<ServiceContext> for AppState {
    fn from(services: ServiceContext) -> Self {
        Self::new(Arc::new(services))
    }
}

impl FromRef<AppState> for Arc<DatabaseConnection> {
    fn from_ref(state: &AppState) -> Self {
        state.db_arc()
    }
}

impl FromRef<AppState> for Arc<PasswordWorker<Bcrypt>> {
    fn from_ref(state: &AppState) -> Self {
        state.password_worker_arc()
    }
}

impl FromRef<AppState> for Option<Arc<lettre::SmtpTransport>> {
    fn from_ref(state: &AppState) -> Self {
        state.mailer_arc()
    }
}

impl FromRef<AppState> for Option<SingleUserSession> {
    fn from_ref(state: &AppState) -> Self {
        state.single_user_session()
    }
}

pub async fn setup_database() -> Result<Arc<DatabaseConnection>, sea_orm::DbErr> {
    let database_url: String = env::var("AXUM_DATABASE_URL").expect(
        "環境変数 'AXUM_DATABASE_URL' が設定されていません。'.env'ファイルを確認してください。",
    );
    let conn = Database::connect(database_url).await?;
    Ok(Arc::new(conn))
}

pub fn setup_password_worker() -> Result<Arc<PasswordWorker<Bcrypt>>, Box<dyn std::error::Error>> {
    let max_threads = 4;
    let worker = PasswordWorker::new_bcrypt(max_threads)?;
    Ok(Arc::new(worker))
}

pub fn setup_jwt_secret() -> Result<String, env::VarError> {
    env::var("AXUM_JWT_SECRET")
}

pub fn setup_tracing_subscriber() -> Result<(), Box<dyn std::error::Error>> {
    let filter = EnvFilter::builder()
        .with_default_directive(tracing::level_filters::LevelFilter::INFO.into())
        .from_env_lossy()
        .add_directive("sqlx=warn".parse()?);
    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer())
        .init();
    Ok(())
}

pub fn setup_cors() -> CorsLayer {
    let allowed_origins_env = env::var("AXUM_ALLOWED_ORIGINS").unwrap_or_default();
    let allowed_origins: Vec<HeaderValue> = allowed_origins_env
        .split(',')
        .filter_map(|origin| origin.trim().parse().ok())
        .collect();

    let cors = if allowed_origins.is_empty() {
        CorsLayer::new().allow_origin(Any)
    } else {
        CorsLayer::new().allow_origin(allowed_origins)
    };

    cors.allow_methods([
        Method::GET,
        Method::POST,
        Method::PUT,
        Method::PATCH,
        Method::DELETE,
        Method::OPTIONS,
    ])
    .allow_headers([
        AUTHORIZATION,
        CONTENT_TYPE,
        HeaderName::from_static("x-requested-with"),
    ])
    .allow_credentials(true)
}

pub async fn build_app_state(
    config: BootstrapConfig,
) -> Result<AppState, Box<dyn std::error::Error>> {
    let db = setup_database().await?;
    let password_worker = setup_password_worker()?;

    let mailer = if config.enable_mailer {
        match usecases::mails::setup_mailer() {
            Ok(mailer) => {
                if mailer.is_none() {
                    info!(
                        "SMTP transport is disabled or not configured; email features are inactive"
                    );
                }
                mailer
            }
            Err(err) => return Err(Box::new(err)),
        }
    } else {
        info!("Mailer is disabled for this build; email features are inactive");
        None
    };

    let jwt_secret = setup_jwt_secret()?;

    let single_user_session = if config.ensure_single_user_session {
        Some(
            usecases::single_user::ensure_user(db.as_ref(), password_worker.as_ref(), &jwt_secret)
                .await
                .map_err(|err| -> Box<dyn std::error::Error> { Box::new(err) })?,
        )
    } else {
        None
    };

    let service_context =
        ServiceContext::builder(db.clone(), password_worker.clone(), jwt_secret.clone())
            .mailer(mailer.clone())
            .single_user_session(single_user_session)
            .build();

    Ok(AppState::new(Arc::new(service_context)))
}

pub fn resolve_socket_addr() -> Result<SocketAddr, Box<dyn std::error::Error>> {
    let ip = env::var("AXUM_IP").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port: u16 = env::var("AXUM_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    Ok(SocketAddr::new(ip.parse()?, port))
}

#[cfg(test)]
mod tests {
    use super::*;
    use dotenvy::dotenv;

    #[tokio::test]
    async fn test_load_env() {
        dotenv().ok();
        assert!(env::var("AXUM_DATABASE_URL").is_ok());
        assert!(env::var("AXUM_JWT_SECRET").is_ok());
    }
}
