use axum::{
    extract::{Path, Query, State},
    Extension, Json, Router,
    http::StatusCode,
    routing::get,
};
use axum_macros::debug_handler;
use chrono::NaiveDate;
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::{
    AppState, dto::decopon_sessions::*, errors::ApiError,
    extractors::authenticated_user::AuthenticatedUser, services::decopon_sessions,
};

#[debug_handler]
#[tracing::instrument(skip(db, user))]
async fn index(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<Vec<DecoponSessionResponseDto>>, ApiError> {
    let sessions = decopon_sessions::get_sessions(&db, user.id).await?;
    let sessions = sessions
        .into_iter()
        .map(DecoponSessionResponseDto::from)
        .collect();
    Ok(Json(sessions))
}

#[debug_handler]
#[tracing::instrument(skip(db, user))]
async fn show(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<DecoponSessionResponseDto>, ApiError> {
    let session = decopon_sessions::get_session_by_id(&db, id, user.id).await?;
    Ok(Json(DecoponSessionResponseDto::from(session)))
}

#[debug_handler]
#[tracing::instrument(skip(db, user))]
async fn store(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<StoreDecoponSessionRequestDto>,
) -> Result<Json<DecoponSessionResponseDto>, ApiError> {
    let params = decopon_sessions::NewDecoponSession {
        status: payload.status,
        started_at: payload.started_at,
        ended_at: payload.ended_at,
        user_id: user.id,
    };
    let session = decopon_sessions::insert_session(&db, params).await?;
    Ok(Json(DecoponSessionResponseDto::from(session)))
}

#[debug_handler]
#[tracing::instrument(skip(db, user))]
async fn update(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<UpdateDecoponSessionRequestDto>,
) -> Result<Json<DecoponSessionResponseDto>, ApiError> {
    let params = decopon_sessions::DecoponSessionUpdate {
        id,
        status: payload.status,
        ended_at: payload.ended_at,
        user_id: user.id,
    };
    let session = decopon_sessions::update_session(&db, params).await?;
    Ok(Json(DecoponSessionResponseDto::from(session)))
}

#[debug_handler]
#[tracing::instrument(skip(db, user))]
async fn destroy(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<StatusCode, ApiError> {
    decopon_sessions::delete_session(&db, id, user.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, serde::Deserialize)]
struct CycleQueryDto {
    date: String,
}

#[debug_handler]
#[tracing::instrument(skip(db, user))]
async fn cycles(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Query(q): Query<CycleQueryDto>,
) -> Result<Json<CycleCountResponseDto>, ApiError> {
    let date = NaiveDate::parse_from_str(&q.date, "%Y-%m-%d")
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;
    let count = decopon_sessions::count_completed_sessions_on(&db, user.id, date).await?;
    Ok(Json(CycleCountResponseDto {
        date: q.date,
        count,
    }))
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/cycles", get(cycles))
        .route("/{id}", get(show).put(update).delete(destroy))
}
