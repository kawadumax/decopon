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
    AppState,
    middleware::auth::{AuthenticatedUser, auth_middleware},
    services,
};

async fn handler() -> StatusCode {
    StatusCode::OK
}

#[tokio::test]
async fn reject_without_token() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    let state = AppState {
        db: Arc::new(db),
        password_worker: Arc::new(PasswordWorker::new_bcrypt(1).unwrap()),
        mailer: Some(Arc::new(
            SmtpTransport::builder_dangerous("localhost").build(),
        )),
        jwt_secret: "secret".to_string(),
        single_user_session: None,
    };

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
    let state = AppState {
        db: Arc::new(db),
        password_worker: Arc::new(PasswordWorker::new_bcrypt(1).unwrap()),
        mailer: Some(Arc::new(
            SmtpTransport::builder_dangerous("localhost").build(),
        )),
        jwt_secret: "secret".to_string(),
        single_user_session: None,
    };

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
    let token = services::auth::create_jwt(1, &jwt_secret).unwrap();
    let state = AppState {
        db: Arc::new(db),
        password_worker: Arc::new(PasswordWorker::new_bcrypt(1).unwrap()),
        mailer: Some(Arc::new(
            SmtpTransport::builder_dangerous("localhost").build(),
        )),
        jwt_secret,
        single_user_session: None,
    };

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
