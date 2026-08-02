//! Open a Granola note URL in the Granola desktop app (fallback: default browser).
//! Scoped to notes.granola.ai so the webview can't launch arbitrary URLs.

const ALLOWED_PREFIX: &str = "https://notes.granola.ai/";

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    if !url.starts_with(ALLOWED_PREFIX) {
        return Err(format!("url not allowed: {url}"));
    }

    // Prefer the installed Granola app so Universal Links / applinks hand off
    // into the note instead of Safari.
    let granola = std::process::Command::new("open")
        .args(["-a", "Granola", &url])
        .status()
        .map_err(|err| err.to_string())?;

    if granola.success() {
        return Ok(());
    }

    std::process::Command::new("open")
        .arg(&url)
        .status()
        .map_err(|err| err.to_string())?;

    Ok(())
}
