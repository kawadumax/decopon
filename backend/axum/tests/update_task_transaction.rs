use decopon_axum::{
    entities::{prelude::*, tasks, users},
    services,
};
use migration::{Migrator, MigratorTrait};
use sea_orm::{
    ActiveModelTrait, ConnectionTrait, Database, DbBackend, EntityTrait, Set, Statement,
};

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
