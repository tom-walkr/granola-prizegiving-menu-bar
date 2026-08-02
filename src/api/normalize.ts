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
  source: TranscriptSource;
  diarization_label?: string;
  name?: string;
  attribution?: 'me' | 'them';
}

interface ApiTranscriptUtterance {
  speaker: ApiSpeaker;
  text: string;
  start_time: string;
  end_time: string;
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

/**
 * Convert absolute ISO start/end times into seconds-from-recording-start so
 * duration math in speakerStats stays plain subtraction.
 */
export function normalizeTranscript(
  raw: ApiTranscriptUtterance[] | null | undefined
): TranscriptUtterance[] | undefined {
  if (raw == null) return undefined;
  if (raw.length === 0) return [];

  const epochMs = Math.min(...raw.map((u) => Date.parse(u.start_time)));
  if (!Number.isFinite(epochMs)) return [];

  return raw.map((u) => ({
    speaker: {
      source: u.speaker.source,
      ...(u.speaker.diarization_label
        ? { diarization_label: u.speaker.diarization_label }
        : {}),
    },
    text: u.text,
    start_timestamp: Math.max(0, (Date.parse(u.start_time) - epochMs) / 1000),
    end_timestamp: Math.max(0, (Date.parse(u.end_time) - epochMs) / 1000),
    confidence: 1,
  }));
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
