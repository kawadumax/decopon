use std::{sync::Mutex, time::{Duration, Instant}};

use tauri::{AppHandle, Emitter, EventId, Listener, Manager};
use tracing::{info, warn};

use crate::BACKEND_READY_EVENT;

/// コマンドの登録解除を安全に行うためのリスナー管理型。
pub struct ReadyListenerState {
    listener_id: Mutex<Option<EventId>>,
}

impl ReadyListenerState {
    pub fn new(listener_id: EventId) -> Self {
        Self {
            listener_id: Mutex::new(Some(listener_id)),
        }
    }

    pub fn unlisten(&self, app_handle: &tauri::AppHandle) {
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
    /// すでに BACKEND_READY_EVENT を emit 済みかどうか
    emitted_once: bool,
    window_label: Option<String>,
    splash_label: Option<String>,
    failed_reason: Option<String>,
    started_at: Instant,
    timeout: Duration,
}

/// フロントとバックエンドの起動シーケンスを調整し、再送を保証する状態型。
pub struct AppInitializationState {
    state: Mutex<InitFlags>,
}

#[derive(Debug, Clone)]
pub struct InitSnapshot {
    pub frontend_ready: bool,
    pub backend_ready: bool,
    pub emitted_once: bool,
    pub timed_out: bool,
    pub failed_reason: Option<String>,
}

impl AppInitializationState {
    pub fn new(initial_label: Option<String>, splash_label: Option<String>) -> Self {
        Self::with_timeout(initial_label, splash_label, Duration::from_secs(15))
    }

    pub fn with_timeout(
        initial_label: Option<String>,
        splash_label: Option<String>,
        timeout: Duration,
    ) -> Self {
        Self {
            state: Mutex::new(InitFlags {
                window_label: initial_label,
                splash_label,
                failed_reason: None,
                started_at: Instant::now(),
                timeout,
                ..Default::default()
            }),
        }
    }

    pub fn mark_frontend_ready(&self, app_handle: &AppHandle, window_label: String) {
        {
            let mut state = self
                .state
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            info!("frontend-ready event received (label={})", window_label);
            state.frontend_ready = true;
            state.window_label.get_or_insert(window_label);
        }
        self.try_notify(app_handle);
    }

    pub fn mark_backend_ready(&self, app_handle: &AppHandle, window_label_hint: Option<String>) {
        {
            let mut state = self
                .state
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
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

    pub fn mark_failed(&self, reason: impl Into<String>) {
        if let Ok(mut state) = self.state.lock() {
            state.failed_reason = Some(reason.into());
        }
    }

    pub fn snapshot(&self) -> InitSnapshot {
        let mut state = self
            .state
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        let timed_out = state.started_at.elapsed() >= state.timeout;
        if timed_out && state.failed_reason.is_none() {
            state.failed_reason = Some("Initialization timed out".to_string());
        }
        InitSnapshot {
            frontend_ready: state.frontend_ready,
            backend_ready: state.backend_ready,
            emitted_once: state.emitted_once,
            timed_out,
            failed_reason: state.failed_reason.clone(),
        }
    }

    fn try_notify(&self, app_handle: &AppHandle) {
        let (label, splash_label, emitted_once) = {
            let state = self
                .state
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            if state.frontend_ready && state.backend_ready {
                info!("both frontend and backend flagged ready; notifying webview");
                if let Some(label) = state.window_label.clone() {
                    (
                        Some(label),
                        state.splash_label.clone(),
                        state.emitted_once,
                    )
                } else {
                    info!("window label missing; waiting for label update before notifying");
                    (None, None, state.emitted_once)
                }
            } else {
                (None, None, state.emitted_once)
            }
        };

        if let Some(label) = label {
            if !emitted_once {
                #[cfg(not(any(target_os = "android", target_os = "ios")))]
                {
                    if let Some(window) = app_handle.get_webview_window(&label) {
                        if let Err(error) = window.show() {
                            warn!(error = ?error, "failed to show main window");
                        }
                    }

                    if let Some(splash_label) = splash_label {
                        if let Some(splash) = app_handle.get_webview_window(&splash_label) {
                            if let Err(error) = splash.close() {
                                warn!(error = ?error, "failed to close splashscreen window");
                            }
                        }
                    }
                }

                #[cfg(any(target_os = "android", target_os = "ios"))]
                {
                    let _ = &splash_label;
                }
            }

            if let Err(error) = app_handle.emit(BACKEND_READY_EVENT, ()) {
                warn!(error = ?error, "failed to emit backend ready event");
                info!("will retry backend-ready emission when next state update arrives");
            } else {
                info!("emitted backend ready event to window {}", label);
                if let Ok(mut state) = self.state.lock() {
                    state.emitted_once = true;
                }
            }
        }
    }
}
