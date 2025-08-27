use axum::{Extension, Router, extract::State, response::Json, routing::put};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::dto::preferences::*;
use crate::{
    AppState, errors::ApiError, extractors::authenticated_user::AuthenticatedUser,
    services::preferences,
};

async fn update(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<UpdatePreferenceRequestDto>,
) -> Result<Json<PreferenceResponseDto>, ApiError> {
    let params = preferences::UpdatePreference {
        work_time: payload.work_time,
        break_time: payload.break_time,
        locale: payload.locale,
    };
    let user = preferences::update_preference(&db, user.id, params).await?;
    Ok(Json(PreferenceResponseDto::from(user)))
}

pub fn routes() -> Router<AppState> {
    Router::new().route("/", put(update))
}
