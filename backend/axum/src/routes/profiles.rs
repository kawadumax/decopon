use axum::{
    extract::State,
    Extension, Router,
    http::StatusCode,
    response::Json,
    routing::{get, put},
};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::dto::{auth::UserDto, profiles::*};
use crate::{
    AppState, errors::ApiError, extractors::authenticated_user::AuthenticatedUser,
    services::profiles,
};

#[tracing::instrument(skip(db, user))]
async fn show(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<UserDto>, ApiError> {
    let user = profiles::get_profile(&db, user.id).await?;
    Ok(Json(UserDto::from(user)))
}

#[tracing::instrument(skip(db, user))]
async fn update(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<UpdateProfileRequestDto>,
) -> Result<Json<UserDto>, ApiError> {
    let params = profiles::UpdateProfile {
        name: payload.name,
        email: payload.email,
    };
    let user = profiles::update_profile(&db, user.id, params).await?;
    Ok(Json(UserDto::from(user)))
}

#[tracing::instrument(skip(db, password_worker, user))]
async fn update_password(
    State(AppState {
        db,
        password_worker,
        ..
    }): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<UpdatePasswordRequestDto>,
) -> Result<StatusCode, ApiError> {
    let params = profiles::UpdatePassword {
        current_password: payload.current_password,
        password: payload.password,
    };
    profiles::update_password(&db, &password_worker, user.id, params).await?;
    Ok(StatusCode::OK)
}

#[tracing::instrument(skip(db, password_worker, user))]
async fn destroy(
    State(AppState {
        db,
        password_worker,
        ..
    }): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<DeleteProfileRequestDto>,
) -> Result<StatusCode, ApiError> {
    let params = profiles::DeleteProfile {
        password: payload.password,
    };
    profiles::delete_profile(&db, &password_worker, user.id, params).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(show).patch(update).delete(destroy))
        .route("/password", put(update_password))
}
