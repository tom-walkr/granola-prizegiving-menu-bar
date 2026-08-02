//! Thin Rust-side GET for the Granola public API.
//! Browser/`fetch` hits CORS (OPTIONS 404). The HTTP plugin also forces a
//! webview `Origin` and is awkward with Bearer auth — this command keeps
//! requests on the Rust side only.

use serde::Serialize;

const ALLOWED_PREFIX: &str = "https://public-api.granola.ai/";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GranolaHttpResponse {
    pub status: u16,
    pub body: String,
}

#[tauri::command]
pub async fn granola_http_get(
    url: String,
    authorization: String,
) -> Result<GranolaHttpResponse, String> {
    if !url.starts_with(ALLOWED_PREFIX) {
        return Err(format!("url not allowed: {url}"));
    }

    let response = reqwest::Client::new()
        .get(&url)
        .header("Authorization", authorization)
        .send()
        .await
        .map_err(|err| err.to_string())?;

    let status = response.status().as_u16();
    let body = response.text().await.map_err(|err| err.to_string())?;

    Ok(GranolaHttpResponse { status, body })
}
