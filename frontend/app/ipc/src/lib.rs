pub mod auth;
pub mod error;
pub mod tasks;

pub use auth::{
    AuthConfirmPasswordRequest, AuthCurrentUserRequest, AuthCurrentUserResponse,
    AuthForgotPasswordRequest, AuthHandler, AuthLoginRequest, AuthLoginResponse,
    AuthRegisterRequest, AuthRegisterResponse, AuthResendVerificationRequest,
    AuthResetPasswordRequest, AuthSession, AuthStatusResponse, AuthUser, AuthVerifyEmailRequest,
};
pub use error::{IpcError, IpcResult};
pub use tasks::{
    CreateTaskRequest, DeleteTaskRequest, DeleteTaskResponse, Task, TaskHandler, TaskListRequest,
    TaskResponse, TaskTag, TasksResponse, UpdateTaskRequest,
};

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
        tasks::list_tasks,
        tasks::create_task,
        tasks::update_task,
        tasks::delete_task,
    ])
}
