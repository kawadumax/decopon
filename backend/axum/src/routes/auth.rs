use axum::{
    Router,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::get,
};
use axum_macros::debug_handler;

use crate::AppState;
use crate::dto::auth::*;
use crate::errors::ApiError;

#[cfg(feature = "web")]
use axum::{
    extract::Path,
    http::{HeaderMap, header::AUTHORIZATION},
    routing::post,
};

#[cfg(feature = "web")]
use crate::usecases;

#[cfg(feature = "app")]
#[debug_handler]
#[tracing::instrument(skip(app_state))]
async fn get_single_user_session(
    State(app_state): State<AppState>,
) -> Result<impl IntoResponse, ApiError> {
    match app_state.single_user_session() {
        Some(session) => Ok((
            StatusCode::OK,
            Json(AuthResponse {
                token: session.token,
                user: session.user.into(),
            }),
        )),
        None => Err(ApiError::NotFound("single-user-session")),
    }
}

#[cfg(feature = "web")]
#[debug_handler]
#[tracing::instrument(skip(app_state, payload))]
async fn register_user(
    State(app_state): State<AppState>,
    Json(payload): Json<RegisterUserRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let result = usecases::auth::register_user(
        app_state.db(),
        app_state.password_worker(),
        app_state.mailer(),
        &payload.name,
        &payload.email,
        &payload.password,
    )
    .await?;
    Ok((
        StatusCode::CREATED,
        Json(RegisterUserResponse {
            user: result.user.into(),
        }),
    ))
}

#[cfg(feature = "web")]
#[debug_handler]
#[tracing::instrument(skip(app_state, headers))]
async fn get_auth_user(
    State(app_state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, ApiError> {
    let token = extract_bearer_token(&headers)?;

    let user =
        usecases::auth::get_auth_user_from_token(app_state.db(), token, app_state.jwt_secret())
            .await?;
    Ok((
        StatusCode::OK,
        Json(GetAuthUserResponse { user: user.into() }),
    ))
}

#[cfg(feature = "web")]
#[debug_handler]
#[tracing::instrument(skip(app_state, payload))]
async fn login(
    State(app_state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let result = usecases::auth::login_user(
        app_state.db(),
        app_state.password_worker(),
        app_state.jwt_secret(),
        &payload.email,
        &payload.password,
    )
    .await?;

    Ok((
        StatusCode::OK,
        Json(AuthResponse {
            token: result.token,
            user: result.user.into(),
        }),
    ))
}

#[cfg(feature = "web")]
#[tracing::instrument]
async fn logout() -> StatusCode {
    // No-op for logout, as JWTs are stateless
    // In a real application, you might want to handle token invalidation or session management
    StatusCode::NO_CONTENT
}

#[cfg(feature = "web")]
#[debug_handler]
#[tracing::instrument(skip(app_state, payload))]
async fn forgot_password(
    State(app_state): State<AppState>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> Result<StatusCode, ApiError> {
    usecases::auth::forgot_password(app_state.db(), app_state.mailer(), &payload.email).await?;
    Ok(StatusCode::OK)
}

#[cfg(feature = "web")]
#[debug_handler]
#[tracing::instrument(skip(app_state, payload))]
async fn reset_password(
    State(app_state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>,
) -> Result<StatusCode, ApiError> {
    usecases::auth::reset_password(
        app_state.db(),
        app_state.password_worker(),
        &payload.token,
        &payload.email,
        &payload.password,
    )
    .await?;
    Ok(StatusCode::OK)
}

#[cfg(feature = "web")]
#[debug_handler]
#[tracing::instrument(skip(app_state, token))]
async fn verify_email(
    State(app_state): State<AppState>,
    Path(token): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let result =
        usecases::auth::verify_email(app_state.db(), token, app_state.jwt_secret()).await?;
    Ok((
        StatusCode::OK,
        Json(AuthResponse {
            token: result.token,
            user: result.user.into(),
        }),
    ))
}

#[cfg(feature = "web")]
#[debug_handler]
#[tracing::instrument(skip(app_state, headers, payload))]
async fn confirm_password(
    State(app_state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ConfirmPasswordRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let token = extract_bearer_token(&headers)?;
    usecases::auth::confirm_password(
        app_state.db(),
        app_state.password_worker(),
        app_state.jwt_secret(),
        &token,
        &payload.password,
    )
    .await?;

    Ok((
        StatusCode::OK,
        Json(StatusResponse {
            status: "password-confirmed".to_string(),
        }),
    ))
}

#[cfg(feature = "web")]
#[debug_handler]
#[tracing::instrument(skip(app_state, payload))]
async fn resend_verification(
    State(app_state): State<AppState>,
    Json(payload): Json<ResendVerificationRequest>,
) -> Result<impl IntoResponse, ApiError> {
    usecases::auth::resend_verification(app_state.db(), app_state.mailer(), &payload.email).await?;

    Ok((
        StatusCode::OK,
        Json(StatusResponse {
            status: "verification-link-sent".to_string(),
        }),
    ))
}

#[cfg(feature = "web")]
fn extract_bearer_token(headers: &HeaderMap) -> Result<String, ApiError> {
    headers
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .ok_or(ApiError::Unauthorized)
}

#[cfg(feature = "app")]
pub fn app_routes() -> Router<AppState> {
    Router::<AppState>::new().route("/local/session", get(get_single_user_session))
}

#[cfg(feature = "web")]
pub fn web_routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/users", post(register_user).get(get_auth_user))
        .route("/sessions", post(login).delete(logout))
        .route("/password/forgot", post(forgot_password))
        .route("/password/reset", post(reset_password))
        .route("/password/confirm", post(confirm_password))
        .route("/email/verify/{token}", get(verify_email))
        .route("/email/resend", post(resend_verification))
}

#[cfg(feature = "web")]
pub fn routes() -> Router<AppState> {
    web_routes()
}
