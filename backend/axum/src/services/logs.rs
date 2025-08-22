use crate::{
    entities::{prelude::*, logs},
    errors::ApiError,
};

use sea_orm::{ActiveValue, DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait};
use sea_orm::prelude::DateTimeUtc;

pub struct NewLog {
    pub content: String,
    pub source: String,
    pub task_id: Option<i32>,
    pub user_id: i32,
}

pub struct Log {
    pub id: i32,
    pub content: String,
    pub source: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub user_id: i32,
    pub task_id: Option<i32>,
}

impl From<logs::Model> for Log {
    fn from(model: logs::Model) -> Self {
        Self {
            id: model.id,
            content: model.content,
            source: model.source,
            created_at: model.created_at,
            updated_at: model.updated_at,
            user_id: model.user_id,
            task_id: model.task_id,
        }
    }
}

pub async fn get_logs(db: &DatabaseConnection, user_id: i32) -> Result<Vec<Log>, ApiError> {
    let logs = Logs::find()
        .filter(logs::Column::UserId.eq(user_id))
        .all(db)
        .await?;
    Ok(logs.into_iter().map(Into::into).collect())
}

pub async fn get_logs_by_task(
    db: &DatabaseConnection,
    user_id: i32,
    task_id: i32,
) -> Result<Vec<Log>, ApiError> {
    let logs = Logs::find()
        .filter(logs::Column::UserId.eq(user_id))
        .filter(logs::Column::TaskId.eq(task_id))
        .all(db)
        .await?;
    Ok(logs.into_iter().map(Into::into).collect())
}

pub async fn insert_log(db: &DatabaseConnection, params: NewLog) -> Result<Log, ApiError> {
    let new_log = logs::ActiveModel {
        content: ActiveValue::Set(params.content),
        source: ActiveValue::Set(params.source),
        task_id: ActiveValue::Set(params.task_id),
        user_id: ActiveValue::Set(params.user_id),
        ..Default::default()
    };
    let result = Logs::insert(new_log).exec(db).await?;
    let log = Logs::find_by_id(result.last_insert_id)
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("log"))?;
    Ok(log.into())
}
