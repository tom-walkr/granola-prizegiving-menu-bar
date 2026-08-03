/** Per-meeting speaker display-name overrides, keyed by note id then speaker key. */

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** In-memory fallback for Storybook / Vite outside the Tauri shell. */
const memoryByNote = new Map<string, Record<string, string>>();

function normalize(aliases: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, name] of Object.entries(aliases)) {
    const trimmed = name.trim();
    if (trimmed) next[key] = trimmed;
  }
  return next;
}

export async function loadSpeakerAliases(noteId: string): Promise<Record<string, string>> {
  if (!noteId) return {};

  if (!isTauri()) {
    return { ...(memoryByNote.get(noteId) ?? {}) };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  const remote = await invoke<Record<string, string>>('get_speaker_aliases', { noteId });
  return remote ?? {};
}

export async function saveSpeakerAliases(
  noteId: string,
  aliases: Record<string, string>
): Promise<Record<string, string>> {
  const cleaned = normalize(aliases);

  if (!isTauri()) {
    if (Object.keys(cleaned).length === 0) {
      memoryByNote.delete(noteId);
    } else {
      memoryByNote.set(noteId, cleaned);
    }
    return cleaned;
  }

  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('set_speaker_aliases', { noteId, aliases: cleaned });
  return cleaned;
}
