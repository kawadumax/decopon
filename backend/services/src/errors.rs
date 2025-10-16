use axum_password_worker::{Bcrypt, PasswordWorkerError};
use jsonwebtoken::errors::Error as JwtError;
use lettre::transport::smtp::Error as SmtpError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ServiceError {
    #[error("not found: {0}")]
    NotFound(&'static str),

    #[error("conflict: {0}")]
    Conflict(&'static str),

    #[error("bad request: {0}")]
    BadRequest(String),

    #[error("unauthorized")]
    Unauthorized,

    #[error("database error")]
    Db(#[from] sea_orm::DbErr),

    #[error("password error")]
    Password(#[from] PasswordWorkerError<Bcrypt>),

    #[error("mail error")]
    Mail(#[from] SmtpError),

    #[error("internal server error")]
    Internal(#[source] Box<dyn std::error::Error + Send + Sync>),
}

impl From<JwtError> for ServiceError {
    fn from(err: JwtError) -> Self {
        ServiceError::Internal(Box::new(err))
    }
}

impl From<std::env::VarError> for ServiceError {
    fn from(err: std::env::VarError) -> Self {
        ServiceError::Internal(Box::new(err))
    }
}
