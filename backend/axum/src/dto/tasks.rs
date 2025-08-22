use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};

use crate::services::tasks::Task;

#[derive(Serialize)]
pub struct TaskResponseDto {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub completed: bool,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub parent_task_id: Option<i32>,
}

impl From<Task> for TaskResponseDto {
    fn from(task: Task) -> Self {
        Self {
            id: task.id,
            title: task.title,
            description: task.description,
            completed: task.completed,
            created_at: task.created_at,
            updated_at: task.updated_at,
            parent_task_id: task.parent_task_id,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct StoreTaskRequestDto {
    pub title: String,
    pub description: String,
    pub parent_task_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
}

#[derive(Serialize, Deserialize)]
pub struct UpdateTaskRequestDto {
    pub id: i32,
    pub title: Option<String>,
    pub description: Option<String>,
    pub completed: Option<bool>,
    pub parent_task_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
}

#[derive(Serialize, Deserialize)]
pub struct DeleteTaskRequestDto {
    pub id: i32,
}
