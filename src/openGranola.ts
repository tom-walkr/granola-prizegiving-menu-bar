import { invoke } from '@tauri-apps/api/core';

const GRANOLA_NOTE_URL_PREFIX = 'https://notes.granola.ai/';

function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window;
}

/** Open a note in Granola (desktop app when available, else browser). */
export async function openGranolaNote(webUrl: string): Promise<void> {
  const url = webUrl.trim();
  if (!url.startsWith(GRANOLA_NOTE_URL_PREFIX)) {
    throw new Error('Not a Granola note URL');
  }

  if (isTauri()) {
    await invoke('open_external_url', { url });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
