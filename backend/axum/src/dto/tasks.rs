use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};

use crate::usecases::tasks::{Task, TaskTag};

#[derive(Serialize)]
pub struct TaskResponse {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub completed: bool,
    pub parent_task_id: Option<i32>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub tags: Vec<TaskTagResponse>,
}

impl From<Task> for TaskResponse {
    fn from(task: Task) -> Self {
        Self {
            id: task.id,
            title: task.title,
            description: task.description,
            completed: task.completed,
            parent_task_id: task.parent_task_id,
            created_at: task.created_at,
            updated_at: task.updated_at,
            tags: task.tags.into_iter().map(TaskTagResponse::from).collect(),
        }
    }
}

#[derive(Serialize)]
pub struct TaskTagResponse {
    pub id: i32,
    pub name: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

impl From<TaskTag> for TaskTagResponse {
    fn from(tag: TaskTag) -> Self {
        Self {
            id: tag.id,
            name: tag.name,
            created_at: tag.created_at,
            updated_at: tag.updated_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreTaskRequest {
    pub title: String,
    pub description: String,
    pub parent_task_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub completed: Option<bool>,
    pub parent_task_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
}
