use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use sys_locale::get_locale;
use tauri::WebviewUrl;
use url::Url;

const SPLASH_HTML: &str = include_str!("splashscreen.html");
pub const DEFAULT_SPLASH_LABEL: &str = "splashscreen";

fn resolve_message() -> &'static str {
    if let Some(locale) = get_locale() {
        let lang = locale.to_ascii_lowercase();
        if lang.starts_with("ja") {
            return "バックエンドの初期化を実行しています。しばらくお待ちください…";
        }
    }
    "Initializing backend… Please wait."
}

fn build_splashscreen_url() -> Result<Url, url::ParseError> {
    let message = resolve_message();
    let html = SPLASH_HTML.replace("{{MESSAGE}}", message);
    let encoded = BASE64.encode(html.as_bytes());
    Url::parse(&format!("data:text/html;base64,{}", encoded))
}

#[cfg(any(target_os = "android", target_os = "ios"))]
pub fn create_splashscreen(_: &tauri::AppHandle, _: &str) -> Option<String> {
    tracing::info!("splashscreen is disabled on mobile targets");
    None
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub fn create_splashscreen(app_handle: &tauri::AppHandle, label: &str) -> Option<String> {
    let splash_url = match build_splashscreen_url() {
        Ok(url) => url,
        Err(error) => {
            tracing::warn!(error = ?error, "failed to construct splashscreen data url");
            return None;
        }
    };

    let builder =
        tauri::WebviewWindowBuilder::new(app_handle, label, WebviewUrl::External(splash_url))
            .title("Decopon")
            .resizable(false)
            .inner_size(420.0, 420.0)
            .center()
            .decorations(false)
            .always_on_top(true);

    match builder.build() {
        Ok(window) => Some(window.label().to_string()),
        Err(error) => {
            tracing::warn!(error = ?error, "failed to create splashscreen window");
            None
        }
    }
}
