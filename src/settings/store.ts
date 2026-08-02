import { reactive, readonly } from 'vue';
import { DEFAULT_SETTINGS, envSeedSettings, type AppSettings } from './types';

const state = reactive<AppSettings>({ ...DEFAULT_SETTINGS });
let hydrated = false;

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function apply(settings: AppSettings): void {
  state.apiKey = settings.apiKey;
  state.useMockData = settings.useMockData;
}

/** Live settings — prefer this over reading Vite env at call sites. */
export const settings = readonly(state);

export function isSettingsHydrated(): boolean {
  return hydrated;
}

export async function loadSettings(): Promise<AppSettings> {
  if (!isTauri()) {
    apply(envSeedSettings());
    hydrated = true;
    return { ...state };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  const remote = await invoke<{ settings: AppSettings; fromDisk: boolean }>('get_settings');
  if (!remote.fromDisk) {
    apply(envSeedSettings());
  } else {
    apply(remote.settings);
  }
  hydrated = true;
  return { ...state };
}

export async function saveSettings(next: AppSettings): Promise<AppSettings> {
  const normalized: AppSettings = {
    apiKey: next.apiKey.trim(),
    useMockData: next.useMockData,
  };

  if (!isTauri()) {
    apply(normalized);
    hydrated = true;
    return { ...state };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  const saved = await invoke<AppSettings>('set_settings', { settings: normalized });
  apply(saved);
  hydrated = true;
  return { ...state };
}

export async function openSettingsWindow(): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_settings_window');
}

export async function closeSettingsWindow(): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('close_settings_window');
}

/** Keep the popover in sync when the settings window saves. */
export async function listenSettingsChanged(
  onChange: (settings: AppSettings) => void
): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import('@tauri-apps/api/event');
  const unlisten = await listen<AppSettings>('settings-changed', (event) => {
    apply(event.payload);
    hydrated = true;
    onChange(event.payload);
  });
  return unlisten;
}
