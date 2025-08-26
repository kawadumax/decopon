use std::sync::Arc;

use chrono::Utc;
use sea_orm::{ActiveModelTrait, Database, Set};

use decopon_axum::{
    entities::users,
    services::decopon_sessions::{self, NewDecoponSession, DecoponSessionUpdate},
};
use migration::{Migrator, MigratorTrait};

#[tokio::test]
async fn start_and_end_session() {
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

    let params = NewDecoponSession {
        status: "In_Progress".to_string(),
        started_at: Utc::now(),
        ended_at: None,
        user_id: user.id,
    };
    let session = decopon_sessions::insert_session(db.as_ref(), params)
        .await
        .unwrap();
    assert!(session.ended_at.is_none());

    let ended_at = Utc::now();
    let params = DecoponSessionUpdate {
        id: session.id,
        status: Some("Completed".to_string()),
        ended_at: Some(ended_at),
        user_id: user.id,
    };
    let session = decopon_sessions::update_session(db.as_ref(), params)
        .await
        .unwrap();
    assert_eq!(session.ended_at, Some(ended_at));
}
