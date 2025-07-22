pub mod auth;
// pub mod decopon_sessions;
// pub mod logs;
// pub mod profiles;
// pub mod tags;
pub mod tasks;

use crate::AppState;
use axum::Router;

pub fn create_routes() -> Router<AppState> {
    Router::<AppState>::new()
        .nest("/auth", auth::routes())
        // .nest("/decopon_sessions", decopon_sessions::routes())
        // .nest("/logs", logs::routes())
        // .nest("/profiles", profiles::routes())
        // .nest("/tags", tags::routes())
        .nest("/tasks", tasks::routes())
}
