//! Tray popover show / hide. Shared by the tray click handler and the
//! notification-click command.
//!
//! macOS Accessory tray apps often get a spurious `Focused(false)` in the same
//! tick as `show()` + `set_focus()` (the click landed on the menu bar, not the
//! window). Without a short grace period the blur handler hides the popover
//! immediately and it looks like the tray icon does nothing.
//!
//! Multi-monitor: `tauri-plugin-positioner`'s tray coords are unreliable on
//! mixed-DPI macOS setups (points vs pixels in the Y-flip). We anchor with
//! Cocoa `NSEvent` / `NSScreen` / `setFrameTopLeftPoint` instead.

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
    position_popover(window);
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

fn position_popover(window: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        if macos::anchor_below_menu_bar(window) {
            return;
        }
    }
    // Fallback (non-macOS, or Cocoa anchor failed): plugin tray position.
    let _ = window.move_window_constrained(Position::TrayBottomCenter);
}

#[cfg(target_os = "macos")]
mod macos {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSEvent, NSScreen, NSWindow};
    use objc2_foundation::{NSPoint, NSRect};
    use tauri::WebviewWindow;

    /// Place the popover under the menu bar on the screen that owns the cursor
    /// (i.e. the status item that was just clicked), centered on the click X.
    pub fn anchor_below_menu_bar(window: &WebviewWindow) -> bool {
        let Ok(ns_window_ptr) = window.ns_window() else {
            return false;
        };
        // SAFETY: Tauri's ns_window pointer is the live NSWindow for this webview.
        let ns_window = unsafe { &*(ns_window_ptr as *const NSWindow) };

        let Some(mtm) = MainThreadMarker::new() else {
            return false;
        };

        let mouse = NSEvent::mouseLocation();
        let screens = NSScreen::screens(mtm);
        let screen = screens
            .iter()
            .find(|screen| point_in_rect(mouse, screen.frame()))
            .or_else(|| NSScreen::mainScreen(mtm));

        let Some(screen) = screen else {
            return false;
        };

        let visible = screen.visibleFrame();
        let frame = ns_window.frame();
        let win_w = frame.size.width;
        let win_h = frame.size.height;
        if win_w <= 0.0 || win_h <= 0.0 {
            return false;
        }

        // Center on the cursor (the click landed on the status item).
        let mut x = mouse.x - win_w / 2.0;
        let min_x = visible.origin.x;
        let max_x = visible.origin.x + visible.size.width - win_w;
        x = x.clamp(min_x, max_x.max(min_x));

        // Top of the visible frame sits just under the menu bar on that screen.
        let top_y = visible.origin.y + visible.size.height;
        ns_window.setFrameTopLeftPoint(NSPoint { x, y: top_y });
        true
    }

    fn point_in_rect(point: NSPoint, rect: NSRect) -> bool {
        point.x >= rect.origin.x
            && point.x < rect.origin.x + rect.size.width
            && point.y >= rect.origin.y
            && point.y < rect.origin.y + rect.size.height
    }
}
