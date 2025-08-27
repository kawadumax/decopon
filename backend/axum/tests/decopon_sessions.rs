use std::sync::Arc;

use chrono::{Duration, NaiveDate, TimeZone, Utc};
use sea_orm::{ActiveModelTrait, Database, Set};

use decopon_axum::{
    entities::users,
    services::decopon_sessions::{self, DecoponSessionUpdate, NewDecoponSession},
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

#[tokio::test]
async fn count_completed_sessions_on_filters_by_date_and_status() {
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

    let end_same_day = Utc.with_ymd_and_hms(2023, 1, 1, 10, 0, 0).unwrap();
    let params = NewDecoponSession {
        status: "Completed".to_string(),
        started_at: end_same_day - Duration::minutes(25),
        ended_at: Some(end_same_day),
        user_id: user.id,
    };
    decopon_sessions::insert_session(db.as_ref(), params)
        .await
        .unwrap();

    let params = NewDecoponSession {
        status: "In_Progress".to_string(),
        started_at: Utc.with_ymd_and_hms(2023, 1, 1, 12, 0, 0).unwrap(),
        ended_at: None,
        user_id: user.id,
    };
    decopon_sessions::insert_session(db.as_ref(), params)
        .await
        .unwrap();

    let end_other_day = Utc.with_ymd_and_hms(2023, 1, 2, 9, 0, 0).unwrap();
    let params = NewDecoponSession {
        status: "Completed".to_string(),
        started_at: end_other_day - Duration::minutes(25),
        ended_at: Some(end_other_day),
        user_id: user.id,
    };
    decopon_sessions::insert_session(db.as_ref(), params)
        .await
        .unwrap();

    let date = NaiveDate::from_ymd_opt(2023, 1, 1).unwrap();
    let count = decopon_sessions::count_completed_sessions_on(db.as_ref(), user.id, date)
        .await
        .unwrap();
    assert_eq!(count, 1);

    let date = NaiveDate::from_ymd_opt(2023, 1, 2).unwrap();
    let count = decopon_sessions::count_completed_sessions_on(db.as_ref(), user.id, date)
        .await
        .unwrap();
    assert_eq!(count, 1);
}
