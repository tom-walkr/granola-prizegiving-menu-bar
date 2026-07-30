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
  const key = import.meta.env.VITE_GRANOLA_API_KEY;
  if (!key) {
    throw new GranolaConfigError(
      'VITE_GRANOLA_API_KEY is not set. Add it to your .env file (see .env.example). ' +
        'Set VITE_USE_MOCK_DATA=true instead if you want to run against fixture data.'
    );
  }
  return key;
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

function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

function backoffDelayMs(attempt: number): number {
  return RETRY_BASE_DELAY_MS * 2 ** attempt;
}

async function safeErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.text();
    return body || response.statusText;
  } catch {
    return response.statusText;
  }
}

/** Fetches one JSON response, respecting the rate limit queue and retrying 429s up to MAX_RETRIES times. */
async function requestJson<T>(path: string, attempt = 0): Promise<T> {
  const apiKey = getApiKey();
  await requestQueue.acquire();

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (response.status === 429 && attempt < MAX_RETRIES) {
    const delay = parseRetryAfterMs(response.headers.get('retry-after')) ?? backoffDelayMs(attempt);
    await sleep(delay);
    return requestJson<T>(path, attempt + 1);
  }

  if (response.status === 404) {
    throw new GranolaApiError(404, 'not found');
  }

  if (!response.ok) {
    throw new GranolaApiError(response.status, await safeErrorMessage(response));
  }

  return (await response.json()) as T;
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
