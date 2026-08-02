import { describe, expect, it } from 'vitest';
import { normalizeNote, normalizeNoteListItem, normalizeTranscript } from '../normalize';

describe('normalizeNoteListItem', () => {
  it('maps list payload without attendees and null title', () => {
    expect(
      normalizeNoteListItem({
        id: 'not_abc',
        title: null,
        owner: { name: 'Tom Walker', email: 'tom@example.com' },
        created_at: '2026-07-29T14:06:28.070Z',
        updated_at: '2026-07-30T13:05:58.277Z',
      })
    ).toEqual({
      id: 'not_abc',
      title: 'Untitled note',
      created_at: '2026-07-29T14:06:28.070Z',
      updated_at: '2026-07-30T13:05:58.277Z',
      attendees: [],
    });
  });
});

describe('normalizeTranscript', () => {
  it('converts ISO start/end times to seconds from the first utterance', () => {
    const transcript = normalizeTranscript([
      {
        speaker: { source: 'microphone', attribution: 'me' },
        text: 'Hello',
        start_time: '2026-07-29T14:06:29.198Z',
        end_time: '2026-07-29T14:07:07.838Z',
      },
      {
        speaker: { source: 'speaker', attribution: 'them' },
        text: 'Hi',
        start_time: '2026-07-29T14:07:09.278Z',
        end_time: '2026-07-29T14:07:26.798Z',
      },
    ]);

    expect(transcript).toHaveLength(2);
    expect(transcript![0].start_timestamp).toBe(0);
    expect(transcript![0].end_timestamp).toBeCloseTo(38.64, 2);
    expect(transcript![1].start_timestamp).toBeCloseTo(40.08, 2);
    expect(transcript![0].speaker.source).toBe('microphone');
  });
});

describe('normalizeNote', () => {
  it('maps summary_markdown and attendees from the detail payload', () => {
    const note = normalizeNote({
      id: 'not_abc',
      title: 'Catchup',
      owner: { name: 'Tom', email: 'tom@example.com' },
      created_at: '2026-07-29T14:06:28.070Z',
      updated_at: '2026-07-30T13:05:58.277Z',
      attendees: [{ name: null, email: 'doug@example.com' }, { name: 'Alice' }],
      summary_markdown: '## Hello',
      transcript: [],
    });

    expect(note.summary).toEqual({ markdown: '## Hello' });
    expect(note.attendees).toEqual([
      { name: 'doug@example.com', email: 'doug@example.com' },
      { name: 'Alice' },
    ]);
    expect(note.transcript).toEqual([]);
  });
});
