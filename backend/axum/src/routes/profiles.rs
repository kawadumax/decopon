use axum::{
    Extension, Router,
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, put},
};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::dto::{auth::UserResponse, profiles::*};
use crate::{
    AppState, errors::ApiError, extractors::authenticated_user::AuthenticatedUser,
    usecases::profiles,
};

#[tracing::instrument(skip(db, user))]
async fn show(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<UserResponse>, ApiError> {
    let user = profiles::get_profile(&db, user.id).await?;
    Ok(Json(UserResponse::from(user)))
}

#[tracing::instrument(skip(db, user))]
async fn update(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<UserResponse>, ApiError> {
    let params = profiles::UpdateProfile {
        name: payload.name,
        email: payload.email,
    };
    let user = profiles::update_profile(&db, user.id, params).await?;
    Ok(Json(UserResponse::from(user)))
}

#[tracing::instrument(skip(app_state, user, payload))]
async fn update_password(
    State(app_state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<UpdatePasswordRequest>,
) -> Result<StatusCode, ApiError> {
    let params = profiles::UpdatePassword {
        current_password: payload.current_password,
        password: payload.password,
    };
    profiles::update_password(app_state.db(), app_state.password_worker(), user.id, params).await?;
    Ok(StatusCode::OK)
}

#[tracing::instrument(skip(app_state, user, payload))]
async fn destroy(
    State(app_state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<DeleteProfileRequest>,
) -> Result<StatusCode, ApiError> {
    let params = profiles::DeleteProfile {
        password: payload.password,
    };
    profiles::delete_profile(app_state.db(), app_state.password_worker(), user.id, params).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(show).patch(update).delete(destroy))
        .route("/password", put(update_password))
}
