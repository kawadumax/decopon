use serde::{Deserialize, Serialize};
use tauri::State;

use crate::services::{AuthSession, ServiceError, Services};

use super::{IpcError, IpcResult};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthLoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthLoginResponse {
    pub session: AuthSessionDto,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthSessionDto {
    pub user_id: String,
    pub email: String,
    pub name: String,
    pub access_token: String,
    pub locale: String,
}

impl From<AuthSession> for AuthSessionDto {
    fn from(value: AuthSession) -> Self {
        Self {
            user_id: value.user_id,
            email: value.email,
            name: value.name,
            access_token: value.access_token,
            locale: value.locale,
        }
    }
}

#[tauri::command]
pub async fn login(
    services: State<'_, Services>,
    request: AuthLoginRequest,
) -> IpcResult<AuthLoginResponse> {
    tracing::info!(target: "ipc::auth", email = %request.email, "ログイン処理を開始します");

    services
        .auth()
        .login(&request.email, &request.password)
        .map(|session| {
            tracing::info!(target: "ipc::auth", email = %request.email, "ログインに成功しました");
            AuthLoginResponse {
                session: session.into(),
            }
        })
        .map_err(|error| {
            tracing::warn!(target: "ipc::auth", email = %request.email, error = ?error, "ログインに失敗しました");
            IpcError::from(ServiceError::from(error))
        })
}
