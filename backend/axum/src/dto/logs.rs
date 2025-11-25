use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};

use crate::usecases::logs::{Log, LogSource, LogTagInfo};

#[derive(Serialize)]
pub struct LogTagResponse {
    pub id: i32,
    pub name: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub user_id: i32,
}

impl From<LogTagInfo> for LogTagResponse {
    fn from(tag: LogTagInfo) -> Self {
        Self {
            id: tag.id,
            name: tag.name,
            created_at: tag.created_at,
            updated_at: tag.updated_at,
            user_id: tag.user_id,
        }
    }
}

#[derive(Serialize)]
pub struct LogResponse {
    pub id: i32,
    pub content: String,
    pub source: LogSource,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub user_id: i32,
    pub task_id: Option<i32>,
    pub tags: Vec<LogTagResponse>,
}

impl From<Log> for LogResponse {
    fn from(log: Log) -> Self {
        Self {
            id: log.id,
            content: log.content,
            source: log.source,
            created_at: log.created_at,
            updated_at: log.updated_at,
            user_id: log.user_id,
            task_id: log.task_id,
            tags: log.tags.into_iter().map(LogTagResponse::from).collect(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreLogRequest {
    pub content: String,
    pub source: LogSource,
    pub task_id: Option<i32>,
    #[serde(default)]
    pub tag_ids: Vec<i32>,
    #[serde(default)]
    pub tag_names: Vec<String>,
}
