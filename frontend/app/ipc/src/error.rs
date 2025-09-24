use decopon_services::ServiceError;
use serde::Serialize;

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
}

impl From<ServiceError> for IpcError {
    fn from(error: ServiceError) -> Self {
        match error {
            ServiceError::Unauthorized => {
                IpcError::new("auth.unauthorized", "認証に失敗しました。")
            }
            ServiceError::NotFound(resource) => match resource {
                "task" => IpcError::new("tasks.notFound", "指定したタスクが存在しません。"),
                "user" => IpcError::new("auth.userNotFound", "ユーザーが見つかりませんでした。"),
                _ => IpcError::new(
                    "resource.notFound",
                    format!("{resource} が見つかりません。"),
                ),
            },
            ServiceError::Conflict(resource) => IpcError::new(
                "resource.conflict",
                format!("{resource} が既に存在するため処理できません。"),
            ),
            ServiceError::BadRequest(message) => IpcError::new("request.invalid", message),
            ServiceError::Db(err) => IpcError::new(
                "internal",
                format!("データベースエラーが発生しました: {err}"),
            ),
            ServiceError::Password(err) => IpcError::new(
                "internal",
                format!("パスワード処理でエラーが発生しました: {err}"),
            ),
            ServiceError::Mail(err) => {
                IpcError::new("mail.failed", format!("メールの送信に失敗しました: {err}"))
            }
            ServiceError::Internal(err) => {
                IpcError::new("internal", format!("内部エラーが発生しました: {err}"))
            }
        }
    }
}
