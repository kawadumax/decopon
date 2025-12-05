use std::env;

use thiserror::Error;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppMode {
    Local,
    Web,
}

impl AppMode {
    pub fn is_local(self) -> bool {
        matches!(self, AppMode::Local)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SingleUserConfig {
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SmtpConfig {
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EnvConfig {
    pub app_mode: AppMode,
    pub database_url: String,
    pub jwt_secret: String,
    pub single_user: SingleUserConfig,
    pub smtp: SmtpConfig,
}

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("required environment variable '{0}' is missing")]
    MissingVar(String),
}

impl EnvConfig {
    pub fn from_env(default_local_app_mode: bool) -> Result<Self, ConfigError> {
        let app_mode = resolve_app_mode(default_local_app_mode);
        let database_url = required_var("AXUM_DATABASE_URL")?;
        let jwt_secret = required_var("AXUM_JWT_SECRET")?;
        let single_user_enabled = resolve_single_user_flag(app_mode);
        let smtp_enabled = matches!(app_mode, AppMode::Web) && !flag_enabled("AXUM_DISABLE_SMTP");

        Ok(Self {
            app_mode,
            database_url,
            jwt_secret,
            single_user: SingleUserConfig {
                enabled: single_user_enabled,
            },
            smtp: SmtpConfig {
                enabled: smtp_enabled,
            },
        })
    }
}

fn required_var(key: &str) -> Result<String, ConfigError> {
    env::var(key).map_err(|_| ConfigError::MissingVar(key.to_string()))
}

fn resolve_app_mode(default_local_app_mode: bool) -> AppMode {
    let fallback = if default_local_app_mode {
        "local".to_string()
    } else {
        "web".to_string()
    };
    let normalized = env::var("APP_MODE")
        .unwrap_or(fallback)
        .trim()
        .to_ascii_lowercase();

    if normalized == "web" {
        AppMode::Web
    } else {
        AppMode::Local
    }
}

fn resolve_single_user_flag(app_mode: AppMode) -> bool {
    match bool_from_env("APP_SINGLE_USER_MODE") {
        Some(value) => value,
        None => app_mode.is_local(),
    }
}

fn bool_from_env(key: &str) -> Option<bool> {
    env::var(key).ok().and_then(|value| {
        let normalized = value.trim().to_ascii_lowercase();
        match normalized.as_str() {
            "1" | "true" | "yes" | "on" | "enabled" => Some(true),
            "0" | "false" | "no" | "off" | "disabled" => Some(false),
            _ => None,
        }
    })
}

fn flag_enabled(key: &str) -> bool {
    bool_from_env(key).unwrap_or(false)
}
