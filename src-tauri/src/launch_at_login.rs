use std::sync::atomic::{AtomicBool, Ordering};

// Stub only: not wired to a real login-item API yet (macOS SMAppService on 13+,
// or the legacy SMLoginItemSetEnabled otherwise). State lives in memory so the
// native tray CheckMenuItem has something to sync with; it does not survive an
// app restart and does not actually register the app as a login item.
static LAUNCH_AT_LOGIN_ENABLED: AtomicBool = AtomicBool::new(false);

pub fn get_launch_at_login() -> bool {
    LAUNCH_AT_LOGIN_ENABLED.load(Ordering::Relaxed)
}

pub fn set_launch_at_login(enabled: bool) {
    LAUNCH_AT_LOGIN_ENABLED.store(enabled, Ordering::Relaxed);
}
