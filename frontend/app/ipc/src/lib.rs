pub mod auth;
pub mod error;
pub mod tasks;

use std::sync::Arc;

pub use auth::{
    AuthConfirmPasswordRequest, AuthCurrentUserRequest, AuthCurrentUserResponse,
    AuthForgotPasswordRequest, AuthHandler, AuthLoginRequest, AuthLoginResponse,
    AuthRegisterRequest, AuthRegisterResponse, AuthResendVerificationRequest,
    AuthResetPasswordRequest, AuthSession, AuthStatusResponse, AuthUser, AuthVerifyEmailRequest,
};
pub use error::{IpcError, IpcResult};
pub use tasks::{
    CreateTaskRequest, DeleteTaskRequest, DeleteTaskResponse, GetTaskRequest, Task, TaskHandler,
    TaskListRequest, TaskResponse, TaskTag, TasksResponse, UpdateTaskRequest,
};

pub trait AppIpcHandler: AuthHandler + TaskHandler {}

impl<T> AppIpcHandler for T where T: AuthHandler + TaskHandler {}

pub type AppIpcState = Arc<dyn AppIpcHandler>;

pub fn register<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
        auth::single_user_session,
        auth::login,
        auth::register,
        auth::current_user,
        auth::logout,
        auth::forgot_password,
        auth::reset_password,
        auth::confirm_password,
        auth::verify_email,
        auth::resend_verification,
        tasks::get_task,
        tasks::list_tasks,
        tasks::create_task,
        tasks::update_task,
        tasks::delete_task,
    ])
}
