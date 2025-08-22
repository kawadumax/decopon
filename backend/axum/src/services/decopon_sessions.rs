use crate::{
    entities::{prelude::*, decopon_sessions},
    errors::ApiError,
};

use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, DeleteResult, PaginatorTrait};
use sea_orm::prelude::DateTimeUtc;
use chrono::{NaiveDate, NaiveDateTime, Utc, DateTime};

pub struct NewDecoponSession {
    pub status: String,
    pub started_at: DateTimeUtc,
    pub ended_at: Option<DateTimeUtc>,
    pub user_id: i32,
}

pub struct DecoponSessionUpdate {
    pub id: i32,
    pub status: Option<String>,
    pub ended_at: Option<DateTimeUtc>,
    pub user_id: i32,
}

pub struct DecoponSession {
    pub id: i32,
    pub status: String,
    pub started_at: DateTimeUtc,
    pub ended_at: Option<DateTimeUtc>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub user_id: i32,
}

impl From<decopon_sessions::Model> for DecoponSession {
    fn from(model: decopon_sessions::Model) -> Self {
        Self {
            id: model.id,
            status: model.status,
            started_at: model.started_at,
            ended_at: Some(model.ended_at),
            created_at: model.created_at,
            updated_at: model.updated_at,
            user_id: model.user_id,
        }
    }
}

pub async fn get_sessions(
    db: &DatabaseConnection,
    user_id: i32,
) -> Result<Vec<DecoponSession>, ApiError> {
    let sessions = DecoponSessions::find()
        .filter(decopon_sessions::Column::UserId.eq(user_id))
        .all(db)
        .await?;
    Ok(sessions.into_iter().map(Into::into).collect())
}

pub async fn get_session_by_id(
    db: &DatabaseConnection,
    id: i32,
    user_id: i32,
) -> Result<DecoponSession, ApiError> {
    let session = DecoponSessions::find_by_id(id)
        .filter(decopon_sessions::Column::UserId.eq(user_id))
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("decopon_session"))?;
    Ok(session.into())
}

pub async fn insert_session(
    db: &DatabaseConnection,
    params: NewDecoponSession,
) -> Result<DecoponSession, ApiError> {
    let new_session = decopon_sessions::ActiveModel {
        status: ActiveValue::Set(params.status),
        started_at: ActiveValue::Set(params.started_at),
        ended_at: ActiveValue::Set(params.ended_at.unwrap_or_else(|| Utc::now())),
        user_id: ActiveValue::Set(params.user_id),
        ..Default::default()
    };
    let result = DecoponSessions::insert(new_session).exec(db).await?;
    let session = DecoponSessions::find_by_id(result.last_insert_id)
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("decopon_session"))?;
    Ok(session.into())
}

pub async fn update_session(
    db: &DatabaseConnection,
    params: DecoponSessionUpdate,
) -> Result<DecoponSession, ApiError> {
    let DecoponSessionUpdate { id, status, ended_at, user_id } = params;
    let mut session: decopon_sessions::ActiveModel = DecoponSessions::find_by_id(id)
        .filter(decopon_sessions::Column::UserId.eq(user_id))
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("decopon_session"))?
        .into();

    if let Some(status) = status { session.status = ActiveValue::Set(status); }
    if let Some(ended_at) = ended_at { session.ended_at = ActiveValue::Set(ended_at); }
    session.updated_at = ActiveValue::Set(Utc::now());
    let session = session.update(db).await?;
    Ok(session.into())
}

pub async fn delete_session(
    db: &DatabaseConnection,
    id: i32,
    user_id: i32,
) -> Result<DeleteResult, ApiError> {
    DecoponSessions::delete_many()
        .filter(decopon_sessions::Column::Id.eq(id))
        .filter(decopon_sessions::Column::UserId.eq(user_id))
        .exec(db)
        .await
        .map_err(Into::into)
}

pub async fn count_completed_sessions_on(
    db: &DatabaseConnection,
    user_id: i32,
    date: NaiveDate,
) -> Result<u64, ApiError> {
    let start_ndt = NaiveDateTime::new(date, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
    let end_ndt = start_ndt + chrono::Duration::days(1);
    let start: DateTime<Utc> = DateTime::from_naive_utc_and_offset(start_ndt, Utc);
    let end: DateTime<Utc> = DateTime::from_naive_utc_and_offset(end_ndt, Utc);
    let count = DecoponSessions::find()
        .filter(decopon_sessions::Column::UserId.eq(user_id))
        .filter(decopon_sessions::Column::Status.eq("Completed"))
        .filter(decopon_sessions::Column::EndedAt.gte(start))
        .filter(decopon_sessions::Column::EndedAt.lt(end))
        .count(db)
        .await?;
    Ok(count)
}
