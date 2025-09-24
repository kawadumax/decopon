use serde::Serialize;

use crate::services::{AuthError, ServiceError, TaskError};

/// Result type used by IPC handlers.
pub type IpcResult<T> = Result<T, IpcError>;

/// Error payload returned by IPC handlers.
#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IpcError {
    pub code: &'static str,
    pub message: String,
}

impl IpcError {
    pub fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }

    fn from_auth(error: AuthError) -> Self {
        match error {
            AuthError::InvalidCredentials => Self::new(
                "auth.invalidCredentials",
                "メールアドレスまたはパスワードが正しくありません。",
            ),
            AuthError::Misconfigured(details) => Self::new(
                "auth.misconfigured",
                format!("認証設定が正しくありません: {details}"),
            ),
        }
    }

    fn from_task(error: TaskError) -> Self {
        match error {
            TaskError::NotFound => {
                Self::new("tasks.notFound", "指定されたタスクが見つかりませんでした。")
            }
            TaskError::Validation(message) => Self::new(
                "tasks.validation",
                message.unwrap_or_else(|| "入力値が正しくありません。".to_string()),
            ),
        }
    }
}

impl From<ServiceError> for IpcError {
    fn from(value: ServiceError) -> Self {
        match value {
            ServiceError::Auth(error) => Self::from_auth(error),
            ServiceError::Task(error) => Self::from_task(error),
            ServiceError::Unknown(message) => Self::new(
                "internal",
                format!("予期しないエラーが発生しました: {message}"),
            ),
        }
    }
}

impl From<AuthError> for IpcError {
    fn from(value: AuthError) -> Self {
        Self::from_auth(value)
    }
}

impl From<TaskError> for IpcError {
    fn from(value: TaskError) -> Self {
        Self::from_task(value)
    }
}
