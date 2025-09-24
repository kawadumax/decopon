use serde::{Deserialize, Serialize};
use tauri::State;

use crate::services::{ServiceError, Services, Task, TaskUpdate};

use super::{IpcError, IpcResult};

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TaskDto {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub completed: bool,
}

impl From<Task> for TaskDto {
    fn from(value: Task) -> Self {
        Self {
            id: value.id,
            title: value.title,
            description: value.description,
            completed: value.completed,
        }
    }
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TaskResponse {
    pub task: TaskDto,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TasksResponse {
    pub tasks: Vec<TaskDto>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteTaskResponse {
    pub success: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskRequest {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub completed: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteTaskRequest {
    pub id: String,
}

#[tauri::command]
pub async fn list_tasks(services: State<'_, Services>) -> IpcResult<TasksResponse> {
    let tasks = services
        .tasks()
        .list_tasks()
        .into_iter()
        .map(TaskDto::from)
        .collect();

    tracing::debug!(target: "ipc::tasks", count = tasks.len(), "タスク一覧を取得しました");

    Ok(TasksResponse { tasks })
}

#[tauri::command]
pub async fn create_task(
    services: State<'_, Services>,
    request: CreateTaskRequest,
) -> IpcResult<TaskResponse> {
    tracing::info!(target: "ipc::tasks", title = %request.title, "タスク作成を実行します");

    services
        .tasks()
        .create_task(request.title, request.description)
        .map(|task| {
            tracing::info!(target: "ipc::tasks", id = %task.id, "タスクを作成しました");
            TaskResponse { task: task.into() }
        })
        .map_err(|error| {
            tracing::error!(target: "ipc::tasks", error = ?error, "タスクの作成に失敗しました");
            IpcError::from(ServiceError::from(error))
        })
}

#[tauri::command]
pub async fn update_task(
    services: State<'_, Services>,
    request: UpdateTaskRequest,
) -> IpcResult<TaskResponse> {
    tracing::info!(target: "ipc::tasks", id = %request.id, "タスク更新を実行します");

    let task_id = request.id.clone();
    let update = TaskUpdate {
        id: request.id,
        title: request.title,
        description: request.description,
        completed: request.completed,
    };

    services
        .tasks()
        .update_task(update)
        .map(|task| {
            tracing::info!(target: "ipc::tasks", id = %task.id, "タスクを更新しました");
            TaskResponse {
                task: task.into(),
            }
        })
        .map_err(|error| {
            tracing::error!(target: "ipc::tasks", id = %task_id, error = ?error, "タスクの更新に失敗しました");
            IpcError::from(ServiceError::from(error))
        })
}

#[tauri::command]
pub async fn delete_task(
    services: State<'_, Services>,
    request: DeleteTaskRequest,
) -> IpcResult<DeleteTaskResponse> {
    tracing::info!(target: "ipc::tasks", id = %request.id, "タスク削除を実行します");

    let task_id = request.id.clone();

    services
        .tasks()
        .delete_task(request.id)
        .map(|_| {
            tracing::info!(target: "ipc::tasks", id = %task_id, "タスクを削除しました");
            DeleteTaskResponse { success: true }
        })
        .map_err(|error| {
            tracing::error!(target: "ipc::tasks", id = %task_id, error = ?error, "タスクの削除に失敗しました");
            IpcError::from(ServiceError::from(error))
        })
}
