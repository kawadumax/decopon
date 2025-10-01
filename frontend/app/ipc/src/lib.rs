pub mod auth;
pub mod decopon_sessions;
pub mod error;
pub mod logs;
pub mod preferences;
pub mod tasks;

use std::sync::Arc;

pub use auth::{
    AuthConfirmPasswordRequest, AuthCurrentUserRequest, AuthCurrentUserResponse,
    AuthForgotPasswordRequest, AuthHandler, AuthLoginRequest, AuthLoginResponse,
    AuthRegisterRequest, AuthRegisterResponse, AuthResendVerificationRequest,
    AuthResetPasswordRequest, AuthSession, AuthStatusResponse, AuthUser, AuthVerifyEmailRequest,
};
pub use decopon_sessions::{
    CountDecoponCyclesRequest, CreateDecoponSessionRequest, CycleCountResponse, DecoponSession,
    DecoponSessionHandler, DecoponSessionResponse, DecoponSessionsResponse,
    DeleteDecoponSessionRequest, DeleteDecoponSessionResponse, GetDecoponSessionRequest,
    ListDecoponSessionsRequest, UpdateDecoponSessionRequest,
};
pub use error::{IpcError, IpcResult};
pub use logs::{
    CreateLogRequest, Log, LogHandler, LogListByTaskRequest, LogListRequest, LogListResponse,
    LogResponse, LogSource,
};
pub use preferences::{PreferenceHandler, PreferenceResponse, UpdatePreferenceRequest};
pub use tasks::{
    CreateTaskRequest, DeleteTaskRequest, DeleteTaskResponse, GetTaskRequest, Task, TaskHandler,
    TaskListRequest, TaskResponse, TaskTag, TasksResponse, UpdateTaskRequest,
};

pub trait AppIpcHandler:
    AuthHandler + TaskHandler + DecoponSessionHandler + LogHandler + PreferenceHandler
{
}

impl<T> AppIpcHandler for T where
    T: AuthHandler + TaskHandler + DecoponSessionHandler + LogHandler + PreferenceHandler
{
}

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
        decopon_sessions::list_decopon_sessions,
        decopon_sessions::get_decopon_session,
        decopon_sessions::create_decopon_session,
        decopon_sessions::update_decopon_session,
        decopon_sessions::delete_decopon_session,
        decopon_sessions::count_decopon_cycles,
        logs::list_logs,
        logs::list_logs_by_task,
        logs::create_log,
        preferences::update_preferences,
        tasks::get_task,
        tasks::list_tasks,
        tasks::create_task,
        tasks::update_task,
        tasks::delete_task,
    ])
}
