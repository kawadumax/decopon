use std::{collections::HashMap, sync::Mutex};

use decopon_app_ipc::{self as ipc, AppIpcState, IpcHttpResponse};
use decopon_axum::AppState;
use decopon_tauri_common::{
    configure_environment, ensure_app_data_dir, resolve_single_user_mode_flag,
    should_skip_service_bootstrap, sqlite_url_from_path, BACKEND_READY_EVENT,
    FRONTEND_READY_EVENT,
};
use decopon_tauri_common::services::AppServices;
use serde_json::Value;
use tauri::{AppHandle, Emitter, EventId, EventTarget, Listener, Manager, State};
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;

struct ReadyListenerState {
    listener_id: Mutex<Option<EventId>>,
}

impl ReadyListenerState {
    fn new(listener_id: EventId) -> Self {
        Self {
            listener_id: Mutex::new(Some(listener_id)),
        }
    }

    fn unlisten(&self, app_handle: &tauri::AppHandle) {
        if let Ok(mut guard) = self.listener_id.lock() {
            if let Some(listener_id) = guard.take() {
                app_handle.unlisten(listener_id);
            }
        }
    }
}

#[derive(Default)]
struct InitFlags {
    frontend_ready: bool,
    backend_ready: bool,
    notified: bool,
    window_label: Option<String>,
}

struct AppInitializationState {
    state: Mutex<InitFlags>,
}

impl AppInitializationState {
    fn new(initial_label: Option<String>) -> Self {
        Self {
            state: Mutex::new(InitFlags {
                window_label: initial_label,
                ..Default::default()
            }),
        }
    }

    fn mark_frontend_ready(&self, app_handle: &AppHandle, window_label: String) {
        {
            let mut state = self.state.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
            info!("frontend-ready event received (label={})", window_label);
            state.frontend_ready = true;
            state.window_label.get_or_insert(window_label);
        }
        self.try_notify(app_handle);
    }

    fn mark_backend_ready(&self, app_handle: &AppHandle, window_label_hint: Option<String>) {
        {
            let mut state = self.state.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
            info!(
                "backend initialization completed (label_hint={:?})",
                window_label_hint
            );
            state.backend_ready = true;
            if state.window_label.is_none() {
                state.window_label = window_label_hint;
            }
        }
        self.try_notify(app_handle);
    }

    fn try_notify(&self, app_handle: &AppHandle) {
        let label = {
            let mut state = self.state.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
            if state.frontend_ready && state.backend_ready && !state.notified {
                info!("both frontend and backend flagged ready; notifying webview");
                if let Some(label) = state.window_label.clone() {
                    state.notified = true;
                    Some(label)
                } else {
                    info!("window label missing; waiting for label update before notifying");
                    None
                }
            } else {
                None
            }
        };

        if let Some(label) = label {
            if let Err(error) = app_handle.emit_to(
                EventTarget::webview_window(label.clone()),
                BACKEND_READY_EVENT,
                (),
            ) {
                warn!(error = ?error, "failed to emit backend ready event");
                if let Ok(mut state) = self.state.lock() {
                    state.notified = false;
                    info!("will retry backend-ready emission when next state update arrives");
                }
            } else {
                info!("emitted backend ready event to window {}", label);
            }
        }
    }
}

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
    ipc::dispatch_http_request(&state, method, path, body, headers).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();

    // normal mode

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![dispatch_http_request])
        .setup(|app| {
            let app_handle = app.handle();
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
            app.manage(AppInitializationState::new(Some(main_window_label.clone())));
            let data_dir = ensure_app_data_dir(&app_handle).map_err(|e| {
                error!(error = ?e, "failed to create app data directory");
                notify_error(
                    main_window.as_ref(),
                    &format!("データディレクトリの作成に失敗しました: {e}"),
                );
                Box::new(e) as Box<dyn std::error::Error>
            })?;
            info!("App data directory ready at {}", data_dir.display());

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
            info!("Using SQLite database URL {}", database_url);
            let jwt_secret = configure_environment(&data_dir, &database_url).map_err(|e| {
                error!(error = ?e, "failed to configure environment");
                notify_error(
                    main_window.as_ref(),
                    &format!("環境変数の設定に失敗しました: {e}"),
                );
                Box::new(e) as Box<dyn std::error::Error>
            })?;
            info!("Environment variables configured");

            let single_user_mode = resolve_single_user_mode_flag();
            info!(
                "Single-user mode resolved to {}",
                single_user_mode
            );

            let init_database_url = database_url.clone();
            let init_jwt_secret = jwt_secret.clone();
            let init_handle = app_handle.clone();
            let init_window_label = main_window_label.clone();
            tauri::async_runtime::spawn(async move {
                info!("Starting asynchronous backend initialization");
                let window = init_handle.get_webview_window(&init_window_label);
                let database_url = init_database_url;
                let jwt_secret = init_jwt_secret;
                match AppServices::initialize(
                    &database_url,
                    jwt_secret,
                    single_user_mode,
                )
                .await
                {
                    Ok(services) => {
                        let app_state = AppState::from(services.service_context());
                        let router = decopon_axum::routes::create_routes(app_state.clone());
                        let handler = AppIpcState::new(router, app_state);
                        init_handle.manage(handler);
                        info!("Service layer initialized");
                        let init_state = init_handle.state::<AppInitializationState>();
                        init_state.mark_backend_ready(&init_handle, Some(init_window_label.clone()));
                    }
                    Err(error) => {
                        error!(error = ?error, "failed to initialize service layer");
                        let window_ref = window.as_ref();
                        notify_error(
                            window_ref,
                            &format!("サービスの初期化に失敗しました: {error}"),
                        );
                    }
                }
            });

            let listener_handle = app_handle.clone();
            let listener_label = main_window_label.clone();
            let ready_listener =
                app_handle.listen_any(FRONTEND_READY_EVENT, move |_| {
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
