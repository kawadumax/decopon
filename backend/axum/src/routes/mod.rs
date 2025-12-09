pub mod auth;
pub mod decopon_sessions;
pub mod logs;
pub mod preferences;
pub mod profiles;
pub mod tags;
pub mod tasks;

use axum::{middleware, routing::get, Router};
use axum::http::StatusCode;
use decopon_config::AppMode;

use crate::{
    middleware::auth::{auth_middleware, local_single_user_middleware},
    AppState,
};

fn protected_routes(app_state: AppState, app_mode: AppMode) -> Router<AppState> {
    let base = Router::<AppState>::new()
        .nest("/decopon_sessions", decopon_sessions::routes())
        .nest("/logs", logs::routes())
        .nest("/profiles", profiles::routes())
        .nest("/preferences", preferences::routes())
        .nest("/tags", tags::routes())
        .nest("/tasks", tasks::routes());

    match app_mode {
        AppMode::Local => base.layer(middleware::from_fn_with_state(
            app_state.clone(),
            local_single_user_middleware,
        )),
        AppMode::Web => base.layer(middleware::from_fn_with_state(
            app_state.clone(),
            auth_middleware,
        )),
    }
}

#[cfg(feature = "app")]
fn auth_routes_for_mode(app_mode: AppMode) -> Router<AppState> {
    match app_mode {
        AppMode::Local => auth::app_routes(),
        AppMode::Web => Router::new().route(
            "/{_rest..}",
            get(|| async { StatusCode::NOT_IMPLEMENTED }),
        ),
    }
}

#[cfg(feature = "web")]
fn auth_routes_for_mode(_app_mode: AppMode) -> Router<AppState> {
    auth::web_routes()
}

pub fn create_routes(app_state: AppState, app_mode: AppMode) -> Router<AppState> {
    Router::<AppState>::new()
        .nest("/auth", auth_routes_for_mode(app_mode))
        .merge(protected_routes(app_state, app_mode))
}

#[cfg(all(feature = "app", feature = "web"))]
compile_error!("`app` and `web` features cannot be enabled simultaneously for routes.");

#[cfg(not(any(feature = "app", feature = "web")))]
compile_error!("Either the `app` or `web` feature must be enabled to use routes.");
