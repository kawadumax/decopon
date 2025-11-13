use rand::{distributions::Alphanumeric, Rng};
use std::{
    env, fs,
    io::ErrorKind,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};
use url::Url;

pub const BACKEND_READY_EVENT: &str = "decopon://backend-ready";
pub const FRONTEND_READY_EVENT: &str = "decopon://frontend-ready";

pub mod init_state;
pub mod services;

pub fn ensure_app_data_dir(app_handle: &AppHandle) -> Result<PathBuf, std::io::Error> {
    let data_dir = app_handle.path().app_data_dir().unwrap_or_else(|_| {
        let mut fallback = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        fallback.push("decopon-data");
        fallback
    });

    fs::create_dir_all(&data_dir)?;
    Ok(data_dir)
}

pub fn load_or_generate_jwt_secret(data_dir: &Path) -> Result<String, std::io::Error> {
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

pub fn sqlite_url_from_path(path: &Path) -> Result<String, std::io::Error> {
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

pub fn normalized_app_mode() -> String {
    env::var("APP_MODE")
        .unwrap_or_else(|_| "local".to_string())
        .trim()
        .to_ascii_lowercase()
}

pub fn is_local_app_mode() -> bool {
    normalized_app_mode() != "web"
}

pub fn resolve_single_user_mode_flag() -> bool {
    if let Ok(value) = env::var("APP_SINGLE_USER_MODE") {
        return value == "1" || value.eq_ignore_ascii_case("true");
    }
    is_local_app_mode()
}

pub fn configure_environment(
    data_dir: &Path,
    database_url: &str,
) -> Result<String, std::io::Error> {
    env::set_var("AXUM_DATABASE_URL", database_url);

    if env::var_os("APP_MODE").is_none() {
        env::set_var("APP_MODE", "local");
    }

    if env::var_os("APP_SINGLE_USER_MODE").is_none() {
        let default_value = if is_local_app_mode() { "1" } else { "0" };
        env::set_var("APP_SINGLE_USER_MODE", default_value);
    }
    if env::var_os("APP_SINGLE_USER_EMAIL").is_none() {
        env::set_var("APP_SINGLE_USER_EMAIL", "single-user@localhost");
    }
    if env::var_os("APP_SINGLE_USER_PASSWORD").is_none() {
        env::set_var("APP_SINGLE_USER_PASSWORD", "decopon-local-password");
    }
    if env::var_os("APP_SINGLE_USER_NAME").is_none() {
        env::set_var("APP_SINGLE_USER_NAME", "Decopon User");
    }
    if env::var_os("APP_SINGLE_USER_LOCALE").is_none() {
        env::set_var("APP_SINGLE_USER_LOCALE", "en");
    }
    if env::var_os("APP_SINGLE_USER_WORK_TIME").is_none() {
        env::set_var("APP_SINGLE_USER_WORK_TIME", "25");
    }
    if env::var_os("APP_SINGLE_USER_BREAK_TIME").is_none() {
        env::set_var("APP_SINGLE_USER_BREAK_TIME", "5");
    }
    if env::var_os("AXUM_DISABLE_SMTP").is_none() {
        env::set_var("AXUM_DISABLE_SMTP", "1");
    }

    if let Ok(secret) = env::var("AXUM_JWT_SECRET") {
        return Ok(secret);
    }

    let secret = load_or_generate_jwt_secret(data_dir)?;
    env::set_var("AXUM_JWT_SECRET", &secret);
    Ok(secret)
}

pub fn env_flag_enabled(key: &str) -> bool {
    env::var(key)
        .map(|value| {
            let normalized = value.trim().to_ascii_lowercase();
            matches!(normalized.as_str(), "1" | "true" | "yes" | "on" | "enabled")
        })
        .unwrap_or(false)
}

pub fn should_skip_service_bootstrap() -> bool {
    env_flag_enabled("DECO_SKIP_SERVICE_BOOTSTRAP")
}
