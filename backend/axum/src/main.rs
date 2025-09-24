use axum::http::Request;
use decopon_axum::{
    AppState, ServiceContext, routes, setup_cors, setup_database, setup_jwt_secret,
    setup_password_worker, setup_tracing_subscriber, usecases,
};
use dotenvy::dotenv;
use std::{env, net::SocketAddr, sync::Arc};
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
    let mailer = usecases::mails::setup_mailer()
        .map_err(|err| -> Box<dyn std::error::Error> { Box::new(err) })?;
    if mailer.is_none() {
        info!("SMTP transport is disabled or not configured; email features are inactive");
    }

    let jwt_secret = setup_jwt_secret()?;

    let single_user_mode = env::var("APP_SINGLE_USER_MODE")
        .map(|value| value == "1" || value.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    let single_user_session = if single_user_mode {
        Some(
            usecases::single_user::ensure_user(db.as_ref(), password_worker.as_ref(), &jwt_secret)
                .await
                .map_err(|err| -> Box<dyn std::error::Error> { Box::new(err) })?,
        )
    } else {
        None
    };

    // CORS設定
    let cors = setup_cors();

    // アプリケーション状態を構築
    let service_context =
        ServiceContext::builder(db.clone(), password_worker.clone(), jwt_secret.clone())
            .mailer(mailer.clone())
            .single_user_session(single_user_session)
            .build();
    let app_state = AppState::new(Arc::new(service_context));

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
