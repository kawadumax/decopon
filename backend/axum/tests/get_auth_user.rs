use std::sync::Arc;

use axum::{
    body::{Body, to_bytes},
    http::{Request, StatusCode, header::AUTHORIZATION},
};
use axum_password_worker::PasswordWorker;
use sea_orm::{ActiveModelTrait, Database, Set};
use tower::ServiceExt;

use decopon_axum::{
    AppState, ServiceContext, dto::auth::GetAuthUserResponse, entities::users, routes, usecases,
};
use lettre::SmtpTransport;
use migration::{Migrator, MigratorTrait};

#[tokio::test]
async fn get_auth_user_via_header() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    let db = Arc::new(db);

    let user = users::ActiveModel {
        name: Set("Test User".to_string()),
        email: Set("test@example.com".to_string()),
        password: Set("hashed".to_string()),
        work_time: Set(25),
        break_time: Set(5),
        locale: Set("ja".to_string()),
        ..Default::default()
    }
    .insert(db.as_ref())
    .await
    .unwrap();
    let jwt_secret = "test_secret".to_string();
    let token = usecases::auth::create_jwt(user.id, &jwt_secret).unwrap();

    let state = ServiceContext::builder(
        db.clone(),
        Arc::new(PasswordWorker::new_bcrypt(1).unwrap()),
        jwt_secret.clone(),
    )
    .mailer(Some(Arc::new(
        SmtpTransport::builder_dangerous("localhost").build(),
    )))
    .build();

    let app = routes::auth::routes().with_state(AppState::from(state));

    let response = app
        .oneshot(
            Request::builder()
                .uri("/users")
                .header(AUTHORIZATION, format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let json: GetAuthUserResponse = serde_json::from_slice(&body).unwrap();
    assert_eq!(json.user.email, "test@example.com");
}
