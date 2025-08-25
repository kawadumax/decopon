use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use std::future::{ready, Ready};

// ミドルウェアで付与された認証済みユーザ情報をそのまま再利用する
pub use crate::middleware::auth::AuthenticatedUser;

impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    fn from_request_parts(
        parts: &mut Parts,
        _state: &S,
    ) -> Ready<Result<Self, Self::Rejection>> {
        let user = parts.extensions.get::<AuthenticatedUser>().cloned();
        ready(user.ok_or(StatusCode::UNAUTHORIZED))
    }
}

