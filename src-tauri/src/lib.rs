mod granola_api;
mod launch_at_login;
mod open_url;
mod popover;
mod seen_notes;
mod settings;
mod speaker_aliases;

use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    window::{Effect, EffectState, EffectsBuilder},
    Manager, WindowEvent,
};
use tauri_plugin_positioner::on_tray_event;

const POPOVER_LABEL: &str = "popover";
const SETTINGS_LABEL: &str = "settings";
const LAUNCH_AT_LOGIN_ID: &str = "launch-at-login";
const SETTINGS_ID: &str = "settings";

// Prizegiving logo (from src/assets/granola-pg-logo.svg) as a template image:
// macOS ignores RGB and tints the alpha mask for light/dark menu bars.
// Light/dark PNG pairs stay in sync for a future non-template swap.
const TRAY_ICON_BYTES: &[u8] = include_bytes!("../icons/tray/tray-icon-dark@2x.png");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            granola_api::granola_http_get,
            open_url::open_external_url,
            settings::get_settings,
            settings::set_settings,
            settings::open_settings_window,
            settings::close_settings_window,
            seen_notes::get_seen_note_ids,
            seen_notes::set_seen_note_ids,
            speaker_aliases::get_speaker_aliases,
            speaker_aliases::set_speaker_aliases,
            popover::show_popover,
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
            }

            let blur_target = popover.clone();
            popover.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    // Tray clicks focus the menu bar, not the popover — that
                    // fires Focused(false) in the same tick as show(). Skip
                    // those; real outside-clicks still dismiss after the grace.
                    if popover::should_ignore_blur() {
                        return;
                    }
                    let _ = blur_target.hide();
                }
            });

            let settings_window = app
                .get_webview_window(SETTINGS_LABEL)
                .expect("settings window must be declared in tauri.conf.json");
            let settings_hide = settings_window.clone();
            settings_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = settings_hide.hide();
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
            let settings_item =
                MenuItem::with_id(app, SETTINGS_ID, "Settings…", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit = PredefinedMenuItem::quit(app, None)?;
            let tray_menu =
                Menu::with_items(app, &[&settings_item, &launch_at_login, &separator, &quit])?;

            TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(true)
                .menu(&tray_menu)
                // Left click toggles the awards popover; right click shows the tray menu.
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    let id = event.id().as_ref();
                    if id == LAUNCH_AT_LOGIN_ID {
                        // CheckMenuItem toggles itself before this fires — sync the stub.
                        let enabled = launch_at_login.is_checked().unwrap_or(false);
                        launch_at_login::set_launch_at_login(enabled);
                        return;
                    }
                    if id == SETTINGS_ID {
                        let _ = settings::open_settings_window(app.clone());
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    on_tray_event(tray.app_handle(), &event);

                    // Handle on mouse-down so we win the race against the
                    // Focused(false) that macOS emits for menu-bar clicks.
                    let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Down,
                        ..
                    } = event
                    else {
                        return;
                    };

                    let app = tray.app_handle();
                    let Some(window) = app.get_webview_window(POPOVER_LABEL) else {
                        return;
                    };
                    popover::toggle_popover(&window);
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
