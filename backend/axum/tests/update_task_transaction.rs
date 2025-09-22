use decopon_axum::{
    entities::{prelude::*, tasks, users},
    services,
};
use migration::{Migrator, MigratorTrait};
use sea_orm::{
    ActiveModelTrait, ConnectionTrait, Database, DbBackend, EntityTrait, Set, Statement,
};

#[tokio::test]
async fn insert_task_returns_related_tags() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    db.execute(Statement::from_string(
        DbBackend::Sqlite,
        "PRAGMA foreign_keys = ON".to_owned(),
    ))
    .await
    .unwrap();

    let user = users::ActiveModel {
        name: Set("Test User".to_string()),
        email: Set("test@example.com".to_string()),
        password: Set("hashed".to_string()),
        work_time: Set(25),
        break_time: Set(5),
        locale: Set("ja".to_string()),
        ..Default::default()
    }
    .insert(&db)
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
        &db,
        services::tasks::NewTask {
            title: "New Task".to_string(),
            description: "desc".to_string(),
            parent_task_id: None,
            tag_ids: Some(vec![tag1.id, tag2.id]),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    assert_eq!(task.tags.len(), 2);
    let mut tag_ids: Vec<i32> = task.tags.iter().map(|tag| tag.id).collect();
    tag_ids.sort_unstable();
    assert_eq!(tag_ids, vec![tag1.id, tag2.id]);
    let tag_names: Vec<&str> = task.tags.iter().map(|tag| tag.name.as_str()).collect();
    assert!(tag_names.contains(&"tag1"));
    assert!(tag_names.contains(&"tag2"));
}

#[tokio::test]
async fn update_task_rollback_on_error() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    db.execute(Statement::from_string(
        DbBackend::Sqlite,
        "PRAGMA foreign_keys = ON".to_owned(),
    ))
    .await
    .unwrap();

    let user = users::ActiveModel {
        name: Set("Test User".to_string()),
        email: Set("test@example.com".to_string()),
        password: Set("hashed".to_string()),
        work_time: Set(25),
        break_time: Set(5),
        locale: Set("ja".to_string()),
        ..Default::default()
    }
    .insert(&db)
    .await
    .unwrap();

    let task = tasks::ActiveModel {
        title: Set("Old Title".to_string()),
        description: Set("desc".to_string()),
        completed: Set(false),
        user_id: Set(user.id),
        ..Default::default()
    }
    .insert(&db)
    .await
    .unwrap();

    let result = services::tasks::update_task(
        &db,
        services::tasks::TaskUpdate {
            id: task.id,
            title: Some("New Title".to_string()),
            description: None,
            completed: None,
            parent_task_id: None,
            tag_ids: Some(vec![999]),
            user_id: user.id,
        },
    )
    .await;

    assert!(result.is_err());

    let fetched = Tasks::find_by_id(task.id).one(&db).await.unwrap().unwrap();
    assert_eq!(fetched.title, "Old Title");
}

#[tokio::test]
async fn update_child_task_keeps_parent_relationship() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    db.execute(Statement::from_string(
        DbBackend::Sqlite,
        "PRAGMA foreign_keys = ON".to_owned(),
    ))
    .await
    .unwrap();

    let user = users::ActiveModel {
        name: Set("Test User".to_string()),
        email: Set("test@example.com".to_string()),
        password: Set("hashed".to_string()),
        work_time: Set(25),
        break_time: Set(5),
        locale: Set("ja".to_string()),
        ..Default::default()
    }
    .insert(&db)
    .await
    .unwrap();

    let parent = tasks::ActiveModel {
        title: Set("Parent".to_string()),
        description: Set("parent-desc".to_string()),
        completed: Set(false),
        user_id: Set(user.id),
        ..Default::default()
    }
    .insert(&db)
    .await
    .unwrap();

    let child = tasks::ActiveModel {
        title: Set("Child".to_string()),
        description: Set("child-desc".to_string()),
        completed: Set(false),
        parent_task_id: Set(Some(parent.id)),
        user_id: Set(user.id),
        ..Default::default()
    }
    .insert(&db)
    .await
    .unwrap();

    services::tasks::update_task(
        &db,
        services::tasks::TaskUpdate {
            id: child.id,
            title: Some("Updated Child".to_string()),
            description: None,
            completed: None,
            parent_task_id: None,
            tag_ids: None,
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let updated = Tasks::find_by_id(child.id).one(&db).await.unwrap().unwrap();
    assert_eq!(updated.title, "Updated Child");
    assert_eq!(updated.parent_task_id, Some(parent.id));
}

#[tokio::test]
async fn update_task_returns_related_tags() {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    db.execute(Statement::from_string(
        DbBackend::Sqlite,
        "PRAGMA foreign_keys = ON".to_owned(),
    ))
    .await
    .unwrap();

    let user = users::ActiveModel {
        name: Set("Test User".to_string()),
        email: Set("test@example.com".to_string()),
        password: Set("hashed".to_string()),
        work_time: Set(25),
        break_time: Set(5),
        locale: Set("ja".to_string()),
        ..Default::default()
    }
    .insert(&db)
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
        &db,
        services::tasks::NewTask {
            title: "Task".to_string(),
            description: "desc".to_string(),
            parent_task_id: None,
            tag_ids: Some(vec![tag1.id]),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    let task = services::tasks::update_task(
        &db,
        services::tasks::TaskUpdate {
            id: task.id,
            title: None,
            description: None,
            completed: None,
            parent_task_id: None,
            tag_ids: Some(vec![tag2.id]),
            user_id: user.id,
        },
    )
    .await
    .unwrap();

    assert_eq!(task.tags.len(), 1);
    assert_eq!(task.tags[0].id, tag2.id);
    assert_eq!(task.tags[0].name, "tag2");
}
