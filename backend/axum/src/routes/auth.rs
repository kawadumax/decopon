use axum::{
    Router,
    extract::{Path, State},
    http::{HeaderMap, StatusCode, header::AUTHORIZATION},
    response::{IntoResponse, Json},
    routing::{get, post},
};
use axum_macros::debug_handler;

use crate::AppState;
use crate::dto::auth::*;
use crate::errors::ApiError;
use crate::services;

#[debug_handler]
#[tracing::instrument(skip(db, password_worker, mailer))]
async fn register_user(
    State(AppState {
        db,
        password_worker,
        mailer,
        ..
    }): State<AppState>,
    Json(payload): Json<RegisterUserRequestDto>,
) -> Result<impl IntoResponse, ApiError> {
    let result = services::auth::register_user(
        &db,
        &password_worker,
        &mailer,
        &payload.name,
        &payload.email,
        &payload.password,
    )
    .await?;
    Ok((
        StatusCode::CREATED,
        Json(RegisterUserResponseDto {
            user: result.user.into(),
        }),
    ))
}

#[debug_handler]
#[tracing::instrument(skip(db, jwt_secret, headers))]
async fn get_auth_user(
    State(AppState { db, jwt_secret, .. }): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, ApiError> {
    let token = extract_bearer_token(&headers)?;
    tracing::info!(%token, "extracted token");

    let user = services::auth::get_auth_user_from_token(&db, token, &jwt_secret).await?;
    Ok((
        StatusCode::OK,
        Json(GetAuthUserResponseDto { user: user.into() }),
    ))
}

#[debug_handler]
#[tracing::instrument(skip(db, password_worker, jwt_secret))]
async fn login(
    State(AppState {
        db,
        password_worker,
        mailer: _,
        jwt_secret,
    }): State<AppState>,
    Json(payload): Json<LoginRequestDto>,
) -> Result<impl IntoResponse, ApiError> {
    let result = services::auth::login_user(
        &db,
        &password_worker,
        &jwt_secret,
        &payload.email,
        &payload.password,
    )
    .await?;

    Ok((
        StatusCode::OK,
        Json(AuthResponseDto {
            token: result.token,
            user: result.user.into(),
        }),
    ))
}

#[tracing::instrument]
async fn logout() -> StatusCode {
    // No-op for logout, as JWTs are stateless
    // In a real application, you might want to handle token invalidation or session management
    StatusCode::NO_CONTENT
}

#[debug_handler]
#[tracing::instrument(skip(db, mailer))]
async fn forgot_password(
    State(AppState { db, mailer, .. }): State<AppState>,
    Json(payload): Json<ForgotPasswordRequestDto>,
) -> Result<StatusCode, ApiError> {
    services::auth::forgot_password(&db, &mailer, &payload.email).await?;
    Ok(StatusCode::OK)
}

#[debug_handler]
#[tracing::instrument(skip(db, password_worker))]
async fn reset_password(
    State(AppState {
        db,
        password_worker,
        ..
    }): State<AppState>,
    Json(payload): Json<ResetPasswordRequestDto>,
) -> Result<StatusCode, ApiError> {
    services::auth::reset_password(
        &db,
        &password_worker,
        &payload.token,
        &payload.email,
        &payload.password,
    )
    .await?;
    Ok(StatusCode::OK)
}
#[debug_handler]
#[tracing::instrument(skip(db, jwt_secret))]
async fn verify_email(
    State(AppState { db, jwt_secret, .. }): State<AppState>,
    Path(token): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let result = services::auth::verify_email(&db, token, &jwt_secret).await?;
    Ok((
        StatusCode::OK,
        Json(AuthResponseDto {
            token: result.token,
            user: result.user.into(),
        }),
    ))
}

#[debug_handler]
#[tracing::instrument(skip(db, password_worker, jwt_secret, headers))]
async fn confirm_password(
    State(AppState {
        db,
        password_worker,
        jwt_secret,
        ..
    }): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ConfirmPasswordRequestDto>,
) -> Result<impl IntoResponse, ApiError> {
    let token = extract_bearer_token(&headers)?;
    services::auth::confirm_password(
        &db,
        &password_worker,
        &jwt_secret,
        &token,
        &payload.password,
    )
    .await?;

    Ok((
        StatusCode::OK,
        Json(StatusResponseDto {
            status: "password-confirmed".to_string(),
        }),
    ))
}

#[debug_handler]
#[tracing::instrument(skip(db, mailer))]
async fn resend_verification(
    State(AppState { db, mailer, .. }): State<AppState>,
    Json(payload): Json<ResendVerificationRequestDto>,
) -> Result<impl IntoResponse, ApiError> {
    services::auth::resend_verification(&db, &mailer, &payload.email).await?;

    Ok((
        StatusCode::OK,
        Json(StatusResponseDto {
            status: "verification-link-sent".to_string(),
        }),
    ))
}

fn extract_bearer_token(headers: &HeaderMap) -> Result<String, ApiError> {
    headers
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .ok_or(ApiError::Unauthorized)
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/users", post(register_user).get(get_auth_user))
        .route("/sessions", post(login).delete(logout))
        .route("/password/forgot", post(forgot_password))
        .route("/password/reset", post(reset_password))
        .route("/password/confirm", post(confirm_password))
        .route("/email/verify/{token}", get(verify_email))
        .route("/email/resend", post(resend_verification))
}
