//! Tray popover show / hide. Shared by the tray click handler and the
//! notification-click command.
//!
//! macOS Accessory tray apps often get a spurious `Focused(false)` in the same
//! tick as `show()` + `set_focus()` (the click landed on the menu bar, not the
//! window). Without a short grace period the blur handler hides the popover
//! immediately and it looks like the tray icon does nothing.

use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_positioner::{Position, WindowExt};

const POPOVER_LABEL: &str = "popover";

/// When true, ignore `Focused(false)` so a tray-driven show isn't undone.
static IGNORE_BLUR: AtomicBool = AtomicBool::new(false);

pub fn should_ignore_blur() -> bool {
    IGNORE_BLUR.load(Ordering::SeqCst)
}

fn arm_blur_grace() {
    IGNORE_BLUR.store(true, Ordering::SeqCst);
    std::thread::spawn(|| {
        std::thread::sleep(Duration::from_millis(350));
        IGNORE_BLUR.store(false, Ordering::SeqCst);
    });
}

pub fn show_popover_window(window: &WebviewWindow) {
    arm_blur_grace();
    let _ = window.move_window_constrained(Position::TrayBottomCenter);
    let _ = window.show();
    let _ = window.set_focus();
}

pub fn hide_popover_window(window: &WebviewWindow) {
    arm_blur_grace();
    let _ = window.hide();
}

pub fn toggle_popover(window: &WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        hide_popover_window(window);
        return;
    }
    show_popover_window(window);
}

#[tauri::command]
pub fn show_popover(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window(POPOVER_LABEL)
        .ok_or_else(|| "popover window missing".to_string())?;
    show_popover_window(&window);
    Ok(())
}
