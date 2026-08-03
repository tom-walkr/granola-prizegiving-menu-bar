import { describe, expect, it } from 'vitest';
import { applySpeakerAliases } from '../speakerAliases';
import type { SpeakerStats } from '../speakerStats';

const fullStats: SpeakerStats = {
  mode: 'full',
  speakers: [
    {
      key: 'Speaker A',
      displayName: 'Speaker A',
      totalDurationSeconds: 10,
      utteranceCount: 1,
      longestUtterance: null,
      wordCount: 20,
      wordsPerMinute: 120,
      overlapCount: 0,
    },
    {
      key: 'Speaker B',
      displayName: 'Speaker B',
      totalDurationSeconds: 5,
      utteranceCount: 1,
      longestUtterance: null,
      wordCount: 8,
      wordsPerMinute: 96,
      overlapCount: 0,
    },
  ],
};

describe('applySpeakerAliases', () => {
  it('renames matching speakers and leaves others alone', () => {
    const next = applySpeakerAliases(fullStats, { 'Speaker A': 'Alice' });
    if (next.mode !== 'full') throw new Error('expected full');
    expect(next.speakers.map((s) => s.displayName)).toEqual(['Alice', 'Speaker B']);
    expect(next.speakers[0].key).toBe('Speaker A');
  });

  it('ignores blank aliases so clearing reverts to the original label', () => {
    const next = applySpeakerAliases(fullStats, { 'Speaker A': '   ' });
    expect(next).toEqual(fullStats);
  });

  it('returns the same object when there are no aliases', () => {
    expect(applySpeakerAliases(fullStats, {})).toBe(fullStats);
  });
});
