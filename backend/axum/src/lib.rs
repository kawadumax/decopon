pub mod dto;
pub mod errors;
pub mod extractors;
pub mod middleware;
pub mod routes;

use decopon_runtime::ServiceRuntimeBuilder;
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
use dotenvy::{dotenv, from_path};
use sea_orm::DatabaseConnection;
use std::{
    env,
    io::ErrorKind,
    net::SocketAddr,
    path::{Path, PathBuf},
    sync::Arc,
};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

use usecases::{mails::Mailer, single_user::SingleUserSession};

fn resolve_env_candidates(primary: &str) -> Vec<PathBuf> {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    vec![
        PathBuf::from(primary),
        manifest_dir.join(primary),
        manifest_dir.join("..").join(primary),
        manifest_dir.join("..").join("..").join(primary),
    ]
}

pub fn load_env_with_fallback(primary: &str) -> Result<(), dotenvy::Error> {
    for candidate in resolve_env_candidates(primary) {
        match from_path(&candidate) {
            Ok(_) => return Ok(()),
            Err(dotenvy::Error::Io(err)) if err.kind() == ErrorKind::NotFound => continue,
            Err(err) => return Err(err),
        }
    }

    match dotenv() {
        Ok(_) => Ok(()),
        Err(dotenvy::Error::Io(err)) if err.kind() == ErrorKind::NotFound => Ok(()),
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

    pub fn mailer(&self) -> Option<&Mailer> {
        self.services().mailer()
    }

    pub fn mailer_arc(&self) -> Option<Mailer> {
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

impl FromRef<AppState> for Option<Mailer> {
    fn from_ref(state: &AppState) -> Self {
        state.mailer_arc()
    }
}

impl FromRef<AppState> for Option<SingleUserSession> {
    fn from_ref(state: &AppState) -> Self {
        state.single_user_session()
    }
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

fn resolve_app_mode_flags(default_local: bool) -> (bool, bool) {
    let fallback = if default_local { "local" } else { "web" }.to_string();
    let normalized = env::var("APP_MODE")
        .unwrap_or(fallback)
        .trim()
        .to_ascii_lowercase();
    let is_local = normalized != "web";
    (is_local, !is_local)
}

pub async fn build_app_state(
    config: BootstrapConfig,
) -> Result<AppState, Box<dyn std::error::Error>> {
    let database_url: String = env::var("AXUM_DATABASE_URL").expect(
        "環境変数 'AXUM_DATABASE_URL' が設定されていません。'.env'ファイルを確認してください。",
    );
    let jwt_secret = setup_jwt_secret()?;
    let (ensure_single_user_session, enable_mailer) =
        resolve_app_mode_flags(config.ensure_single_user_session);

    let runtime = ServiceRuntimeBuilder::new(database_url, jwt_secret.clone())
        .ensure_single_user_session(ensure_single_user_session)
        .enable_mailer(enable_mailer)
        .build()
        .await
        .map_err(|err| -> Box<dyn std::error::Error> { Box::new(err) })?;

    Ok(AppState::new(runtime.service_context()))
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
