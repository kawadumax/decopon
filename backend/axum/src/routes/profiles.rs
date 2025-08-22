use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, patch, put},
};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::dto::{auth::UserDto, profiles::*};
use crate::{AppState, errors::ApiError, services::profiles};

async fn show(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
) -> Result<Json<UserDto>, ApiError> {
    let user = profiles::get_profile(&db, id).await?;
    Ok(Json(UserDto::from(user)))
}

async fn update(
    State(db): State<Arc<DatabaseConnection>>,
    Json(payload): Json<UpdateProfileRequestDto>,
) -> Result<Json<UserDto>, ApiError> {
    let params = profiles::UpdateProfile {
        id: payload.id,
        name: payload.name,
        email: payload.email,
    };
    let user = profiles::update_profile(&db, params).await?;
    Ok(Json(UserDto::from(user)))
}

async fn update_password(
    State(AppState {
        db,
        password_worker,
        ..
    }): State<AppState>,
    Json(payload): Json<UpdatePasswordRequestDto>,
) -> Result<StatusCode, ApiError> {
    let params = profiles::UpdatePassword {
        id: payload.id,
        current_password: payload.current_password,
        password: payload.password,
    };
    profiles::update_password(&db, &password_worker, params).await?;
    Ok(StatusCode::OK)
}

async fn destroy(
    State(AppState {
        db,
        password_worker,
        ..
    }): State<AppState>,
    Json(payload): Json<DeleteProfileRequestDto>,
) -> Result<StatusCode, ApiError> {
    let params = profiles::DeleteProfile {
        id: payload.id,
        password: payload.password,
    };
    profiles::delete_profile(&db, &password_worker, params).await?;
    Ok(StatusCode::OK)
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/:id", get(show))
        .route("/", patch(update).delete(destroy))
        .route("/password", put(update_password))
}
