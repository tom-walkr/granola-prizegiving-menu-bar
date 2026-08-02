import { getMockNote, mockNoteList } from '../mocks/notes';
import type {
  GetNoteOptions,
  ListNotesParams,
  ListNotesResult,
  Note,
  NoteListItem,
  NotesApiResponse,
} from './types';

const BASE_URL = 'https://public-api.granola.ai/v1';

// Burst of 25 requests / 5s and sustained 5 req/s describe the same rolling
// window (25 / 5s == 5/s), so one sliding-window limiter satisfies both.
const RATE_LIMIT_MAX_REQUESTS = 25;
const RATE_LIMIT_WINDOW_MS = 5000;

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

export class GranolaConfigError extends Error {}

export class GranolaApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function isMockDataEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

function getApiKey(): string {
  const key = import.meta.env.VITE_GRANOLA_API_KEY?.trim();
  if (!key) {
    throw new GranolaConfigError(
      'VITE_GRANOLA_API_KEY is not set. Add it to your .env file (see .env.example). ' +
        'Set VITE_USE_MOCK_DATA=true instead if you want to run against fixture data.'
    );
  }
  return key;
}

function isRunningInTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

type NativeHttpResponse = { status: number; body: string };

/**
 * Browser fetch hits CORS (Granola's OPTIONS preflight 404s). In Tauri, route
 * through a Rust command (`granola_http_get`) instead. Outside Tauri, only mock
 * mode works — opening the Vite URL in Safari/Chrome will never reach the real API.
 */
async function granolaHttpGet(url: string, authorization: string): Promise<NativeHttpResponse> {
  if (!isRunningInTauri()) {
    throw new GranolaConfigError(
      'The Granola API only works inside the menu bar app (npm run dev / the .app). ' +
        'Opening the Vite URL in a browser hits CORS. Use VITE_USE_MOCK_DATA=true for Storybook or plain Vite.'
    );
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<NativeHttpResponse>('granola_http_get', { url, authorization });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sliding-window request limiter: at most RATE_LIMIT_MAX_REQUESTS in any RATE_LIMIT_WINDOW_MS. */
class RequestQueue {
  private timestamps: number[] = [];

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = (): void => {
        const now = Date.now();
        this.timestamps = this.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

        if (this.timestamps.length < RATE_LIMIT_MAX_REQUESTS) {
          this.timestamps.push(now);
          resolve();
          return;
        }

        const oldest = this.timestamps[0];
        const delay = RATE_LIMIT_WINDOW_MS - (now - oldest) + 1;
        setTimeout(tryAcquire, delay);
      };
      tryAcquire();
    });
  }
}

const requestQueue = new RequestQueue();

function backoffDelayMs(attempt: number): number {
  return RETRY_BASE_DELAY_MS * 2 ** attempt;
}

function errorBodyMessage(body: string, fallback: string): string {
  const trimmed = body.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = JSON.parse(trimmed) as { message?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim();
    }
  } catch {
    // not JSON — fall through
  }
  return trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed;
}

function stringifyUnknownError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (err && typeof err === 'object') {
    const record = err as { message?: unknown; error?: unknown };
    if (typeof record.message === 'string' && record.message.trim()) return record.message.trim();
    if (typeof record.error === 'string' && record.error.trim()) return record.error.trim();
    try {
      return JSON.stringify(err);
    } catch {
      // ignore
    }
  }
  return '';
}

/** Fetches one JSON response, respecting the rate limit queue and retrying 429s up to MAX_RETRIES times. */
async function requestJson<T>(path: string, attempt = 0): Promise<T> {
  const apiKey = getApiKey();
  await requestQueue.acquire();

  let response: NativeHttpResponse;
  try {
    response = await granolaHttpGet(`${BASE_URL}${path}`, `Bearer ${apiKey}`);
  } catch (err) {
    const detail = stringifyUnknownError(err);
    throw new Error(detail || "Couldn't reach Granola.");
  }

  if (response.status === 429 && attempt < MAX_RETRIES) {
    await sleep(backoffDelayMs(attempt));
    return requestJson<T>(path, attempt + 1);
  }

  if (response.status === 404) {
    throw new GranolaApiError(404, 'not found');
  }

  if (response.status < 200 || response.status >= 300) {
    throw new GranolaApiError(
      response.status,
      errorBodyMessage(response.body, `HTTP ${response.status}`)
    );
  }

  try {
    return JSON.parse(response.body) as T;
  } catch {
    throw new Error('Granola returned a non-JSON response.');
  }
}

/** User-facing copy for note-list / note-detail load failures. */
export function describeGranolaLoadError(err: unknown): string {
  if (
    err instanceof GranolaConfigError &&
    /menu bar app|CORS|VITE_USE_MOCK_DATA/i.test(err.message)
  ) {
    return 'Open the tray popover (npm run dev), not the Vite URL in a browser.';
  }
  if (err instanceof GranolaConfigError) {
    return 'Add your API key to .env, then restart the app.';
  }
  if (err instanceof GranolaApiError && (err.status === 401 || err.status === 403)) {
    return 'Check your API key in .env, then restart the app.';
  }
  if (
    err instanceof TypeError ||
    (err instanceof Error && /load failed|failed to fetch|networkerror/i.test(err.message))
  ) {
    return "Couldn't reach Granola. Check your API key, then restart the app.";
  }
  const detail = stringifyUnknownError(err);
  if (detail) return detail;
  return "Couldn't load notes. Check your API key, then restart the app.";
}

function buildNotesQuery(params: ListNotesParams): string {
  const query = new URLSearchParams();
  if (params.created_after) query.set('created_after', params.created_after);
  if (params.created_before) query.set('created_before', params.created_before);
  if (params.updated_after) query.set('updated_after', params.updated_after);
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

// Small artificial delay so mock mode (used in dev and Storybook) still
// shows a real loading state instead of resolving instantly.
const MOCK_LATENCY_MS = 400;

export async function listNotes(params: ListNotesParams = {}): Promise<ListNotesResult> {
  if (isMockDataEnabled()) {
    await sleep(MOCK_LATENCY_MS);
    return { notes: mockNoteList(), hasMore: false, cursor: null };
  }

  const data = await requestJson<NotesApiResponse>(`/notes${buildNotesQuery(params)}`);
  return {
    notes: data.notes,
    hasMore: data.has_more,
    cursor: data.cursor ?? null,
  };
}

export interface ListAllNotesOptions extends ListNotesParams {
  /** Safety cap on how many pages to follow, regardless of hasMore. */
  maxPages?: number;
}

export async function listAllNotes(options: ListAllNotesOptions = {}): Promise<NoteListItem[]> {
  const { maxPages = 20, ...params } = options;
  const notes: NoteListItem[] = [];
  let cursor = params.cursor;

  for (let page = 0; page < maxPages; page += 1) {
    const result = await listNotes({ ...params, cursor });
    notes.push(...result.notes);
    if (!result.hasMore || !result.cursor) break;
    cursor = result.cursor;
  }

  return notes;
}

/** Returns null on 404 (note still processing or never summarized) instead of throwing. */
export async function getNote(id: string, options: GetNoteOptions = {}): Promise<Note | null> {
  if (isMockDataEnabled()) {
    await sleep(MOCK_LATENCY_MS);
    return getMockNote(id);
  }

  const query = options.includeTranscript ? '?include=transcript' : '';
  try {
    return await requestJson<Note>(`/notes/${encodeURIComponent(id)}${query}`);
  } catch (error) {
    if (error instanceof GranolaApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
