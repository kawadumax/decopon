use decopon_axum::{
    AppState, routes, services, setup_database, setup_password_worker, setup_tracing_subscriber,
};
use dotenvy::dotenv;
use std::net::SocketAddr;
use tower_http::trace::TraceLayer;
use tracing::info;

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
    use std::env;

    #[tokio::test]
    async fn test_load_env() {
        dotenv().ok();
        assert!(env::var("AXUM_DATABASE_URL").is_ok());
        assert!(env::var("AXUM_JWT_SECRET").is_ok());
    }
}
