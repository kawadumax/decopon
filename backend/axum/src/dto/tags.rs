use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};

use crate::usecases::tags::Tag;

#[derive(Serialize)]
pub struct TagResponse {
    pub id: i32,
    pub name: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub task_count: u64,
}

impl From<Tag> for TagResponse {
    fn from(tag: Tag) -> Self {
        Self {
            id: tag.id,
            name: tag.name,
            created_at: tag.created_at,
            updated_at: tag.updated_at,
            task_count: tag.task_count,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreTagRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagRelationRequest {
    pub task_id: i32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteTagsRequest {
    pub tag_ids: Vec<i32>,
}
