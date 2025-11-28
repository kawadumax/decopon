use std::collections::HashMap;

use decopon_axum::AppState;
use decopon_tauri_host_common::init_marker::{is_first_launch, mark_initialized};
use decopon_tauri_host_common::init_state::{AppInitializationState, ReadyListenerState};
use decopon_tauri_host_common::services::AppServices;
use decopon_tauri_host_common::splashscreen::{create_splashscreen, DEFAULT_SPLASH_LABEL};
use decopon_tauri_host_common::{
    commands, configure_environment, dispatch_http_request as dispatch_ipc_http_request,
    ensure_app_data_dir, resolve_single_user_mode_flag, should_skip_service_bootstrap,
    sqlite_url_from_path, AppIpcState, IpcHttpResponse, FRONTEND_READY_EVENT,
};
use serde_json::Value;
use tauri::{Listener, Manager, State};
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;

fn notify_error(window: Option<&tauri::WebviewWindow>, message: &str) {
    if let Some(window) = window {
        match serde_json::to_string(&format!("Decopon: {message}")) {
            Ok(payload) => {
                if let Err(err) = window.eval(format!("window.alert({payload});")) {
                    warn!(error = ?err, "failed to display alert dialog");
                }
            }
            Err(err) => {
                warn!(error = ?err, "failed to serialize alert dialog payload");
            }
        }
    } else {
        warn!("no window available for alert: {message}");
    }
}

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let _ = tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .try_init();
}

#[tauri::command]
async fn dispatch_http_request(
    state: State<'_, AppIpcState>,
    method: String,
    path: String,
    body: Option<Value>,
    headers: Option<HashMap<String, String>>,
) -> Result<IpcHttpResponse, String> {
    dispatch_ipc_http_request(&state, method, path, body, headers).await
}

#[tauri::command]
fn get_init_status(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    commands::get_init_status(app)
}

#[tauri::command]
fn reset_application_data(app: tauri::AppHandle) -> Result<(), String> {
    commands::reset_application_data(app)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![dispatch_http_request, get_init_status, reset_application_data])
        .setup(|app| {
            let app_handle = app.handle();
            let splash_label = create_splashscreen(&app_handle, DEFAULT_SPLASH_LABEL);
            let main_window = app.get_webview_window("main");
            let skip_service_bootstrap = should_skip_service_bootstrap();
            info!(
                "Preparing application environment (skip_service_bootstrap={})",
                skip_service_bootstrap
            );

            let data_dir = ensure_app_data_dir(&app_handle).map_err(|e| {
                error!(error = ?e, "failed to create app data directory");
                notify_error(
                    main_window.as_ref(),
                    &format!("データディレクトリの作成に失敗しました: {e}"),
                );
                Box::new(e) as Box<dyn std::error::Error>
            })?;

            let db_path = data_dir.join("decopon.sqlite");
            let normalized_url = sqlite_url_from_path(&db_path).map_err(|e| {
                error!(error = ?e, "failed to normalize database path");
                notify_error(
                    main_window.as_ref(),
                    &format!("データベースパスの正規化に失敗しました: {e}"),
                );
                Box::new(e) as Box<dyn std::error::Error>
            })?;
            let database_url = format!("{normalized_url}?mode=rwc");
            let jwt_secret = configure_environment(&data_dir, &database_url).map_err(|e| {
                error!(error = ?e, "failed to configure environment");
                notify_error(
                    main_window.as_ref(),
                    &format!("環境変数の設定に失敗しました: {e}"),
                );
                Box::new(e) as Box<dyn std::error::Error>
            })?;

            let single_user_mode = resolve_single_user_mode_flag();
            let first_launch = is_first_launch(&data_dir);
            let package_version = Some(app.package_info().version.to_string());
            let main_window_label = main_window
                .as_ref()
                .map(|window| window.label().to_string());
            app.manage(AppInitializationState::new(
                main_window_label.clone(),
                splash_label.clone(),
            ));

            if let Some(window) = main_window {
                let window_label = window.label().to_string();
                let listener_handle = app_handle.clone();
                let ready_listener = app_handle.listen_any(FRONTEND_READY_EVENT, move |_| {
                    let init_state = listener_handle.state::<AppInitializationState>();
                    init_state.mark_frontend_ready(&listener_handle, window_label.clone());
                });

                app.manage(ReadyListenerState::new(ready_listener));
            }

            let init_database_url = database_url.clone();
            let init_jwt_secret = jwt_secret.clone();
            let init_handle = app_handle.clone();
            let init_window_label = main_window_label
                .clone()
                .unwrap_or_else(|| "main".to_string());
            let init_first_launch = first_launch;
            let init_data_dir = data_dir.clone();
            let init_package_version = package_version.clone();
            tauri::async_runtime::spawn(async move {
                info!("Starting asynchronous backend initialization");
                let window = init_handle.get_webview_window(&init_window_label);
                match AppServices::initialize(&init_database_url, init_jwt_secret, single_user_mode)
                    .await
                {
                    Ok(services) => {
                        let app_state = AppState::from(services.service_context());
                        let router = decopon_axum::routes::create_routes(app_state.clone());
                        let handler = AppIpcState::new(router, app_state);
                        init_handle.manage(handler);
                        info!("Service layer initialized");
                        let init_state = init_handle.state::<AppInitializationState>();
                        init_state
                            .mark_backend_ready(&init_handle, Some(init_window_label.clone()));
                        // Record initialized marker (version is optional here)
                        if init_first_launch {
                            if let Err(e) = mark_initialized(&init_data_dir, init_package_version.clone()) {
                                warn!(error=?e, "failed to write init_state.json");
                            }
                        }
                    }
                    Err(error) => {
                        error!(error = ?error, "failed to initialize service layer");
                        notify_error(
                            window.as_ref(),
                            &format!("サービスの初期化に失敗しました: {error}"),
                        );
                    }
                }
            });

            info!("application environment is ready");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod sqlite_url_tests {
    use super::sqlite_url_from_path;
    use std::path::Path;

    #[test]
    fn converts_unix_style_path() {
        let path = Path::new("/home/test/.local/share/decopon/decopon.sqlite");
        let url = sqlite_url_from_path(path).expect("unix path should convert");
        assert_eq!(
            url,
            "sqlite:///home/test/.local/share/decopon/decopon.sqlite"
        );
    }

    #[test]
    fn converts_windows_style_path() {
        let path = Path::new(r"C:\Users\Test\AppData\Local\Decopon\decopon.sqlite");
        let url = sqlite_url_from_path(path).expect("windows path should convert");
        assert_eq!(
            url,
            "sqlite:///C:/Users/Test/AppData/Local/Decopon/decopon.sqlite"
        );
    }
}
