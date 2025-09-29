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

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthRegisterRequest {
    pub name: String,
    pub email: String,
    pub password: String,
    pub password_confirmation: String,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthRegisterResponse {
    pub user: AuthUser,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthCurrentUserRequest {
    pub token: String,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthCurrentUserResponse {
    pub user: AuthUser,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthStatusResponse {
    pub status: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthForgotPasswordRequest {
    pub email: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthResetPasswordRequest {
    pub token: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthConfirmPasswordRequest {
    pub password: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthVerifyEmailRequest {
    pub token: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthResendVerificationRequest {
    pub email: String,
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
    async fn register(&self, request: AuthRegisterRequest) -> Result<AuthUser, ServiceError>;
    async fn current_user(&self, request: AuthCurrentUserRequest)
        -> Result<AuthUser, ServiceError>;
    async fn logout(&self) -> Result<(), ServiceError>;
    async fn forgot_password(&self, request: AuthForgotPasswordRequest)
        -> Result<(), ServiceError>;
    async fn reset_password(&self, request: AuthResetPasswordRequest) -> Result<(), ServiceError>;
    async fn confirm_password(
        &self,
        token: String,
        request: AuthConfirmPasswordRequest,
    ) -> Result<(), ServiceError>;
    async fn verify_email(
        &self,
        request: AuthVerifyEmailRequest,
    ) -> Result<AuthSession, ServiceError>;
    async fn resend_verification(
        &self,
        request: AuthResendVerificationRequest,
    ) -> Result<(), ServiceError>;
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

#[tauri::command]
pub async fn register<S>(
    services: State<'_, S>,
    request: AuthRegisterRequest,
) -> IpcResult<AuthRegisterResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .register(request)
        .await
        .map(|user| AuthRegisterResponse { user })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn current_user<S>(
    services: State<'_, S>,
    request: AuthCurrentUserRequest,
) -> IpcResult<AuthCurrentUserResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .current_user(request)
        .await
        .map(|user| AuthCurrentUserResponse { user })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn logout<S>(services: State<'_, S>) -> IpcResult<AuthStatusResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .logout()
        .await
        .map(|_| AuthStatusResponse {
            status: "logged-out".to_string(),
        })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn forgot_password<S>(
    services: State<'_, S>,
    request: AuthForgotPasswordRequest,
) -> IpcResult<AuthStatusResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .forgot_password(request)
        .await
        .map(|_| AuthStatusResponse {
            status: "password-reset-link-sent".to_string(),
        })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn reset_password<S>(
    services: State<'_, S>,
    request: AuthResetPasswordRequest,
) -> IpcResult<AuthStatusResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .reset_password(request)
        .await
        .map(|_| AuthStatusResponse {
            status: "password-reset".to_string(),
        })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn confirm_password<S>(
    services: State<'_, S>,
    token: String,
    request: AuthConfirmPasswordRequest,
) -> IpcResult<AuthStatusResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .confirm_password(token, request)
        .await
        .map(|_| AuthStatusResponse {
            status: "password-confirmed".to_string(),
        })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn verify_email<S>(
    services: State<'_, S>,
    request: AuthVerifyEmailRequest,
) -> IpcResult<AuthLoginResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .verify_email(request)
        .await
        .map(|session| AuthLoginResponse { session })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn resend_verification<S>(
    services: State<'_, S>,
    request: AuthResendVerificationRequest,
) -> IpcResult<AuthStatusResponse>
where
    S: AuthHandler,
{
    services
        .inner()
        .resend_verification(request)
        .await
        .map(|_| AuthStatusResponse {
            status: "verification-link-sent".to_string(),
        })
        .map_err(IpcError::from)
}
