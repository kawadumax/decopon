mod entities;
mod errors;
mod routes;
mod services;
use axum::extract::FromRef;
use axum_password_worker::{Bcrypt, PasswordWorker};
use dotenvy::dotenv;
use sea_orm::{Database, DatabaseConnection};
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, fmt};

#[derive(Clone)]
pub struct AppState {
    db: Arc<DatabaseConnection>,
    password_worker: Arc<PasswordWorker<Bcrypt>>,
    mailer: Arc<lettre::SmtpTransport>,
}

// FromRefの実装
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

async fn setup_database() -> Result<Arc<DatabaseConnection>, sea_orm::DbErr> {
    // Load the database URL from the environment variable
    let database_url: String = env::var("AXUM_DATABASE_URL").expect(
        "環境変数 'AXUM_DATABASE_URL' が設定されていません。'.env'ファイルを確認してください。",
    );

    // Initialize the database connection
    let conn = Database::connect(database_url).await?;
    Ok(Arc::new(conn))
}

fn setup_password_worker() -> Result<Arc<PasswordWorker<Bcrypt>>, Box<dyn std::error::Error>> {
    // PasswordWorkerの初期化
    let max_threads = 4; // 調整可能
    let worker = PasswordWorker::new_bcrypt(max_threads)?;
    Ok(Arc::new(worker))
}

fn setup_tracing_subscriber() -> Result<(), Box<dyn std::error::Error>> {
    let filter = EnvFilter::builder()
        .with_default_directive(tracing::level_filters::LevelFilter::INFO.into())
        .from_env_lossy(); // RUST_LOG があれば上書き

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer())
        .init();
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables from .env file
    dotenv().ok();

    // Set up tracing subscriber for logging
    setup_tracing_subscriber()?;

    // Set up the database connection
    let db = setup_database().await?;

    // PasswordWorker初期化（一度だけ）
    let password_worker = setup_password_worker()?;

    // メール送信の設定
    let mailer = services::mails::setup_mailer()?;

    // build our application with routes
    let app = routes::create_routes()
        .with_state(AppState {
            db: db.clone(),
            password_worker: password_worker.clone(),
            mailer: mailer.clone(),
        })
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    info!("Starting server on {}", addr);

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await?;
    Ok(())
}

// test
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_load_env() {
        dotenv().ok();
        assert!(env::var("AXUM_DATABASE_URL").is_ok());
        assert!(env::var("AXUM_JWT_SECRET").is_ok());
    }
}
