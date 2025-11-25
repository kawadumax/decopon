#![cfg(feature = "web")]

mod common;

use axum::{
    body::{Body, to_bytes},
    http::{Request, StatusCode, header::CONTENT_TYPE},
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use tower::ServiceExt;

use decopon_axum::{
    entities::{prelude::*, tag_task, users},
    middleware::auth::AuthenticatedUser,
    routes, usecases,
};

use common::{build_app_state, setup_in_memory_db};

#[tokio::test]
async fn task_creation_attaches_tags() {
    let db = setup_in_memory_db(true).await;

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

    let app = routes::tasks::routes().with_state(build_app_state(&db, "test_secret"));

    let auth_user = AuthenticatedUser {
        id: user.id,
        exp: 0,
    };

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
    let task: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let task_id = task["id"].as_i64().unwrap() as i32;
    let tags = task["tags"].as_array().unwrap();
    assert_eq!(tags.len(), 2);
    let response_tag_ids: Vec<i32> = tags
        .iter()
        .map(|tag| tag["id"].as_i64().unwrap() as i32)
        .collect();
    assert!(response_tag_ids.contains(&tag1.id));
    assert!(response_tag_ids.contains(&tag2.id));
    let response_tag_names: Vec<&str> = tags
        .iter()
        .map(|tag| tag["name"].as_str().unwrap())
        .collect();
    assert!(response_tag_names.contains(&"tag1"));
    assert!(response_tag_names.contains(&"tag2"));

    let relations = TagTask::find()
        .filter(tag_task::Column::TaskId.eq(task_id))
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
    let db = setup_in_memory_db(true).await;

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

    let task = usecases::tasks::insert_task(
        db.as_ref(),
        usecases::tasks::NewTask {
            title: "task".to_string(),
            description: "desc".to_string(),
            parent_task_id: None,
            tag_ids: Some(vec![tag1.id]),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let app = routes::tasks::routes().with_state(build_app_state(&db, "test_secret"));

    let auth_user = AuthenticatedUser {
        id: user.id,
        exp: 0,
    };

    let payload = serde_json::json!({
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
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let task_json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let tags = task_json["tags"].as_array().unwrap();
    assert_eq!(tags.len(), 1);
    assert_eq!(tags[0]["id"].as_i64().unwrap() as i32, tag2.id);
    assert_eq!(tags[0]["name"].as_str().unwrap(), "tag2");

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
    let db = setup_in_memory_db(true).await;

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

    let task = usecases::tasks::insert_task(
        db.as_ref(),
        usecases::tasks::NewTask {
            title: "task".to_string(),
            description: "desc".to_string(),
            parent_task_id: None,
            tag_ids: Some(vec![tag1.id, tag2.id]),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let app = routes::tasks::routes().with_state(build_app_state(&db, "test_secret"));

    let auth_user = AuthenticatedUser {
        id: user.id,
        exp: 0,
    };

    let response = app
        .oneshot(
            Request::builder()
                .method(axum::http::Method::DELETE)
                .uri(format!("/{}", task.id))
                .extension(auth_user)
                .body(Body::empty())
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

#[tokio::test]
async fn tasks_index_filters_by_tag() {
    let db = setup_in_memory_db(true).await;

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

    let task1 = usecases::tasks::insert_task(
        db.as_ref(),
        usecases::tasks::NewTask {
            title: "task1".to_string(),
            description: "desc".to_string(),
            parent_task_id: None,
            tag_ids: Some(vec![tag1.id]),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let task2 = usecases::tasks::insert_task(
        db.as_ref(),
        usecases::tasks::NewTask {
            title: "task2".to_string(),
            description: "desc".to_string(),
            parent_task_id: None,
            tag_ids: Some(vec![tag2.id]),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let app = routes::tasks::routes().with_state(build_app_state(&db, "test_secret"));

    let auth_user = AuthenticatedUser {
        id: user.id,
        exp: 0,
    };

    let response = app
        .oneshot(
            Request::builder()
                .method(axum::http::Method::GET)
                .uri(format!("/?tag_ids={}&tag_ids={}", tag1.id, tag2.id))
                .extension(auth_user)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let tasks: Vec<serde_json::Value> = serde_json::from_slice(&body).unwrap();
    assert_eq!(tasks.len(), 2);
    let ids: Vec<i32> = tasks
        .iter()
        .map(|t| t["id"].as_i64().unwrap() as i32)
        .collect();
    assert!(ids.contains(&task1.id));
    assert!(ids.contains(&task2.id));
    for task in tasks {
        let tags = task["tags"].as_array().unwrap();
        assert_eq!(tags.len(), 1);
        let tag_name = tags[0]["name"].as_str().unwrap();
        assert!(tag_name == "tag1" || tag_name == "tag2");
    }
}
