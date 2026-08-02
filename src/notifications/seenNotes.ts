function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Ids the app has already observed (empty outside Tauri / before first write). */
export async function loadSeenNoteIds(): Promise<string[]> {
  if (!isTauri()) return [];
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<string[]>('get_seen_note_ids');
}

export async function saveSeenNoteIds(noteIds: string[]): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('set_seen_note_ids', { noteIds });
}
