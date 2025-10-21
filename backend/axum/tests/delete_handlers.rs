#![cfg(feature = "web")]

use std::sync::Arc;

use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use axum_password_worker::PasswordWorker;
use lettre::SmtpTransport;
use sea_orm::{ActiveModelTrait, Database, Set};
use tower::ServiceExt;

use decopon_axum::{
    AppState, ServiceContext, entities::users, middleware::auth::AuthenticatedUser, routes,
    usecases,
};
use migration::{Migrator, MigratorTrait};

#[tokio::test]
async fn logout_returns_no_content() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    let db = Arc::new(db);

    let jwt_secret = "test_secret".to_string();

    let state = ServiceContext::builder(
        db.clone(),
        Arc::new(PasswordWorker::new_bcrypt(1).unwrap()),
        jwt_secret,
    )
    .mailer(Some(Arc::new(
        SmtpTransport::builder_dangerous("localhost").build(),
    )))
    .build();

    let app = routes::auth::routes().with_state(AppState::from(state));

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
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    let db = Arc::new(db);

    let jwt_secret = "test_secret".to_string();

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

    let state = ServiceContext::builder(
        db.clone(),
        Arc::new(PasswordWorker::new_bcrypt(1).unwrap()),
        jwt_secret,
    )
    .mailer(Some(Arc::new(
        SmtpTransport::builder_dangerous("localhost").build(),
    )))
    .build();

    let app = routes::tags::routes().with_state(AppState::from(state));

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
