use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};

use crate::services::logs::{Log, LogSource};

#[derive(Serialize)]
pub struct LogResponseDto {
    pub id: i32,
    pub content: String,
    pub source: LogSource,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub user_id: i32,
    pub task_id: Option<i32>,
}

impl From<Log> for LogResponseDto {
    fn from(log: Log) -> Self {
        Self {
            id: log.id,
            content: log.content,
            source: log.source,
            created_at: log.created_at,
            updated_at: log.updated_at,
            user_id: log.user_id,
            task_id: log.task_id,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreLogRequestDto {
    pub content: String,
    pub source: LogSource,
    pub task_id: Option<i32>,
}
