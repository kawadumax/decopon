use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Error, ErrorKind};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct InitState {
    pub initialized: bool,
    pub app_version: Option<String>,
}

fn state_path(data_dir: &Path) -> PathBuf {
    data_dir.join("init_state.json")
}

pub fn load_state(data_dir: &Path) -> Result<Option<InitState>, Error> {
    let path = state_path(data_dir);
    match fs::read_to_string(&path) {
        Ok(text) => match serde_json::from_str::<InitState>(&text) {
            Ok(state) => Ok(Some(state)),
            Err(err) => Err(Error::new(ErrorKind::InvalidData, err.to_string())),
        },
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn save_state(data_dir: &Path, state: &InitState) -> Result<(), Error> {
    let path = state_path(data_dir);
    let text = serde_json::to_string_pretty(state)
        .map_err(|e| Error::new(ErrorKind::InvalidData, e.to_string()))?;
    fs::write(path, text)
}

pub fn is_first_launch(data_dir: &Path) -> bool {
    match load_state(data_dir) {
        Ok(Some(state)) => !state.initialized,
        Ok(None) => true,
        Err(_) => true,
    }
}

pub fn mark_initialized(data_dir: &Path, app_version: Option<String>) -> Result<(), Error> {
    let state = InitState {
        initialized: true,
        app_version,
    };
    save_state(data_dir, &state)
}

pub fn reset_state(data_dir: &Path) -> Result<(), Error> {
    let path = state_path(data_dir);
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e),
    }
}

