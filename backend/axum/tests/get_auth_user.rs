#![cfg(feature = "web")]

mod common;

use axum::{
    body::{Body, to_bytes},
    http::{Request, StatusCode, header::AUTHORIZATION},
};
use sea_orm::{ActiveModelTrait, Set};
use tower::ServiceExt;

use decopon_axum::{
    dto::auth::GetAuthUserResponse, entities::users, routes, usecases,
};

use common::{build_app_state, setup_in_memory_db};

#[tokio::test]
async fn get_auth_user_via_header() {
    let db = setup_in_memory_db(false).await;

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

    let app = routes::auth::routes().with_state(build_app_state(&db, jwt_secret));

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
