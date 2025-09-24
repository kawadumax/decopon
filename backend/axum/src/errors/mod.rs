use axum::{Json, http::StatusCode, response::IntoResponse};
use axum_password_worker::{Bcrypt, PasswordWorkerError};
use jsonwebtoken::errors::Error as JwtError;
use lettre::transport::smtp::Error as SmtpError;
use serde::Serialize;
use thiserror::Error;

use crate::ServiceError;

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

    #[error("mail error")]
    Mail(#[source] SmtpError),

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
        match &self {
            ApiError::Db(e) => tracing::error!(?e, "database error"),
            _ => tracing::error!(?self, "request failed"),
        }

        let (status, msg): (StatusCode, &str) = match &self {
            // 業務系
            ApiError::NotFound(_) => (StatusCode::NOT_FOUND, "Not found"),
            ApiError::Conflict(_) => (StatusCode::CONFLICT, "Conflict"),
            ApiError::BadRequest(_) => (StatusCode::BAD_REQUEST, "Bad request"),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),

            // ライブラリ系は “安全な” メッセージに正規化
            ApiError::Db(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            ApiError::Password(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Password error"),
            ApiError::Mail(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Mail error"),

            ApiError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal error"),
        };

        let body = ErrorBody {
            code: status.as_u16(),
            message: msg,
        };
        (status, Json(body)).into_response()
    }
}

// 変換系
impl From<sea_orm::DbErr> for ApiError {
    fn from(err: sea_orm::DbErr) -> Self {
        ApiError::Db(err)
    }
}

impl From<PasswordWorkerError<Bcrypt>> for ApiError {
    fn from(err: PasswordWorkerError<Bcrypt>) -> Self {
        ApiError::Password(err)
    }
}

impl From<SmtpError> for ApiError {
    fn from(err: SmtpError) -> Self {
        ApiError::Mail(err)
    }
}

impl From<std::env::VarError> for ApiError {
    fn from(err: std::env::VarError) -> Self {
        ApiError::Internal(Box::new(err))
    }
}

impl From<JwtError> for ApiError {
    fn from(err: JwtError) -> Self {
        ApiError::Internal(Box::new(err))
    }
}

impl From<ServiceError> for ApiError {
    fn from(err: ServiceError) -> Self {
        match err {
            ServiceError::NotFound(target) => ApiError::NotFound(target),
            ServiceError::Conflict(target) => ApiError::Conflict(target),
            ServiceError::BadRequest(message) => ApiError::BadRequest(message),
            ServiceError::Unauthorized => ApiError::Unauthorized,
            ServiceError::Db(source) => ApiError::Db(source),
            ServiceError::Password(source) => ApiError::Password(source),
            ServiceError::Mail(source) => ApiError::Mail(source),
            ServiceError::Internal(source) => ApiError::Internal(source),
        }
    }
}
