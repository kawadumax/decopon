use crate::{
    entities::{logs, prelude::*},
    errors::ApiError,
};

use sea_orm::prelude::DateTimeUtc;
use sea_orm::{ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum LogSource {
    System,
    User,
}

impl LogSource {
    fn as_str(&self) -> &'static str {
        match self {
            LogSource::System => "System",
            LogSource::User => "User",
        }
    }
}

impl From<String> for LogSource {
    fn from(value: String) -> Self {
        match value.as_str() {
            "System" => LogSource::System,
            _ => LogSource::User,
        }
    }
}

pub struct NewLog {
    pub content: String,
    pub source: LogSource,
    pub task_id: Option<i32>,
    pub user_id: i32,
}

pub struct Log {
    pub id: i32,
    pub content: String,
    pub source: LogSource,
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
            source: LogSource::from(model.source),
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
        source: ActiveValue::Set(params.source.as_str().to_owned()),
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
