pub mod auth;
pub mod error;
pub mod tasks;

pub use auth::{AuthHandler, AuthLoginRequest, AuthLoginResponse, AuthSession};
pub use error::{IpcError, IpcResult};
pub use tasks::{
    CreateTaskRequest, DeleteTaskRequest, DeleteTaskResponse, Task, TaskHandler, TaskListRequest,
    TaskResponse, TaskTag, TasksResponse, UpdateTaskRequest,
};

pub fn register<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
        auth::single_user_session,
        auth::login,
        tasks::list_tasks,
        tasks::create_task,
        tasks::update_task,
        tasks::delete_task,
    ])
}
