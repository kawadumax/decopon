pub mod auth;
pub mod decopon_sessions;
pub mod logs;
pub mod preferences;
pub mod profiles;
pub mod tags;
pub mod tasks;

use crate::{AppState, middleware::auth::auth_middleware};
use axum::{Router, middleware};

fn protected_routes(app_state: AppState) -> Router<AppState> {
    Router::<AppState>::new()
        .nest("/decopon_sessions", decopon_sessions::routes())
        .nest("/logs", logs::routes())
        .nest("/profiles", profiles::routes())
        .nest("/preferences", preferences::routes())
        .nest("/tags", tags::routes())
        .nest("/tasks", tasks::routes())
        .layer(middleware::from_fn_with_state(
            app_state.clone(),
            auth_middleware,
        ))
}

#[cfg(feature = "app")]
pub fn create_app_routes(app_state: AppState) -> Router<AppState> {
    Router::<AppState>::new()
        .nest("/auth", auth::app_routes())
        .merge(protected_routes(app_state))
}

#[cfg(feature = "web")]
pub fn create_web_routes(app_state: AppState) -> Router<AppState> {
    Router::<AppState>::new()
        .nest("/auth", auth::web_routes())
        .merge(protected_routes(app_state))
}

#[cfg(all(feature = "app", feature = "web"))]
compile_error!("`app` and `web` features cannot be enabled simultaneously for routes.");

#[cfg(not(any(feature = "app", feature = "web")))]
compile_error!("Either the `app` or `web` feature must be enabled to use routes.");

#[cfg(feature = "app")]
pub use create_app_routes as create_routes;

#[cfg(all(feature = "web", not(feature = "app")))]
pub use create_web_routes as create_routes;
