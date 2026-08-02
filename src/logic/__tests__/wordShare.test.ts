import { describe, expect, it } from 'vitest';
import { mockIosStandupNote, mockMacosOneOnOneNote } from '../../mocks/notes';
import { computeSpeakerStats } from '../speakerStats';
import { formatTalkDuration, wordShareFromStats } from '../wordShare';

describe('wordShareFromStats', () => {
  it('returns per-speaker word and time totals that sum to the transcript', () => {
    const stats = computeSpeakerStats(
      mockIosStandupNote.transcript ?? [],
      mockIosStandupNote.attendees
    );
    const share = wordShareFromStats(stats);

    expect(share.length).toBe(3);
    expect(share[0].words).toBeGreaterThanOrEqual(share[1].words);
    const totalWords = share.reduce((sum, entry) => sum + entry.words, 0);
    const totalSeconds = share.reduce((sum, entry) => sum + entry.seconds, 0);
    const wordShareSum = share.reduce((sum, entry) => sum + entry.wordShare, 0);
    const timeShareSum = share.reduce((sum, entry) => sum + entry.timeShare, 0);
    expect(wordShareSum).toBeCloseTo(1, 5);
    expect(timeShareSum).toBeCloseTo(1, 5);
    expect(totalWords).toBeGreaterThan(0);
    expect(totalSeconds).toBeGreaterThan(0);
  });

  it('supports the two-way you / rest split', () => {
    const stats = computeSpeakerStats(mockMacosOneOnOneNote.transcript ?? []);
    const share = wordShareFromStats(stats);

    expect(share.map((entry) => entry.name).sort()).toEqual(['Rest of call', 'You']);
    expect(share.every((entry) => entry.words >= 0 && entry.seconds >= 0)).toBe(true);
  });
});

describe('formatTalkDuration', () => {
  it('formats under a minute as seconds only', () => {
    expect(formatTalkDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatTalkDuration(125)).toBe('2m 5s');
  });
});
