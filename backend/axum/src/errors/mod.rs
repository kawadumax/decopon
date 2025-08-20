use axum::{Json, http::StatusCode, response::IntoResponse};
use axum_password_worker::{Bcrypt, PasswordWorkerError};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiError {
    // 業務的（ドメイン）エラー
    #[error("not found: {0}")]
    NotFound(&'static str),

    #[error("conflict: {0}")]
    Conflict(&'static str),

    #[error("bad request: {0}")]
    BadRequest(String),

    #[error("unauthorized")]
    Unauthorized,

    // 外部ライブラリのラップ（原因は source に残す）
    #[error("database error")]
    Db(#[source] sea_orm::DbErr),

    #[error("password error")]
    Password(#[source] PasswordWorkerError<Bcrypt>),

    // 想定外
    #[error("internal server error")]
    Internal(#[source] Box<dyn std::error::Error + Send + Sync>),
}

#[derive(Debug, Serialize)]
struct ErrorBody<'a> {
    code: u16,
    // クライアント向けの安全なメッセージ
    message: &'a str,
}

// ApiError -> HTTP レスポンス（JSON）へ
impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        // 内部原因はログにだけ出す
        // tracing::error!(error = ?self, "request failed");

        let (status, msg): (StatusCode, &str) = match &self {
            // 業務系
            ApiError::NotFound(_) => (StatusCode::NOT_FOUND, "Not found"),
            ApiError::Conflict(_) => (StatusCode::CONFLICT, "Conflict"),
            ApiError::BadRequest(_) => (StatusCode::BAD_REQUEST, "Bad request"),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),

            // ライブラリ系は “安全な” メッセージに正規化
            ApiError::Db(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            ApiError::Password(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Password error"),

            ApiError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal error"),
        };

        let body = ErrorBody {
            code: status.as_u16(),
            message: msg,
        };
        (status, Json(body)).into_response()
    }
}
