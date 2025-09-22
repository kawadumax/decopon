use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};
use std::future::ready;

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
    ) -> impl std::future::Future<Output = Result<Self, <Self as FromRequestParts<S>>::Rejection>> + Send
    {
        let user = parts.extensions.get::<AuthenticatedUser>().cloned();
        ready(user.ok_or(StatusCode::UNAUTHORIZED))
    }
}
