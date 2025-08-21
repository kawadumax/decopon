use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
};
use axum_macros::debug_handler;
use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::routes::AppState;
use crate::services;

#[derive(Deserialize, Serialize)]
pub struct RegisterUserDto {
    pub name: String,
    pub email: String,
    pub password: String,
    pub password_confirmation: String,
}

#[derive(Serialize)]
pub struct RegisterUserResultDto {
    pub user: UserDto, // シンプルなユーザーDTO（id, emailなど）
}

#[derive(Serialize)]
pub struct UserFullDto {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub email_verified_at: Option<chrono::DateTime<chrono::Utc>>,
    pub verification_token: Option<String>, // ユーザーの検証トークン
    pub password: String,                   // ハッシュ化されたパスワード
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

#[derive(Serialize)]
pub struct UserDto {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

#[debug_handler]
async fn register_user(
    State(AppState {
        db,
        password_worker,
        mailer,
    }): State<AppState>,
    Json(payload): Json<RegisterUserDto>,
) -> Result<impl IntoResponse, StatusCode> {
    // サービス関数呼び出し
    let result = services::auth::register_user(
        &db,
        &password_worker,
        &mailer,
        &payload.email,
        &payload.password,
    )
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok((StatusCode::CREATED, Json(result)))
}

#[derive(Serialize, Deserialize)]
pub struct GetAuthUserDto {
    pub token: String,
}

#[derive(Serialize)]
pub struct GetAuthUserResultDto {
    pub user: UserDto,
}

#[debug_handler]
async fn get_auth_user(
    State(db): State<Arc<DatabaseConnection>>,
    Json(payload): Json<GetAuthUserDto>,
) -> Result<impl IntoResponse, StatusCode> {
    let user = services::auth::get_auth_user_from_token(&db, payload.token)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;
    Ok((StatusCode::OK, Json(GetAuthUserResultDto { user })))
}

#[derive(Deserialize, Serialize)]
pub struct LoginRequestDto {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserDto,
}

#[debug_handler]
async fn login(
    State(AppState {
        db,
        password_worker,
        mailer: _,
    }): State<AppState>,
    Json(payload): Json<LoginRequestDto>,
) -> Result<impl IntoResponse, StatusCode> {
    let result =
        services::auth::login_user(&db, &password_worker, &payload.email, &payload.password)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

    Ok((StatusCode::OK, Json(result)))
}

async fn logout() -> StatusCode {
    // No-op for logout, as JWTs are stateless
    // In a real application, you might want to handle token invalidation or session management
    StatusCode::OK
}

async fn forgot_password() -> StatusCode {
    // Forgot password logic here
    StatusCode::OK
}
async fn reset_password() -> StatusCode {
    // Reset password logic here
    StatusCode::OK
}
#[debug_handler]
async fn verify_email(
    State(AppState { db, .. }): State<AppState>,
    Path(token): Path<String>,
) -> Result<impl IntoResponse, StatusCode> {
    let result = services::auth::verify_email(&db, token)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    Ok((StatusCode::OK, Json(result)))
}
async fn notify_email() -> StatusCode {
    // Notify email logic here
    StatusCode::OK
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/users", post(register_user).get(get_auth_user))
        .route("/sessions", post(login).delete(logout))
        .route("/password/forgot", post(forgot_password))
        .route("/password/reset", post(reset_password))
        .route("/email/verify/:token", get(verify_email))
        .route("/email/notify", post(notify_email))
}
