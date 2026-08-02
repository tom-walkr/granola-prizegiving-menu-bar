import type { Attendee, NoteListItem } from '../api/types';

export interface MeetingDateGroup {
  /** Stable key for Vue list rendering (ISO date YYYY-MM-DD). */
  key: string;
  /** Granola-style label, e.g. "Fri 19 Jun". */
  label: string;
  notes: NoteListItem[];
}

const DATE_HEADER_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "Fri 19 Jun" — matches Granola's note list date headers. */
export function formatMeetingDate(iso: string): string {
  return DATE_HEADER_FORMATTER.format(new Date(iso));
}

/** "16:00" — 24h clock like Granola's trailing meta. */
export function formatMeetingTime(iso: string): string {
  return TIME_FORMATTER.format(new Date(iso));
}

/**
 * Granola attendee line: first names, then "& N others" once the list grows.
 * Examples: "Alice", "Alice, Bob", "Alice, Bob & 2 others".
 */
export function formatAttendeeLine(attendees: Attendee[] | null | undefined, maxNamed = 2): string {
  const names = (attendees ?? [])
    .map((a) => (a.name ?? '').trim())
    .filter(Boolean)
    .map(firstName);

  if (names.length === 0) return '';
  if (names.length <= maxNamed) return names.join(', ');

  const shown = names.slice(0, maxNamed).join(', ');
  const rest = names.length - maxNamed;
  return `${shown} & ${rest} ${rest === 1 ? 'other' : 'others'}`;
}

/** Initials for the avatar tile — up to two characters from the note title. */
export function initialsFromTitle(title: string): string {
  const words = title
    .trim()
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w));

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Group notes under Granola-style date headers, newest day first. */
export function groupNotesByDate(notes: NoteListItem[]): MeetingDateGroup[] {
  const byDay = new Map<string, NoteListItem[]>();

  for (const note of notes) {
    const key = toDayKey(note.created_at);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(note);
    else byDay.set(key, [note]);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([key, dayNotes]) => ({
      key,
      label: formatMeetingDate(dayNotes[0].created_at),
      notes: [...dayNotes].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    }));
}

function firstName(full: string): string {
  const part = full.split(/\s+/)[0];
  return part || full;
}

function toDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
