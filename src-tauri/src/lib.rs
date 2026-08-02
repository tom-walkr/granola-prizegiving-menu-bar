mod launch_at_login;

use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    window::{Effect, EffectState, EffectsBuilder},
    Manager, WindowEvent,
};
use tauri_plugin_positioner::{on_tray_event, Position, WindowExt};

const POPOVER_LABEL: &str = "popover";
const LAUNCH_AT_LOGIN_ID: &str = "launch-at-login";

// Prizegiving logo (from src/assets/granola-pg-logo.svg) as a template image:
// macOS ignores RGB and tints the alpha mask for light/dark menu bars.
// Light/dark PNG pairs stay in sync for a future non-template swap.
const TRAY_ICON_BYTES: &[u8] = include_bytes!("../icons/tray/tray-icon-dark@2x.png");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_positioner::init())
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

            #[cfg(target_os = "macos")]
            {
                // Menu material + active state matches a menu-bar dropdown.
                // Requires transparent: true and app.macOSPrivateApi.
                let _ = popover.set_effects(
                    EffectsBuilder::new()
                        .effect(Effect::Menu)
                        .state(EffectState::Active)
                        .radius(12.0)
                        .build(),
                );
                // alwaysOnTop only sets NSFloatingWindowLevel — bump to status
                // level so the tray popover sits above other apps' windows.
                configure_popover_layer(&popover);
            }

            let blur_target = popover.clone();
            popover.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    let _ = blur_target.hide();
                }
            });

            let tray_icon = Image::from_bytes(TRAY_ICON_BYTES)?;
            let launch_at_login = CheckMenuItem::with_id(
                app,
                LAUNCH_AT_LOGIN_ID,
                "Launch at Login",
                true,
                launch_at_login::get_launch_at_login(),
                None::<&str>,
            )?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit = PredefinedMenuItem::quit(app, None)?;
            let tray_menu = Menu::with_items(app, &[&launch_at_login, &separator, &quit])?;

            TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(true)
                .menu(&tray_menu)
                // Left click toggles the awards popover; right click shows the tray menu.
                .show_menu_on_left_click(false)
                .on_menu_event(move |_app, event| {
                    if event.id() != LAUNCH_AT_LOGIN_ID {
                        return;
                    }
                    // CheckMenuItem toggles itself before this fires — sync the stub.
                    let enabled = launch_at_login.is_checked().unwrap_or(false);
                    launch_at_login::set_launch_at_login(enabled);
                })
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
    #[cfg(target_os = "macos")]
    order_popover_front(window);
    #[cfg(not(target_os = "macos"))]
    let _ = window.set_focus();
}

/// Raise the popover above floating / fullscreen app windows (menu-bar level).
#[cfg(target_os = "macos")]
fn configure_popover_layer(window: &tauri::WebviewWindow) {
    use objc2_app_kit::{
        NSStatusWindowLevel, NSWindow, NSWindowCollectionBehavior,
    };

    let Ok(ns_window_ptr) = window.ns_window() else {
        return;
    };
    let ns_window = unsafe { &*(ns_window_ptr as *const NSWindow) };

    ns_window.setLevel(NSStatusWindowLevel);
    let behavior = ns_window.collectionBehavior()
        | NSWindowCollectionBehavior::CanJoinAllSpaces
        | NSWindowCollectionBehavior::FullScreenAuxiliary
        | NSWindowCollectionBehavior::Stationary;
    ns_window.setCollectionBehavior(behavior);
}

#[cfg(target_os = "macos")]
fn order_popover_front(window: &tauri::WebviewWindow) {
    use objc2_app_kit::NSWindow;

    // Re-assert level in case show/focus reset it to floating.
    configure_popover_layer(window);

    let Ok(ns_window_ptr) = window.ns_window() else {
        let _ = window.set_focus();
        return;
    };
    let ns_window = unsafe { &*(ns_window_ptr as *const NSWindow) };
    ns_window.orderFrontRegardless();
    let _ = window.set_focus();
}
