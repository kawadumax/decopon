fn build_sidecar(path: &str, profile: &str) {
    let mut command = std::process::Command::new("cargo");
    command.arg("build");

    if profile == "release" {
        command.arg("--release");
    }

    let status = command
        .current_dir(path)
        .status()
        .unwrap_or_else(|err| panic!("failed to build sidecar at {path}: {err}"));

    assert!(status.success(), "sidecar build failed for {}", path);
}

fn main() {
    tauri_build::build();

    let profile = std::env::var("PROFILE").unwrap_or_else(|_| "release".to_string());

    // Build backend sidecar so Tauri can bundle it in production
    build_sidecar("../../../backend/axum", &profile);

    // Build migration sidecar to ensure database can be initialized
    build_sidecar("../../../backend/axum/migration", &profile);
}
