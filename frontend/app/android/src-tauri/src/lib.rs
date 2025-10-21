use std::{
    collections::HashMap,
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
    sync::Mutex,
};

use decopon_app_ipc::{self as ipc, AppIpcState, IpcHttpResponse};
use decopon_axum::AppState;
use rand::{distributions::Alphanumeric, Rng};
use services::AppServices;
use serde_json::Value;
use tauri::{Emitter, EventId, EventTarget, Listener, Manager, State};
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;
use url::Url;

mod services;

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

fn ensure_app_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, std::io::Error> {
    let data_dir = app_handle.path().app_data_dir().unwrap_or_else(|_| {
        let mut fallback = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        fallback.push("decopon-data");
        fallback
    });

    fs::create_dir_all(&data_dir)?;
    Ok(data_dir)
}

fn load_or_generate_jwt_secret(data_dir: &Path) -> Result<String, std::io::Error> {
    let secret_path = data_dir.join("jwt_secret");

    match fs::read_to_string(&secret_path) {
        Ok(existing) => {
            let trimmed = existing.trim().to_string();
            if !trimmed.is_empty() {
                return Ok(trimmed);
            }
        }
        Err(err) if err.kind() != ErrorKind::NotFound => return Err(err),
        _ => {}
    }

    let secret: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(64)
        .map(char::from)
        .collect();
    fs::write(&secret_path, format!("{secret}\n"))?;
    Ok(secret)
}

fn sqlite_url_from_path(path: &Path) -> Result<String, std::io::Error> {
    match Url::from_file_path(path) {
        Ok(url) => Ok(format!("sqlite://{}", url.path())),
        Err(_) => {
            if let Some(path_str) = path.to_str() {
                if looks_like_windows_path(path_str) {
                    let normalized = path_str.replace('\\', "/");
                    let file_url = format!("file:///{}", normalized);
                    let url = Url::parse(&file_url).map_err(|err| {
                        std::io::Error::new(ErrorKind::InvalidInput, err.to_string())
                    })?;
                    return Ok(format!("sqlite://{}", url.path()));
                }
            }

            Err(std::io::Error::new(
                ErrorKind::InvalidInput,
                format!("invalid database path: {}", path.display()),
            ))
        }
    }
}

fn looks_like_windows_path(path: &str) -> bool {
    let bytes = path.as_bytes();
    if bytes.len() < 3 {
        return false;
    }

    matches!(bytes[0], b'a'..=b'z' | b'A'..=b'Z')
        && bytes[1] == b':'
        && (bytes[2] == b'\\' || bytes[2] == b'/')
}

fn configure_environment(data_dir: &Path, database_url: &str) -> Result<String, std::io::Error> {
    std::env::set_var("AXUM_DATABASE_URL", database_url);

    if std::env::var_os("APP_SINGLE_USER_MODE").is_none() {
        std::env::set_var("APP_SINGLE_USER_MODE", "1");
    }
    if std::env::var_os("APP_SINGLE_USER_EMAIL").is_none() {
        std::env::set_var("APP_SINGLE_USER_EMAIL", "single-user@localhost");
    }
    if std::env::var_os("APP_SINGLE_USER_PASSWORD").is_none() {
        std::env::set_var("APP_SINGLE_USER_PASSWORD", "decopon-local-password");
    }
    if std::env::var_os("APP_SINGLE_USER_NAME").is_none() {
        std::env::set_var("APP_SINGLE_USER_NAME", "Decopon User");
    }
    if std::env::var_os("APP_SINGLE_USER_LOCALE").is_none() {
        std::env::set_var("APP_SINGLE_USER_LOCALE", "en");
    }
    if std::env::var_os("APP_SINGLE_USER_WORK_TIME").is_none() {
        std::env::set_var("APP_SINGLE_USER_WORK_TIME", "25");
    }
    if std::env::var_os("APP_SINGLE_USER_BREAK_TIME").is_none() {
        std::env::set_var("APP_SINGLE_USER_BREAK_TIME", "5");
    }

    if std::env::var_os("AXUM_SMTP_SERVER").is_none() {
        std::env::set_var("AXUM_DISABLE_SMTP", "1");
    }

    if std::env::var_os("AXUM_JWT_SECRET").is_none() {
        std::env::set_var("AXUM_JWT_SECRET", load_or_generate_jwt_secret(data_dir)?);
    }

    std::env::var("AXUM_JWT_SECRET").map_err(|_| {
        std::io::Error::new(
            ErrorKind::InvalidData,
            "AXUM_JWT_SECRET is not set after initialization",
        )
    })
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

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![dispatch_http_request])
        .setup(|app| {
            let app_handle = app.handle();
            let main_window = app.get_webview_window("main");

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

            let single_user_mode = std::env::var("APP_SINGLE_USER_MODE")
                .map(|value| value == "1" || value.eq_ignore_ascii_case("true"))
                .unwrap_or(true);

            let services = tauri::async_runtime::block_on(AppServices::initialize(
                &database_url,
                jwt_secret.clone(),
                single_user_mode,
            ))
            .map_err(|error| {
                error!(error = ?error, "failed to initialize service layer");
                notify_error(
                    main_window.as_ref(),
                    &format!("サービスの初期化に失敗しました: {error}"),
                );
                Box::new(error) as Box<dyn std::error::Error>
            })?;

            let app_state = AppState::from(services.service_context());
            let router = decopon_axum::routes::create_routes(app_state.clone());
            let handler = AppIpcState::new(router, app_state);
            app.manage(handler);

            if let Some(window) = main_window {
                let window_label = window.label().to_string();
                let handle = app_handle.clone();

                let ready_listener = app_handle.listen_any("decopon://frontend-ready", move |_| {
                    if let Err(error) = handle.emit_to(
                        EventTarget::webview_window(window_label.clone()),
                        "decopon://backend-ready",
                        (),
                    ) {
                        warn!(error = ?error, "failed to emit backend ready event");
                    }

                    if let Some(state) = handle.try_state::<ReadyListenerState>() {
                        state.unlisten(&handle);
                    }
                });

                app.manage(ReadyListenerState::new(ready_listener));
            }

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
