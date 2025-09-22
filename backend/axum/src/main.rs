use axum::http::Request;
use decopon_axum::{
    AppState, routes, services, setup_cors, setup_database, setup_jwt_secret,
    setup_password_worker, setup_tracing_subscriber,
};
use dotenvy::dotenv;
use std::{env, net::SocketAddr};
use tower_http::trace::TraceLayer;
use tracing::{info, info_span};

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

    let jwt_secret = setup_jwt_secret()?;

    // CORS設定
    let cors = setup_cors();

    // アプリケーション状態を構築
    let app_state = AppState {
        db: db.clone(),
        password_worker: password_worker.clone(),
        mailer: mailer.clone(),
        jwt_secret: jwt_secret.clone(),
    };

    // build our application with routes
    let app = routes::create_routes(app_state.clone())
        .layer(cors)
        .with_state(app_state.clone())
        .layer(
            TraceLayer::new_for_http().make_span_with(|request: &Request<_>| {
                info_span!("http_request", method = %request.method(), uri = %request.uri())
            }),
        );

    let ip = env::var("AXUM_IP").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port: u16 = env::var("AXUM_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);
    let addr = SocketAddr::new(ip.parse()?, port);
    info!("Starting server on http://{}", addr);

    // run our app with hyper, listening on the configured address
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
