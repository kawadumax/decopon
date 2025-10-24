#![cfg(feature = "web")]

mod common;

use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use sea_orm::{ActiveModelTrait, Set};
use tower::ServiceExt;

use decopon_axum::{entities::users, middleware::auth::AuthenticatedUser, routes, usecases};

use common::{build_app_state, setup_in_memory_db};

#[tokio::test]
async fn logout_returns_no_content() {
    let db = setup_in_memory_db(false).await;
    let app = routes::auth::routes().with_state(build_app_state(&db, "test_secret"));

    let response = app
        .oneshot(
            Request::builder()
                .method(axum::http::Method::DELETE)
                .uri("/sessions")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn delete_tags_returns_no_content() {
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

    let tag1 = usecases::tags::insert_tag(
        &db,
        usecases::tags::NewTag {
            name: "tag1".to_string(),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let tag2 = usecases::tags::insert_tag(
        &db,
        usecases::tags::NewTag {
            name: "tag2".to_string(),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let app = routes::tags::routes().with_state(build_app_state(&db, "test_secret"));

    let auth_user = AuthenticatedUser {
        id: user.id,
        exp: 0,
    };

    let payload = serde_json::json!({ "tag_ids": [tag1.id, tag2.id] });

    let response = app
        .oneshot(
            Request::builder()
                .method(axum::http::Method::DELETE)
                .uri("/multiple")
                .extension(auth_user)
                .header(axum::http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NO_CONTENT);
}
