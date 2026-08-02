import { describe, expect, it } from 'vitest';
import { mockIosStandupNote, mockMacosOneOnOneNote } from '../../mocks/notes';
import { computeAwards } from '../awards';
import { computeSpeakerStats } from '../speakerStats';

describe('computeAwards', () => {
  it('produces five distinct, non-tied award winners for a full breakdown', () => {
    const stats = computeSpeakerStats(mockIosStandupNote.transcript ?? [], mockIosStandupNote.attendees);
    const result = computeAwards(stats);

    expect(result.mode).toBe('full');
    if (result.mode !== 'full') throw new Error('unreachable');
    expect(result.awards).toHaveLength(5);

    const winnerById = Object.fromEntries(result.awards.map((award) => [award.id, award.winnerName]));
    expect(winnerById['longest-monologue']).toBe('Bob Jones');
    expect(winnerById['quietest-mouse']).toBe('Alice Smith');
    expect(winnerById['chatterbox']).toBe('Carol Diaz');
    expect(winnerById['fastest-talker']).toBe('Carol Diaz');
    expect(winnerById['most-interruptions']).toBe('Alice Smith');
  });

  it('collapses to a single honest comparison in two-way mode, not five categories', () => {
    const stats = computeSpeakerStats(mockMacosOneOnOneNote.transcript ?? []);
    const result = computeAwards(stats);

    expect(result.mode).toBe('two-way');
    if (result.mode !== 'two-way') throw new Error('unreachable');
    expect(result.label).toBe('You talked less than the rest of the call');
  });

  it('omits awards whose winning metric is zero', () => {
    const result = computeAwards({
      mode: 'full',
      speakers: [
        {
          key: 'a',
          displayName: 'Alice',
          totalDurationSeconds: 60,
          wordCount: 120,
          wordsPerMinute: 120,
          utteranceCount: 2,
          overlapCount: 0,
          longestUtterance: { text: 'hello world', durationSeconds: 30 },
        },
        {
          key: 'b',
          displayName: 'Bob',
          totalDurationSeconds: 40,
          wordCount: 80,
          wordsPerMinute: 120,
          utteranceCount: 1,
          overlapCount: 0,
          longestUtterance: { text: 'hey', durationSeconds: 40 },
        },
      ],
    });

    expect(result.mode).toBe('full');
    if (result.mode !== 'full') throw new Error('unreachable');
    expect(result.awards.map((award) => award.id)).not.toContain('most-interruptions');
    expect(result.awards.some((award) => award.id === 'chatterbox')).toBe(true);
  });
});
