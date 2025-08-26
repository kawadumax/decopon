pub mod dto;
pub mod entities;
pub mod errors;
pub mod extractors;
pub mod middleware;
pub mod routes;
pub mod services;

use axum::extract::FromRef;
use axum_password_worker::{Bcrypt, PasswordWorker};
use sea_orm::{Database, DatabaseConnection};
use std::env;
use std::sync::Arc;
use tracing_subscriber::{EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<DatabaseConnection>,
    pub password_worker: Arc<PasswordWorker<Bcrypt>>,
    pub mailer: Arc<lettre::SmtpTransport>,
}

impl FromRef<AppState> for Arc<DatabaseConnection> {
    fn from_ref(state: &AppState) -> Self {
        state.db.clone()
    }
}

impl FromRef<AppState> for Arc<PasswordWorker<Bcrypt>> {
    fn from_ref(state: &AppState) -> Self {
        state.password_worker.clone()
    }
}

impl FromRef<AppState> for Arc<lettre::SmtpTransport> {
    fn from_ref(state: &AppState) -> Self {
        state.mailer.clone()
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

pub fn setup_tracing_subscriber() -> Result<(), Box<dyn std::error::Error>> {
    let filter = EnvFilter::builder()
        .with_default_directive(tracing::level_filters::LevelFilter::INFO.into())
        .from_env_lossy();
    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer())
        .init();
    Ok(())
}
