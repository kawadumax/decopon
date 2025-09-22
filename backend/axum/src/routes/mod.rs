pub mod auth;
pub mod decopon_sessions;
pub mod logs;
pub mod preferences;
pub mod profiles;
pub mod tags;
pub mod tasks;

use crate::{AppState, middleware::auth::auth_middleware};
use axum::{Router, middleware};

pub fn create_routes(app_state: AppState) -> Router<AppState> {
    let protected = Router::<AppState>::new()
        .nest("/decopon_sessions", decopon_sessions::routes())
        .nest("/logs", logs::routes())
        .nest("/profiles", profiles::routes())
        .nest("/preferences", preferences::routes())
        .nest("/tags", tags::routes())
        .nest("/tasks", tasks::routes())
        .layer(middleware::from_fn_with_state(
            app_state.clone(),
            auth_middleware,
        ));

    Router::<AppState>::new()
        .nest("/auth", auth::routes())
        .merge(protected)
}
