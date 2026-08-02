import { describe, expect, it } from 'vitest';
import { normalizeNote, normalizeTranscript, parseApiTimeToMs } from '../normalize';

describe('parseApiTimeToMs', () => {
  it('parses fractional ISO times without Date.parse', () => {
    const start = parseApiTimeToMs('2026-07-29T14:06:29.198Z');
    const end = parseApiTimeToMs('2026-07-29T14:07:07.838Z');
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();
    expect((end! - start!) / 1000).toBeCloseTo(38.64, 2);
  });

  it('does not treat relative-second strings as clock times', () => {
    expect(parseApiTimeToMs('38.64')).toBeNull();
    expect(parseApiTimeToMs(38.64)).toBeNull();
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
    expect(transcript![0].end_timestamp - transcript![0].start_timestamp).toBeGreaterThan(1);
  });

  it('keeps already-relative numeric timestamps', () => {
    const transcript = normalizeTranscript([
      {
        speaker: { source: 'microphone' },
        text: 'Hello',
        start_timestamp: 0,
        end_timestamp: 12.5,
      },
      {
        speaker: { source: 'speaker' },
        text: 'Hi',
        start_timestamp: 13,
        end_timestamp: 20,
      },
    ]);

    expect(transcript![0]).toMatchObject({ start_timestamp: 0, end_timestamp: 12.5 });
    expect(transcript![1]).toMatchObject({ start_timestamp: 13, end_timestamp: 20 });
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
