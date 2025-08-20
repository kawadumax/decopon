mod entities;
mod errors;
mod routes;
mod services;
use axum::Router;
use axum::extract::FromRef;
use axum_password_worker::{Bcrypt, PasswordWorker};
use dotenvy::dotenv;
use sea_orm::{Database, DatabaseConnection};
use std::env;
use std::sync::Arc;

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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables from .env file
    dotenv().ok();

    // Set up the database connection
    let db = setup_database().await?;

    // PasswordWorker初期化（一度だけ）
    let password_worker = setup_password_worker()?;

    // メール送信の設定
    let mailer = services::mails::setup_mailer()?;

    // build our application with routes
    let routes: Router<AppState> = routes::create_routes();
    let app = routes.with_state(AppState {
        db: db.clone(),
        password_worker: password_worker.clone(),
        mailer: mailer.clone(),
    });
    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
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
