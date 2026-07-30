mod launch_at_login;

use tauri::{
    image::Image,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_positioner::{on_tray_event, Position, WindowExt};

const POPOVER_LABEL: &str = "popover";

// Template image: macOS ignores color here and tints the shape itself for
// light/dark menu bars, so only the alpha mask matters at runtime. The
// light/dark PNG pairs in icons/tray/ are still shipped as separate assets
// per the brief, ready to swap in for a non-template icon during the design pass.
const TRAY_ICON_BYTES: &[u8] = include_bytes!("../icons/tray/tray-icon-dark@2x.png");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![
            launch_at_login::get_launch_at_login,
            launch_at_login::set_launch_at_login,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let popover = app
                .get_webview_window(POPOVER_LABEL)
                .expect("popover window must be declared in tauri.conf.json");

            let blur_target = popover.clone();
            popover.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    let _ = blur_target.hide();
                }
            });

            let tray_icon = Image::from_bytes(TRAY_ICON_BYTES)?;

            TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(true)
                .on_tray_icon_event(|tray, event| {
                    on_tray_event(tray.app_handle(), &event);

                    let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    else {
                        return;
                    };

                    let app = tray.app_handle();
                    let Some(window) = app.get_webview_window(POPOVER_LABEL) else {
                        return;
                    };
                    toggle_popover(&window);
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn toggle_popover(window: &tauri::WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
        return;
    }

    let _ = window.move_window_constrained(Position::TrayBottomCenter);
    let _ = window.show();
    let _ = window.set_focus();
}
