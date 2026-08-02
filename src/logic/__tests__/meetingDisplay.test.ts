import { describe, expect, it } from 'vitest';
import type { NoteListItem } from '../../api/types';
import {
  formatAttendeeLine,
  formatMeetingDate,
  formatMeetingTime,
  groupNotesByDate,
  initialsFromTitle,
} from '../meetingDisplay';

describe('formatAttendeeLine', () => {
  it('returns empty string for no attendees', () => {
    expect(formatAttendeeLine([])).toBe('');
    expect(formatAttendeeLine(undefined)).toBe('');
  });

  it('uses first names only', () => {
    expect(formatAttendeeLine([{ name: 'Alice Smith' }])).toBe('Alice');
  });

  it('joins two names with a comma', () => {
    expect(
      formatAttendeeLine([{ name: 'Alice Smith' }, { name: 'Bob Jones' }])
    ).toBe('Alice, Bob');
  });

  it('collapses extras with & N others', () => {
    expect(
      formatAttendeeLine([
        { name: 'Douglas Brion' },
        { name: 'Damjan' },
        { name: 'Carol Diaz' },
        { name: 'Eve' },
      ])
    ).toBe('Douglas, Damjan & 2 others');
  });
});

describe('initialsFromTitle', () => {
  it('takes two letters from a single word', () => {
    expect(initialsFromTitle('Broshir')).toBe('BR');
  });

  it('takes first letters of the first two words', () => {
    expect(initialsFromTitle('GCP partnership internal discussion')).toBe('GP');
  });
});

describe('formatMeetingDate / formatMeetingTime', () => {
  it('formats a Granola-style date header', () => {
    // Fixed UTC noon so weekday/day don't shift across most local zones.
    expect(formatMeetingDate('2026-06-19T12:00:00.000Z')).toMatch(/Fri.*19.*Jun/);
  });

  it('formats a 24h time', () => {
    const formatted = formatMeetingTime('2026-06-19T16:00:00.000Z');
    expect(formatted).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('groupNotesByDate', () => {
  const notes: NoteListItem[] = [
    {
      id: 'a',
      title: 'Morning',
      created_at: '2026-06-19T09:00:00.000Z',
      updated_at: '2026-06-19T09:00:00.000Z',
      attendees: [],
    },
    {
      id: 'b',
      title: 'Afternoon',
      created_at: '2026-06-19T16:00:00.000Z',
      updated_at: '2026-06-19T16:00:00.000Z',
      attendees: [],
    },
    {
      id: 'c',
      title: 'Yesterday',
      created_at: '2026-06-18T14:00:00.000Z',
      updated_at: '2026-06-18T14:00:00.000Z',
      attendees: [],
    },
  ];

  it('groups by calendar day, newest first, notes newest-first within a day', () => {
    const groups = groupNotesByDate(notes);
    expect(groups).toHaveLength(2);
    expect(groups[0].notes.map((n) => n.id)).toEqual(['b', 'a']);
    expect(groups[1].notes.map((n) => n.id)).toEqual(['c']);
  });
});
