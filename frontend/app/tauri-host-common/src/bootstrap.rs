use std::path::PathBuf;

use decopon_axum::AppState;
use decopon_config::{sqlite_url_from_path, ConfigError, EnvConfig};
use decopon_runtime::ServiceContext;
use crate::ipc::AppIpcState;
use crate::services::AppServices;
use tauri::{AppHandle, Manager, WebviewWindow};
use tracing::{error, info, warn};

use crate::{
    configure_environment,
    init_marker::mark_initialized,
    init_state::AppInitializationState,
    services::ServiceInitError,
};

#[derive(Debug)]
pub struct PreparedEnvironment {
    pub data_dir: PathBuf,
    pub database_url: String,
    pub env_config: EnvConfig,
}

pub fn prepare_environment(
    app_handle: &AppHandle,
    data_dir: PathBuf,
) -> Result<PreparedEnvironment, Box<dyn std::error::Error>> {
    let db_path = data_dir.join("decopon.sqlite");
    let normalized_url = sqlite_url_from_path(&db_path)?;
    let database_url = format!("{normalized_url}?mode=rwc");
    configure_environment(&data_dir, &database_url)?;
    let env_config = EnvConfig::from_env(true)?;
    Ok(PreparedEnvironment {
        data_dir,
        database_url,
        env_config,
    })
}

pub fn spawn_backend_initializer(
    app_handle: AppHandle,
    init_state: AppInitializationState,
    main_window_label: String,
    package_version: Option<String>,
    data_dir: PathBuf,
    first_launch: bool,
    env_config: EnvConfig,
    main_window: Option<WebviewWindow>,
    notify_error: impl Fn(Option<&WebviewWindow>, &str) + Send + 'static + Sync,
) {
    let app_handle_clone = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        info!("Starting asynchronous backend initialization");
        let window = app_handle_clone.get_webview_window(&main_window_label);
        match initialize_backend(&env_config).await {
            Ok(service_context) => {
                let app_state = AppState::from(service_context);
                let router = decopon_axum::routes::create_routes(app_state.clone());
                let handler = AppIpcState::new(router, app_state);
                app_handle_clone.manage(handler);
                info!("Service layer initialized");
                init_state.mark_backend_ready(&app_handle_clone, Some(main_window_label.clone()));

                if first_launch {
                    if let Err(error) = mark_initialized(&data_dir, package_version.clone()) {
                        warn!(error = ?error, "failed to write init_state.json");
                    }
                }
            }
            Err(error) => {
                error!(error = ?error, "failed to initialize service layer");
                init_state.mark_failed(format!("service initialization failed: {error}"));
                notify_error(window.as_ref(), &format!("サービスの初期化に失敗しました: {error}"));
            }
        }
    });
}

async fn initialize_backend(env_config: &EnvConfig) -> Result<ServiceContext, ServiceInitError> {
    let services = AppServices::initialize(env_config.clone()).await?;
    Ok(services.service_context())
}

impl From<ConfigError> for Box<dyn std::error::Error> {
    fn from(value: ConfigError) -> Self {
        Box::new(value)
    }
}
