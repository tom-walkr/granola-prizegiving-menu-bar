//! Open a Granola note URL in the default browser / registered handler.
//! Scoped to notes.granola.ai so the webview can't launch arbitrary URLs.

const ALLOWED_PREFIX: &str = "https://notes.granola.ai/";

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    if !url.starts_with(ALLOWED_PREFIX) {
        return Err(format!("url not allowed: {url}"));
    }

    std::process::Command::new("open")
        .arg(&url)
        .spawn()
        .map_err(|err| err.to_string())?;

    Ok(())
}
