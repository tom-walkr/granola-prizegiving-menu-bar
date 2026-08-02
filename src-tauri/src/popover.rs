//! Show the tray popover (used when a notification is clicked).

use tauri::{AppHandle, Manager};
use tauri_plugin_positioner::{Position, WindowExt};

const POPOVER_LABEL: &str = "popover";

#[tauri::command]
pub fn show_popover(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window(POPOVER_LABEL)
        .ok_or_else(|| "popover window missing".to_string())?;
    let _ = window.move_window_constrained(Position::TrayBottomCenter);
    window.show().map_err(|err| err.to_string())?;
    window.set_focus().map_err(|err| err.to_string())?;
    Ok(())
}
