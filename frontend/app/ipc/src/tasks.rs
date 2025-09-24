use async_trait::async_trait;
use chrono::{DateTime, Utc};
use decopon_services::{
    usecases::tasks::{self as task_usecases},
    ServiceError,
};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::{IpcError, IpcResult};

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TaskTag {
    pub id: i32,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<task_usecases::TaskTag> for TaskTag {
    fn from(value: task_usecases::TaskTag) -> Self {
        Self {
            id: value.id,
            name: value.name,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub completed: bool,
    pub parent_task_id: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<TaskTag>,
}

impl From<task_usecases::Task> for Task {
    fn from(value: task_usecases::Task) -> Self {
        Self {
            id: value.id,
            title: value.title,
            description: value.description,
            completed: value.completed,
            parent_task_id: value.parent_task_id,
            created_at: value.created_at,
            updated_at: value.updated_at,
            tags: value.tags.into_iter().map(TaskTag::from).collect(),
        }
    }
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TaskListRequest {
    pub user_id: i32,
    #[serde(default)]
    pub tag_ids: Option<Vec<i32>>,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub user_id: i32,
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub parent_task_id: Option<i32>,
    #[serde(default)]
    pub tag_ids: Option<Vec<i32>>,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskRequest {
    pub id: i32,
    pub user_id: i32,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub completed: Option<bool>,
    #[serde(default)]
    pub parent_task_id: Option<i32>,
    #[serde(default)]
    pub tag_ids: Option<Vec<i32>>,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteTaskRequest {
    pub id: i32,
    pub user_id: i32,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TaskResponse {
    pub task: Task,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TasksResponse {
    pub tasks: Vec<Task>,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteTaskResponse {
    pub success: bool,
}

#[async_trait]
pub trait TaskHandler: Send + Sync {
    async fn list_tasks(&self, request: TaskListRequest) -> Result<Vec<Task>, ServiceError>;
    async fn create_task(&self, request: CreateTaskRequest) -> Result<Task, ServiceError>;
    async fn update_task(&self, request: UpdateTaskRequest) -> Result<Task, ServiceError>;
    async fn delete_task(&self, request: DeleteTaskRequest) -> Result<bool, ServiceError>;
}

#[tauri::command]
pub async fn list_tasks<S>(
    services: State<'_, S>,
    request: TaskListRequest,
) -> IpcResult<TasksResponse>
where
    S: TaskHandler,
{
    services
        .inner()
        .list_tasks(request)
        .await
        .map(|tasks| TasksResponse { tasks })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn create_task<S>(
    services: State<'_, S>,
    request: CreateTaskRequest,
) -> IpcResult<TaskResponse>
where
    S: TaskHandler,
{
    services
        .inner()
        .create_task(request)
        .await
        .map(|task| TaskResponse { task })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn update_task<S>(
    services: State<'_, S>,
    request: UpdateTaskRequest,
) -> IpcResult<TaskResponse>
where
    S: TaskHandler,
{
    services
        .inner()
        .update_task(request)
        .await
        .map(|task| TaskResponse { task })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn delete_task<S>(
    services: State<'_, S>,
    request: DeleteTaskRequest,
) -> IpcResult<DeleteTaskResponse>
where
    S: TaskHandler,
{
    services
        .inner()
        .delete_task(request)
        .await
        .map(|success| DeleteTaskResponse { success })
        .map_err(IpcError::from)
}
