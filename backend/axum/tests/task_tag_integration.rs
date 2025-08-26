use std::sync::Arc;

use axum::{
    body::{Body, to_bytes},
    http::{Request, StatusCode, header::CONTENT_TYPE},
};
use axum_password_worker::PasswordWorker;
use lettre::SmtpTransport;
use migration::{Migrator, MigratorTrait};
use sea_orm::{
    ActiveModelTrait, Database, DbBackend, EntityTrait, Set, Statement, ColumnTrait, QueryFilter,
};
use tower::ServiceExt;

use decopon_axum::{
    AppState,
    dto::tasks::TaskResponseDto,
    entities::{prelude::*, tag_task, users},
    middleware::auth::AuthenticatedUser,
    routes,
    services,
};

#[tokio::test]
async fn task_creation_attaches_tags() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    db.execute(Statement::from_string(DbBackend::Sqlite, "PRAGMA foreign_keys = ON".to_owned()))
        .await
        .unwrap();
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

    let tag1 = services::tags::insert_tag(
        &db,
        services::tags::NewTag {
            name: "tag1".to_string(),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let tag2 = services::tags::insert_tag(
        &db,
        services::tags::NewTag {
            name: "tag2".to_string(),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let password_worker = Arc::new(PasswordWorker::new_bcrypt(1).unwrap());
    let mailer = Arc::new(SmtpTransport::builder_dangerous("localhost").build());
    let jwt_secret = "test_secret".to_string();

    let app = routes::tasks::routes().with_state(AppState {
        db: db.clone(),
        password_worker,
        mailer,
        jwt_secret,
    });

    let auth_user = AuthenticatedUser { id: user.id, exp: 0 };

    let payload = serde_json::json!({
        "title": "task",
        "description": "desc",
        "parent_task_id": null,
        "tag_ids": [tag1.id, tag2.id]
    });

    let response = app
        .oneshot(
            Request::builder()
                .method(axum::http::Method::POST)
                .uri("/")
                .extension(auth_user)
                .header(CONTENT_TYPE, "application/json")
                .body(Body::from(payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let task: TaskResponseDto = serde_json::from_slice(&body).unwrap();

    let relations = TagTask::find()
        .filter(tag_task::Column::TaskId.eq(task.id))
        .all(db.as_ref())
        .await
        .unwrap();
    assert_eq!(relations.len(), 2);
    let tag_ids: Vec<i32> = relations.into_iter().map(|r| r.tag_id).collect();
    assert!(tag_ids.contains(&tag1.id));
    assert!(tag_ids.contains(&tag2.id));
}

#[tokio::test]
async fn task_update_syncs_tags() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    db.execute(Statement::from_string(DbBackend::Sqlite, "PRAGMA foreign_keys = ON".to_owned()))
        .await
        .unwrap();
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

    let tag1 = services::tags::insert_tag(
        &db,
        services::tags::NewTag {
            name: "tag1".to_string(),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let tag2 = services::tags::insert_tag(
        &db,
        services::tags::NewTag {
            name: "tag2".to_string(),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let task = services::tasks::insert_task(
        db.as_ref(),
        services::tasks::NewTask {
            title: "task".to_string(),
            description: "desc".to_string(),
            parent_task_id: None,
            tag_ids: Some(vec![tag1.id]),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let password_worker = Arc::new(PasswordWorker::new_bcrypt(1).unwrap());
    let mailer = Arc::new(SmtpTransport::builder_dangerous("localhost").build());
    let jwt_secret = "test_secret".to_string();

    let app = routes::tasks::routes().with_state(AppState {
        db: db.clone(),
        password_worker,
        mailer,
        jwt_secret,
    });

    let auth_user = AuthenticatedUser { id: user.id, exp: 0 };

    let payload = serde_json::json!({
        "id": task.id,
        "title": null,
        "description": null,
        "completed": null,
        "parent_task_id": null,
        "tag_ids": [tag2.id]
    });

    let response = app
        .oneshot(
            Request::builder()
                .method(axum::http::Method::PUT)
                .uri(format!("/{}", task.id))
                .extension(auth_user)
                .header(CONTENT_TYPE, "application/json")
                .body(Body::from(payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let relations = TagTask::find()
        .filter(tag_task::Column::TaskId.eq(task.id))
        .all(db.as_ref())
        .await
        .unwrap();
    assert_eq!(relations.len(), 1);
    assert_eq!(relations[0].tag_id, tag2.id);
}

#[tokio::test]
async fn task_delete_detaches_tags() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    db.execute(Statement::from_string(DbBackend::Sqlite, "PRAGMA foreign_keys = ON".to_owned()))
        .await
        .unwrap();
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

    let tag1 = services::tags::insert_tag(
        &db,
        services::tags::NewTag {
            name: "tag1".to_string(),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let tag2 = services::tags::insert_tag(
        &db,
        services::tags::NewTag {
            name: "tag2".to_string(),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let task = services::tasks::insert_task(
        db.as_ref(),
        services::tasks::NewTask {
            title: "task".to_string(),
            description: "desc".to_string(),
            parent_task_id: None,
            tag_ids: Some(vec![tag1.id, tag2.id]),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let password_worker = Arc::new(PasswordWorker::new_bcrypt(1).unwrap());
    let mailer = Arc::new(SmtpTransport::builder_dangerous("localhost").build());
    let jwt_secret = "test_secret".to_string();

    let app = routes::tasks::routes().with_state(AppState {
        db: db.clone(),
        password_worker,
        mailer,
        jwt_secret,
    });

    let auth_user = AuthenticatedUser { id: user.id, exp: 0 };

    let payload = serde_json::json!({ "id": task.id });

    let response = app
        .oneshot(
            Request::builder()
                .method(axum::http::Method::DELETE)
                .uri(format!("/{}", task.id))
                .extension(auth_user)
                .header(CONTENT_TYPE, "application/json")
                .body(Body::from(payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NO_CONTENT);
    let relations = TagTask::find()
        .filter(tag_task::Column::TaskId.eq(task.id))
        .all(db.as_ref())
        .await
        .unwrap();
    assert!(relations.is_empty());
    let task = Tasks::find_by_id(task.id).one(db.as_ref()).await.unwrap();
    assert!(task.is_none());
}
