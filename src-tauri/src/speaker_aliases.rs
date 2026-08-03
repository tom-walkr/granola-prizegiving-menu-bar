//! Per-meeting speaker display-name overrides (e.g. "Speaker A" → "Alice").
//! Scoped by note id so renames never leak across meetings.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const SPEAKER_ALIASES_FILE: &str = "speaker-aliases.json";

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SpeakerAliasesFile {
    /// noteId → (speakerKey → display name)
    #[serde(default)]
    notes: BTreeMap<String, BTreeMap<String, String>>,
}

fn speaker_aliases_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir.join(SPEAKER_ALIASES_FILE))
}

fn read_file(app: &AppHandle) -> Result<SpeakerAliasesFile, String> {
    let path = speaker_aliases_path(app)?;
    if !path.exists() {
        return Ok(SpeakerAliasesFile::default());
    }
    let raw = fs::read_to_string(&path).map_err(|err| err.to_string())?;
    serde_json::from_str(&raw).map_err(|err| err.to_string())
}

fn write_file(app: &AppHandle, file: &SpeakerAliasesFile) -> Result<(), String> {
    let path = speaker_aliases_path(app)?;
    let raw = serde_json::to_string_pretty(file).map_err(|err| err.to_string())?;
    fs::write(&path, raw).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn get_speaker_aliases(
    app: AppHandle,
    note_id: String,
) -> Result<BTreeMap<String, String>, String> {
    let file = read_file(&app)?;
    Ok(file.notes.get(&note_id).cloned().unwrap_or_default())
}

#[tauri::command]
pub fn set_speaker_aliases(
    app: AppHandle,
    note_id: String,
    aliases: BTreeMap<String, String>,
) -> Result<(), String> {
    let mut file = read_file(&app)?;
    let cleaned: BTreeMap<String, String> = aliases
        .into_iter()
        .filter_map(|(key, name)| {
            let trimmed = name.trim().to_string();
            if trimmed.is_empty() {
                None
            } else {
                Some((key, trimmed))
            }
        })
        .collect();

    if cleaned.is_empty() {
        file.notes.remove(&note_id);
    } else {
        file.notes.insert(note_id, cleaned);
    }

    write_file(&app, &file)
}
