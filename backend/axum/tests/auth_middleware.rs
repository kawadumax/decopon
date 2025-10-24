#![cfg(feature = "web")]

use std::sync::Arc;

use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode, header::AUTHORIZATION},
    middleware::from_fn_with_state,
    routing::get,
};
use axum_password_worker::PasswordWorker;
use lettre::SmtpTransport;
use sea_orm::Database;
use tower::ServiceExt;

use decopon_axum::{
    AppState, ServiceContext,
    middleware::auth::{AuthenticatedUser, auth_middleware},
    usecases,
};

async fn handler() -> StatusCode {
    StatusCode::OK
}

fn build_state(db: sea_orm::DatabaseConnection, jwt_secret: String) -> AppState {
    let db = Arc::new(db);
    let password_worker = Arc::new(PasswordWorker::new_bcrypt(1).unwrap());
    let mailer = Some(Arc::new(
        SmtpTransport::builder_dangerous("localhost").build(),
    ));

    AppState::from(
        ServiceContext::builder(db, password_worker, jwt_secret)
            .mailer(mailer)
            .build(),
    )
}

#[tokio::test]
async fn reject_without_token() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    let state = build_state(db, "secret".to_string());

    let app = Router::new()
        .route("/", get(handler))
        .with_state(state.clone())
        .layer(from_fn_with_state(state, auth_middleware));

    let req = Request::builder().uri("/").body(Body::empty()).unwrap();
    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn reject_invalid_token() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    let state = build_state(db, "secret".to_string());

    let app = Router::new()
        .route("/", get(handler))
        .with_state(state.clone())
        .layer(from_fn_with_state(state, auth_middleware));

    let req = Request::builder()
        .uri("/")
        .header(AUTHORIZATION, "Bearer invalid")
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn accept_valid_token() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    let jwt_secret = "secret".to_string();
    let token = usecases::auth::create_jwt(1, &jwt_secret).unwrap();
    let state = build_state(db, jwt_secret);

    let app = Router::new()
        .route(
            "/",
            get(
                |axum::Extension(user): axum::Extension<AuthenticatedUser>| async move {
                    assert_eq!(user.id, 1);
                    StatusCode::OK
                },
            ),
        )
        .with_state(state.clone())
        .layer(from_fn_with_state(state, auth_middleware));

    let req = Request::builder()
        .uri("/")
        .header(AUTHORIZATION, format!("Bearer {}", token))
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
}
