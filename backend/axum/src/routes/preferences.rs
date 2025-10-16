use axum::{Extension, Router, extract::State, response::Json, routing::put};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::dto::preferences::*;
use crate::{
    AppState, errors::ApiError, extractors::authenticated_user::AuthenticatedUser,
    usecases::preferences,
};

#[tracing::instrument(skip(db, user))]
async fn update(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<UpdatePreferenceRequest>,
) -> Result<Json<PreferenceResponse>, ApiError> {
    let params = preferences::UpdatePreference {
        work_time: payload.work_time,
        break_time: payload.break_time,
        locale: payload.locale,
    };
    let user = preferences::update_preference(&db, user.id, params).await?;
    Ok(Json(PreferenceResponse::from(user)))
}

pub fn routes() -> Router<AppState> {
    Router::new().route("/", put(update))
}
