use async_trait::async_trait;
use decopon_services::{
    usecases::{auth::AuthResponse, users::User},
    ServiceError,
};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::{IpcError, IpcResult};

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthLoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthLoginResponse {
    pub session: AuthSession,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthSession {
    pub token: String,
    pub user: AuthUser,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthUser {
    pub id: i32,
    pub email: String,
    pub name: String,
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

impl From<User> for AuthUser {
    fn from(value: User) -> Self {
        Self {
            id: value.id,
            email: value.email,
            name: value.name,
            work_time: value.work_time,
            break_time: value.break_time,
            locale: value.locale,
        }
    }
}

impl From<AuthResponse> for AuthSession {
    fn from(value: AuthResponse) -> Self {
        Self {
            token: value.token,
            user: value.user.into(),
        }
    }
}

#[async_trait]
pub trait AuthHandler: Send + Sync {
    async fn single_user_session(&self) -> Result<AuthSession, ServiceError>;
    async fn login(&self, request: AuthLoginRequest) -> Result<AuthSession, ServiceError>;
}

#[tauri::command]
pub async fn single_user_session<S>(services: State<'_, S>) -> IpcResult<AuthLoginResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .single_user_session()
        .await
        .map(|session| AuthLoginResponse { session })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn login<S>(
    services: State<'_, S>,
    request: AuthLoginRequest,
) -> IpcResult<AuthLoginResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .login(request)
        .await
        .map(|session| AuthLoginResponse { session })
        .map_err(IpcError::from)
}
