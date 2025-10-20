use axum::http::Request;
use decopon_axum::{
    BootstrapConfig, build_app_state, load_env_with_fallback, resolve_socket_addr, routes,
    setup_cors, setup_tracing_subscriber,
};
use tower_http::trace::TraceLayer;
use tracing::{info, info_span};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    load_env_with_fallback(".env.web")?;
    setup_tracing_subscriber()?;

    let app_state = build_app_state(BootstrapConfig::web()).await?;

    let app = routes::create_web_routes(app_state.clone())
        .layer(setup_cors())
        .with_state(app_state.clone())
        .layer(TraceLayer::new_for_http().make_span_with(|request: &Request<_>| {
            info_span!("http_request", method = %request.method(), uri = %request.uri())
        }));

    let addr = resolve_socket_addr()?;
    info!("Starting web backend on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
