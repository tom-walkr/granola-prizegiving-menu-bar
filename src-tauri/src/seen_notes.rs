//! Persisted set of note ids the app has already observed.
//! Used to baseline on first poll and notify only for meetings that appear later.

use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const SEEN_NOTES_FILE: &str = "seen-notes.json";

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SeenNotesFile {
    #[serde(default)]
    note_ids: BTreeSet<String>,
}

fn seen_notes_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir.join(SEEN_NOTES_FILE))
}

#[tauri::command]
pub fn get_seen_note_ids(app: AppHandle) -> Result<Vec<String>, String> {
    let path = seen_notes_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&path).map_err(|err| err.to_string())?;
    let file: SeenNotesFile = serde_json::from_str(&raw).map_err(|err| err.to_string())?;
    Ok(file.note_ids.into_iter().collect())
}

#[tauri::command]
pub fn set_seen_note_ids(app: AppHandle, note_ids: Vec<String>) -> Result<(), String> {
    let path = seen_notes_path(&app)?;
    let file = SeenNotesFile {
        note_ids: note_ids.into_iter().collect(),
    };
    let raw = serde_json::to_string_pretty(&file).map_err(|err| err.to_string())?;
    fs::write(&path, raw).map_err(|err| err.to_string())?;
    Ok(())
}
