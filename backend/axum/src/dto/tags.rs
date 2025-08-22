use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};

use crate::services::tags::Tag;

#[derive(Serialize)]
pub struct TagResponseDto {
    pub id: i32,
    pub name: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

impl From<Tag> for TagResponseDto {
    fn from(tag: Tag) -> Self {
        Self {
            id: tag.id,
            name: tag.name,
            created_at: tag.created_at,
            updated_at: tag.updated_at,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct StoreTagRequestDto {
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct TagRelationRequestDto {
    pub task_id: i32,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct DeleteTagsRequestDto {
    pub tag_ids: Vec<i32>,
}
