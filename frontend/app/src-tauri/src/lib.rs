// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|_app| {
            tauri::async_runtime::spawn(async {
                if let Ok(url) = std::env::var("AXUM_DATABASE_URL") {
                    std::env::set_var("DATABASE_URL", &url);
                }

                if let Ok(mut migrator) =
                    tauri::api::process::Command::new_sidecar("migration")
                        .expect("failed to create `migration` sidecar")
                        .spawn()
                {
                    if let Err(e) = migrator.wait().await {
                        eprintln!("migration failed: {e}");
                    }
                }

                if let Err(e) = tauri::api::process::Command::new_sidecar("decopon-axum")
                    .expect("failed to create `decopon-axum` sidecar")
                    .spawn()
                {
                    eprintln!("failed to spawn backend: {e}");
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
