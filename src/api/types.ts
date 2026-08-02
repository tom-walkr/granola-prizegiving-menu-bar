// Types for the Granola public API (https://docs.granola.ai/introduction).
// Timestamps on transcript utterances are modeled as seconds elapsed since
// the start of the recording (not absolute ISO datetimes) so duration math
// is plain subtraction; adjust here if the documented format differs.

export type TranscriptSource = 'microphone' | 'speaker';

export interface TranscriptSpeaker {
  source: TranscriptSource;
  /**
   * Only present on iOS-recorded transcripts. On macOS, entries only
   * distinguish `microphone` (the note owner) from `speaker` (everyone
   * else on the call) — there is no per-person breakdown within `speaker`.
   */
  diarization_label?: string;
}

export interface TranscriptUtterance {
  speaker: TranscriptSpeaker;
  text: string;
  start_timestamp: number;
  end_timestamp: number;
  confidence: number;
}

export interface Attendee {
  name: string;
  email?: string;
}

export interface NoteSummary {
  markdown: string;
}

export interface NoteListItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  attendees: Attendee[];
}

export interface Note extends NoteListItem {
  summary: NoteSummary | null;
  transcript?: TranscriptUtterance[];
}

export interface ListNotesParams {
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  cursor?: string;
  limit?: number;
}

export interface ListNotesResult {
  notes: NoteListItem[];
  hasMore: boolean;
  cursor: string | null;
}

export interface GetNoteOptions {
  includeTranscript?: boolean;
}
