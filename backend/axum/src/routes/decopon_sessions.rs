use axum::{
    extract::{Path, Query, State},
    routing::get,
    Router, Json,
};
use std::sync::Arc;
use sea_orm::DatabaseConnection;
use axum_macros::debug_handler;
use chrono::NaiveDate;

use crate::{dto::decopon_sessions::*, errors::ApiError, services::decopon_sessions, AppState};

#[derive(serde::Deserialize)]
struct UserQuery { user_id: i32 }

#[debug_handler]
async fn index(
    State(db): State<Arc<DatabaseConnection>>,
    Query(user): Query<UserQuery>,
) -> Result<Json<Vec<DecoponSessionResponseDto>>, ApiError> {
    let sessions = decopon_sessions::get_sessions(&db, user.user_id).await?;
    let sessions = sessions.into_iter().map(DecoponSessionResponseDto::from).collect();
    Ok(Json(sessions))
}

#[debug_handler]
async fn show(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Query(user): Query<UserQuery>,
) -> Result<Json<DecoponSessionResponseDto>, ApiError> {
    let session = decopon_sessions::get_session_by_id(&db, id, user.user_id).await?;
    Ok(Json(DecoponSessionResponseDto::from(session)))
}

#[debug_handler]
async fn store(
    State(db): State<Arc<DatabaseConnection>>,
    Json(payload): Json<StoreDecoponSessionRequestDto>,
) -> Result<Json<DecoponSessionResponseDto>, ApiError> {
    let params = decopon_sessions::NewDecoponSession {
        status: payload.status,
        started_at: payload.started_at,
        ended_at: payload.ended_at,
        user_id: payload.user_id,
    };
    let session = decopon_sessions::insert_session(&db, params).await?;
    Ok(Json(DecoponSessionResponseDto::from(session)))
}

#[debug_handler]
async fn update(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Json(payload): Json<UpdateDecoponSessionRequestDto>,
) -> Result<Json<DecoponSessionResponseDto>, ApiError> {
    let params = decopon_sessions::DecoponSessionUpdate {
        id,
        status: payload.status,
        ended_at: payload.ended_at,
        user_id: payload.user_id,
    };
    let session = decopon_sessions::update_session(&db, params).await?;
    Ok(Json(DecoponSessionResponseDto::from(session)))
}

#[debug_handler]
async fn destroy(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Query(user): Query<UserQuery>,
) -> Result<(), ApiError> {
    decopon_sessions::delete_session(&db, id, user.user_id).await?;
    Ok(())
}

#[derive(serde::Deserialize)]
struct CycleQuery { date: String, user_id: i32 }

#[debug_handler]
async fn cycles(
    State(db): State<Arc<DatabaseConnection>>,
    Query(q): Query<CycleQuery>,
) -> Result<Json<CycleCountResponseDto>, ApiError> {
    let date = NaiveDate::parse_from_str(&q.date, "%Y-%m-%d")
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;
    let count = decopon_sessions::count_completed_sessions_on(&db, q.user_id, date).await?;
    Ok(Json(CycleCountResponseDto { date: q.date, count }))
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/cycles", get(cycles))
        .route("/:id", get(show).put(update).delete(destroy))
}
