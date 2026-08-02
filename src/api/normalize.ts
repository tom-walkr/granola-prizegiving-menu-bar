import type {
  Attendee,
  Note,
  NoteListItem,
  TranscriptSource,
  TranscriptUtterance,
} from './types';

/** Wire shapes from https://docs.granola.ai — mapped to our internal Note types. */

export interface ApiUser {
  name: string | null;
  email?: string;
}

export interface ApiNoteListItem {
  id: string;
  title: string | null;
  owner: ApiUser;
  created_at: string;
  updated_at: string;
}

export interface ApiNotesListResponse {
  notes: ApiNoteListItem[];
  hasMore: boolean;
  cursor: string | null;
}

interface ApiSpeaker {
  source?: TranscriptSource;
  diarization_label?: string;
  name?: string;
  attribution?: 'me' | 'them';
}

/** Real payloads use ISO `start_time`/`end_time`; be liberal — field names have drifted. */
export interface ApiTranscriptUtterance {
  speaker?: ApiSpeaker;
  text?: string;
  start_time?: string | number | null;
  end_time?: string | number | null;
  startTime?: string | number | null;
  endTime?: string | number | null;
  start_timestamp?: string | number | null;
  end_timestamp?: string | number | null;
}

export interface ApiNoteDetail extends ApiNoteListItem {
  attendees?: ApiUser[] | null;
  summary_markdown?: string | null;
  transcript?: ApiTranscriptUtterance[] | null;
}

function normalizeAttendee(user: ApiUser): Attendee {
  const name = user.name?.trim() || user.email?.trim() || 'Unknown';
  return user.email ? { name, email: user.email } : { name };
}

/** List endpoint has owner only — no attendees. Keep an empty list for the UI. */
export function normalizeNoteListItem(raw: ApiNoteListItem): NoteListItem {
  return {
    id: raw.id,
    title: raw.title?.trim() || 'Untitled note',
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    attendees: [],
  };
}

function firstPresent(utterance: ApiTranscriptUtterance, keys: (keyof ApiTranscriptUtterance)[]): unknown {
  for (const key of keys) {
    const value = utterance[key];
    if (value != null && value !== '') return value;
  }
  return undefined;
}

/** True for values that are elapsed seconds, not clock times. */
function isRelativeSeconds(value: unknown): value is number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && Math.abs(value) < 1e8;
  }
  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    const n = Number(value);
    return Number.isFinite(n) && Math.abs(n) < 1e8;
  }
  return false;
}

/**
 * Parse an API clock time to UTC epoch ms.
 * Prefer a manual ISO parse — some webviews are flaky with Date.parse on
 * fractional-second ISO strings, which zeroed out every talk-time award.
 */
export function parseApiTimeToMs(value: unknown): number | null {
  if (value == null || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 1e12) return value; // epoch ms
    if (value >= 1e9) return value * 1000; // epoch seconds
    return null; // relative seconds — handled elsewhere
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || isRelativeSeconds(trimmed)) return null;

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:Z|[+-]\d{2}:?\d{2})?$/i
  );
  if (match) {
    const ms = (match[7] ?? '0').padEnd(3, '0').slice(0, 3);
    return Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6]),
      Number(ms)
    );
  }

  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function relativeSecondsFrom(value: unknown): number | null {
  if (!isRelativeSeconds(value)) return null;
  return typeof value === 'number' ? value : Number(value);
}

function minFinite(values: number[]): number | null {
  let min: number | null = null;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (min === null || value < min) min = value;
  }
  return min;
}

/**
 * Convert API transcript timings into seconds-from-recording-start so
 * duration math in speakerStats stays plain subtraction.
 */
export function normalizeTranscript(
  raw: ApiTranscriptUtterance[] | null | undefined
): TranscriptUtterance[] | undefined {
  if (raw == null) return undefined;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const startKeys = ['start_time', 'startTime', 'start_timestamp'] as const;
  const endKeys = ['end_time', 'endTime', 'end_timestamp'] as const;

  const absoluteStarts = raw.map((u) => parseApiTimeToMs(firstPresent(u, [...startKeys])));
  const epochMs = minFinite(absoluteStarts.filter((v): v is number => v != null));

  return raw.map((utterance, index) => {
    const startRaw = firstPresent(utterance, [...startKeys]);
    const endRaw = firstPresent(utterance, [...endKeys]);

    let startTimestamp = 0;
    let endTimestamp = 0;

    if (epochMs != null) {
      const startAbs = parseApiTimeToMs(startRaw) ?? absoluteStarts[index] ?? epochMs;
      const endAbs = parseApiTimeToMs(endRaw) ?? startAbs;
      startTimestamp = Math.max(0, (startAbs - epochMs) / 1000);
      endTimestamp = Math.max(0, (endAbs - epochMs) / 1000);
    } else {
      startTimestamp = relativeSecondsFrom(startRaw) ?? 0;
      endTimestamp = relativeSecondsFrom(endRaw) ?? startTimestamp;
    }

    if (endTimestamp < startTimestamp) {
      endTimestamp = startTimestamp;
    }

    const source: TranscriptSource =
      utterance.speaker?.source === 'microphone' || utterance.speaker?.source === 'speaker'
        ? utterance.speaker.source
        : 'speaker';

    return {
      speaker: {
        source,
        ...(utterance.speaker?.diarization_label
          ? { diarization_label: utterance.speaker.diarization_label }
          : {}),
      },
      text: utterance.text ?? '',
      start_timestamp: startTimestamp,
      end_timestamp: endTimestamp,
      confidence: 1,
    };
  });
}

export function normalizeNote(raw: ApiNoteDetail): Note {
  const list = normalizeNoteListItem(raw);
  const attendees = (raw.attendees ?? []).map(normalizeAttendee);
  const markdown = raw.summary_markdown?.trim();

  return {
    ...list,
    attendees,
    summary: markdown ? { markdown } : null,
    transcript: normalizeTranscript(raw.transcript),
  };
}
