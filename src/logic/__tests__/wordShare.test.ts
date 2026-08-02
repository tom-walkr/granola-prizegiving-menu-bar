import { describe, expect, it } from 'vitest';
import { mockIosStandupNote, mockMacosOneOnOneNote } from '../../mocks/notes';
import { computeSpeakerStats } from '../speakerStats';
import { wordShareFromStats } from '../wordShare';

describe('wordShareFromStats', () => {
  it('returns per-speaker word totals that sum to the transcript', () => {
    const stats = computeSpeakerStats(
      mockIosStandupNote.transcript ?? [],
      mockIosStandupNote.attendees
    );
    const share = wordShareFromStats(stats);

    expect(share.length).toBe(3);
    expect(share[0].words).toBeGreaterThanOrEqual(share[1].words);
    const total = share.reduce((sum, entry) => sum + entry.words, 0);
    const shareSum = share.reduce((sum, entry) => sum + entry.share, 0);
    expect(shareSum).toBeCloseTo(1, 5);
    expect(total).toBeGreaterThan(0);
  });

  it('supports the two-way you / rest split', () => {
    const stats = computeSpeakerStats(mockMacosOneOnOneNote.transcript ?? []);
    const share = wordShareFromStats(stats);

    expect(share.map((entry) => entry.name).sort()).toEqual(['Rest of call', 'You']);
    expect(share.every((entry) => entry.words >= 0)).toBe(true);
  });
});
