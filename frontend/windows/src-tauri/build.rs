fn main() {
    tauri_build::build();
    // Build backend sidecar in release mode so Tauri can bundle it
    let status = std::process::Command::new("cargo")
        .args(["build", "--release"])
        .current_dir("../../../backend/axum")
        .status()
        .expect("failed to build decopon-axum sidecar");
    assert!(status.success(), "decopon-axum build failed");

    // Build migration sidecar to ensure database can be initialized
    let status = std::process::Command::new("cargo")
        .args(["build", "--release"])
        .current_dir("../../../backend/axum/migration")
        .status()
        .expect("failed to build migration sidecar");
    assert!(status.success(), "migration build failed");
}
