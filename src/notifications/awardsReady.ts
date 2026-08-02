import type { Options } from '@tauri-apps/plugin-notification';

const ACTION_TYPE_ID = 'awards-ready';

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Stable 32-bit id so we can replace an in-flight notification for the same note. */
export function noteIdToNotificationId(noteId: string): number {
  let hash = 0;
  for (let i = 0; i < noteId.length; i += 1) {
    hash = (Math.imul(31, hash) + noteId.charCodeAt(i)) | 0;
  }
  return hash === 0 ? 1 : hash;
}

let permissionReady: Promise<boolean> | null = null;

/** Request notification permission once; no-op outside Tauri. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isTauri()) return false;
  if (!permissionReady) {
    permissionReady = (async () => {
      const {
        isPermissionGranted,
        requestPermission,
        registerActionTypes,
      } = await import('@tauri-apps/plugin-notification');
      let granted = await isPermissionGranted();
      if (!granted) {
        granted = (await requestPermission()) === 'granted';
      }
      if (granted) {
        try {
          await registerActionTypes([
            {
              id: ACTION_TYPE_ID,
              actions: [{ id: 'open', title: 'Open', foreground: true }],
            },
          ]);
        } catch {
          // Action types are best-effort; body click still works on macOS.
        }
      }
      return granted;
    })();
  }
  return permissionReady;
}

export async function notifyAwardsReady(noteId: string, title: string): Promise<void> {
  if (!(await ensureNotificationPermission())) return;
  const { sendNotification } = await import('@tauri-apps/plugin-notification');
  sendNotification({
    id: noteIdToNotificationId(noteId),
    title: 'Awards ready',
    body: title.trim() || 'New meeting',
    actionTypeId: ACTION_TYPE_ID,
    autoCancel: true,
    extra: { noteId },
  });
}

/** Listen for notification clicks; returns an unsubscribe. */
export async function listenAwardsReadyOpen(
  onOpen: (noteId: string) => void
): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  await ensureNotificationPermission();
  const { onAction } = await import('@tauri-apps/plugin-notification');
  const listener = await onAction((notification: Options) => {
    const noteId = notification.extra?.noteId;
    if (typeof noteId === 'string' && noteId.length > 0) onOpen(noteId);
  });
  return () => {
    void listener.unregister();
  };
}

export async function showPopoverWindow(): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('show_popover');
}

export async function isPopoverFocused(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    return await getCurrentWindow().isFocused();
  } catch {
    return false;
  }
}
