pub mod auth;
pub mod error;
pub mod tasks;

pub use error::{IpcError, IpcResult};

/// Registers the IPC handlers used by the application.
///
/// This helper allows desktop and test builds to share the same
/// command list without duplicating the macro invocation.
pub fn register<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
        auth::login,
        tasks::list_tasks,
        tasks::create_task,
        tasks::update_task,
        tasks::delete_task
    ])
}

#[cfg(test)]
mod tests;
