//! Persisted app settings (API key + mock-data toggle).
//! Stored under the OS app config dir so the tray popover and settings
//! window share one source of truth — not Vite `.env`.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

const SETTINGS_FILE: &str = "settings.json";
const SETTINGS_CHANGED_EVENT: &str = "settings-changed";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default)]
    pub api_key: String,
    #[serde(default)]
    pub use_mock_data: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            use_mock_data: false,
        }
    }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir.join(SETTINGS_FILE))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsLoad {
    pub settings: AppSettings,
    pub from_disk: bool,
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Result<SettingsLoad, String> {
    let path = settings_path(&app)?;
    if !path.exists() {
        return Ok(SettingsLoad {
            settings: AppSettings::default(),
            from_disk: false,
        });
    }
    let raw = fs::read_to_string(&path).map_err(|err| err.to_string())?;
    let settings = serde_json::from_str(&raw).map_err(|err| err.to_string())?;
    Ok(SettingsLoad {
        settings,
        from_disk: true,
    })
}

#[tauri::command]
pub fn set_settings(app: AppHandle, settings: AppSettings) -> Result<AppSettings, String> {
    let path = settings_path(&app)?;
    let raw = serde_json::to_string_pretty(&settings).map_err(|err| err.to_string())?;
    fs::write(&path, raw).map_err(|err| err.to_string())?;
    app.emit(SETTINGS_CHANGED_EVENT, &settings)
        .map_err(|err| err.to_string())?;
    Ok(settings)
}

#[tauri::command]
pub fn open_settings_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("settings")
        .ok_or_else(|| "settings window missing".to_string())?;
    let _ = window.center();
    window.show().map_err(|err| err.to_string())?;
    window.set_focus().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn close_settings_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("settings")
        .ok_or_else(|| "settings window missing".to_string())?;
    window.hide().map_err(|err| err.to_string())?;
    Ok(())
}
