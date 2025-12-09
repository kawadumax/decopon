use std::collections::HashMap;

use decopon_tauri_host_common::bootstrap::{prepare_environment, spawn_backend_initializer};
use decopon_tauri_host_common::init_marker::is_first_launch;
use decopon_tauri_host_common::init_state::{AppInitializationState, ReadyListenerState};
use decopon_tauri_host_common::splashscreen::{create_splashscreen, DEFAULT_SPLASH_LABEL};
use decopon_tauri_host_common::{
    commands, dispatch_http_request as dispatch_ipc_http_request, ensure_app_data_dir,
    should_skip_service_bootstrap, AppIpcState, IpcHttpResponse, FRONTEND_READY_EVENT,
};
use serde_json::Value;
use tauri::{Emitter, Listener, Manager, State};
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;

fn init_tracing() {
    if let Err(error) = tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,decopon_axum=debug")),
        )
        .try_init()
    {
        warn!(error = ?error, "failed to initialize tracing subscriber");
    }
}

fn notify_error(window: Option<&tauri::WebviewWindow>, message: &str) {
    if let Some(window) = window {
        if let Err(error) = window.emit("decopon://backend-error", message) {
            warn!(error = ?error, "failed to emit backend error");
        }
    }
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

#[tauri::command]
fn get_bootstrap_state(
    init_state: State<'_, AppInitializationState>,
) -> Result<serde_json::Value, String> {
    commands::get_bootstrap_state(init_state)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();

    // normal mode

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(
            tauri::generate_handler![
                dispatch_http_request,
                get_init_status,
                reset_application_data,
                get_bootstrap_state
            ],
        )
        .setup(|app| {
            let app_handle = app.handle();
            let splash_label = create_splashscreen(&app_handle, DEFAULT_SPLASH_LABEL);
            let main_window = app.get_webview_window("main");
            let main_window_label = main_window
                .as_ref()
                .map(|window| window.label().to_string())
                .unwrap_or_else(|| "main".to_string());

            let skip_service_bootstrap = should_skip_service_bootstrap();
            info!(
                "Preparing application environment (skip_service_bootstrap={})",
                skip_service_bootstrap
            );
            app.manage(AppInitializationState::new(
                Some(main_window_label.clone()),
                splash_label.clone(),
            ));
            let data_dir = ensure_app_data_dir(&app_handle).map_err(|e| -> Box<dyn std::error::Error> {
                error!(error = ?e, "failed to create app data directory");
                notify_error(
                    main_window.as_ref(),
                    &format!("データディレクトリの作成に失敗しました: {e}"),
                );
                Box::new(e)
            })?;
            info!("App data directory ready at {}", data_dir.display());

            let first_launch = is_first_launch(&data_dir);
            let package_version = Some(app.package_info().version.to_string());

            let prepared = prepare_environment(&app_handle, data_dir.clone()).map_err(|e| {
                error!(error = ?e, "failed to prepare environment");
                notify_error(
                    main_window.as_ref(),
                    &format!("環境の準備に失敗しました: {e}"),
                );
                e
            })?;
            info!("Single-user mode resolved to {}", prepared.env_config.single_user.enabled);

            let init_window_label = main_window_label.clone();
            let init_first_launch = first_launch;
            let init_env_config = prepared.env_config.clone();
            spawn_backend_initializer(
                app_handle.clone(),
                init_window_label.clone(),
                package_version.clone(),
                data_dir.clone(),
                init_first_launch,
                init_env_config,
                main_window.clone(),
                move |window, message| notify_error(window, message),
            );

            let listener_handle = app_handle.clone();
            let listener_label = main_window_label.clone();
            let ready_listener = app_handle.listen_any(FRONTEND_READY_EVENT, move |_| {
                let init_state = listener_handle.state::<AppInitializationState>();
                init_state.mark_frontend_ready(&listener_handle, listener_label.clone());

                if let Some(state) = listener_handle.try_state::<ReadyListenerState>() {
                    state.unlisten(&listener_handle);
                }
            });

            app.manage(ReadyListenerState::new(ready_listener));

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
