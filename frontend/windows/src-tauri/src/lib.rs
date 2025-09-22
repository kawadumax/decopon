use std::{fs, path::PathBuf};

use tauri::{api::dialog, Manager};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn ensure_app_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, std::io::Error> {
    let data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| {
            let mut fallback = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
            fallback.push("decopon-data");
            fallback
        });

    fs::create_dir_all(&data_dir)?;
    Ok(data_dir)
}

fn ensure_env_vars(database_url: &str) {
    std::env::set_var("AXUM_DATABASE_URL", database_url);
    std::env::set_var("DATABASE_URL", database_url);

    if std::env::var_os("AXUM_IP").is_none() {
        std::env::set_var("AXUM_IP", "127.0.0.1");
    }

    if std::env::var_os("AXUM_PORT").is_none() {
        std::env::set_var("AXUM_PORT", "3000");
    }

    if std::env::var_os("AXUM_ALLOWED_ORIGINS").is_none() {
        std::env::set_var(
            "AXUM_ALLOWED_ORIGINS",
            "tauri://localhost,http://localhost:1420",
        );
    }
}

fn notify_error(window: Option<&tauri::Window>, message: &str) {
    dialog::message(window, "Decopon", message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            let app_handle = app.handle();
            let main_window = app.get_window("main");

            let data_dir = ensure_app_data_dir(&app_handle).map_err(|e| {
                notify_error(
                    main_window.as_ref(),
                    &format!("データディレクトリの作成に失敗しました: {e}"),
                );
                e
            })?;

            let db_path = data_dir.join("decopon.sqlite");
            let dsn = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());
            ensure_env_vars(&dsn);

            let db_exists = fs::metadata(&db_path).is_ok();
            let dsn_for_emit = dsn.clone();
            let app_handle = app_handle.clone();
            let main_window = main_window.clone();

            tauri::async_runtime::spawn(async move {
                let migration_command = if db_exists { "up" } else { "fresh" };

                let migration = tauri::api::process::Command::new_sidecar("migration")
                    .and_then(|command| command.args([migration_command]).spawn());

                let mut migrator = match migration {
                    Ok(child) => child,
                    Err(e) => {
                        eprintln!("failed to spawn migration sidecar: {e}");
                        notify_error(
                            main_window.as_ref(),
                            &format!("マイグレーションの起動に失敗しました: {e}"),
                        );
                        return;
                    }
                };

                match migrator.wait().await {
                    Ok(tauri::api::process::CommandEvent::Terminated(status)) => {
                        let exit_code = status.code();

                        if exit_code != Some(0) {
                            eprintln!("migration exited with status: {:?}", status);
                            notify_error(
                                main_window.as_ref(),
                                &format!(
                                    "マイグレーションが異常終了しました (コード: {:?})",
                                    exit_code
                                ),
                            );
                            return;
                        }
                    }
                    Ok(event) => {
                        eprintln!("unexpected migration event: {:?}", event);
                        notify_error(
                            main_window.as_ref(),
                            "マイグレーションの終了状態が取得できませんでした",
                        );
                        return;
                    }
                    Err(e) => {
                        eprintln!("migration failed: {e}");
                        notify_error(
                            main_window.as_ref(),
                            &format!("マイグレーションに失敗しました: {e}"),
                        );
                        return;
                    }
                }

                if let Err(e) = tauri::api::process::Command::new_sidecar("decopon-axum")
                    .and_then(|command| command.spawn())
                {
                    eprintln!("failed to spawn backend: {e}");
                    notify_error(
                        main_window.as_ref(),
                        &format!("バックエンドの起動に失敗しました: {e}"),
                    );
                    return;
                }

                if let Some(window) = main_window {
                    let _ = app_handle.emit_to(
                        window.label(),
                        "decopon://backend-ready",
                        serde_json::json!({ "database": dsn_for_emit }),
                    );
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
