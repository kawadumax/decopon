use std::{
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
    sync::Arc,
};

use decopon_app_ipc::{self as ipc, AppIpcState};
use rand::{distributions::Alphanumeric, Rng};
use services::AppServices;
use tauri::{Emitter, EventTarget, Manager};
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;

mod services;
#[cfg(test)]
mod tests;

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

    if let Ok(secret) = std::env::var("AXUM_JWT_SECRET") {
        return Ok(secret);
    }

    let secret = load_or_generate_jwt_secret(data_dir)?;
    std::env::set_var("AXUM_JWT_SECRET", &secret);
    Ok(secret)
}

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();

    ipc::register(tauri::Builder::default().plugin(tauri_plugin_opener::init()))
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
            let database_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());
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

            let handler: AppIpcState = Arc::new(services);
            app.manage(handler);

            if let Some(window) = main_window {
                let _ = app_handle.emit_to(
                    EventTarget::webview_window(window.label()),
                    "decopon://backend-ready",
                    serde_json::json!({ "database": database_url }),
                );
            }

            info!("application environment is ready");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
