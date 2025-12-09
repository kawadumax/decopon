use serde_json::json;
use std::io::{Error, ErrorKind};
use tauri::AppHandle;

use crate::{
    ensure_app_data_dir,
    init_state::AppInitializationState,
    init_marker::{is_first_launch, load_state, reset_state},
};

fn remove_file_if_exists(path: &std::path::Path) -> Result<(), Error> {
    match std::fs::remove_file(path) {
        Ok(_) => Ok(()),
        Err(err) if err.kind() == ErrorKind::NotFound => Ok(()),
        Err(err) => Err(err),
    }
}

#[tauri::command]
pub fn get_init_status(app: AppHandle) -> Result<serde_json::Value, String> {
    let data_dir = ensure_app_data_dir(&app).map_err(|e| e.to_string())?;
    let first_launch = is_first_launch(&data_dir);
    let state = load_state(&data_dir)
        .unwrap_or(None)
        .unwrap_or_default();

    let package_version = Some(app.package_info().version.to_string());

    Ok(json!({
        "initialized": state.initialized || !first_launch,
        "appVersion": state.app_version.or(package_version),
        "dataDir": data_dir.to_string_lossy(),
    }))
}

#[tauri::command]
pub fn reset_application_data(app: AppHandle) -> Result<(), String> {
    let data_dir = ensure_app_data_dir(&app).map_err(|e| e.to_string())?;
    let db_files = [
        "decopon.sqlite",
        "decopon.sqlite-shm",
        "decopon.sqlite-wal",
    ];

    for file in db_files {
        let path = data_dir.join(file);
        remove_file_if_exists(&path).map_err(|e| e.to_string())?;
    }

    let jwt_secret = data_dir.join("jwt_secret");
    remove_file_if_exists(&jwt_secret).map_err(|e| e.to_string())?;

    reset_state(&data_dir).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_bootstrap_state(
    init_state: tauri::State<'_, AppInitializationState>,
) -> Result<serde_json::Value, String> {
    let snapshot = init_state.snapshot();
    let status = if snapshot.failed_reason.is_some() {
        "failed"
    } else if snapshot.frontend_ready && snapshot.backend_ready {
        "ready"
    } else {
        "pending"
    };

    Ok(json!({
        "status": status,
        "frontendReady": snapshot.frontend_ready,
        "backendReady": snapshot.backend_ready,
        "timedOut": snapshot.timed_out,
        "reason": snapshot.failed_reason
    }))
}
