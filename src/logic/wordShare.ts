import type { SpeakerStats } from './speakerStats';

export interface WordShareEntry {
  key: string;
  name: string;
  words: number;
  /** 0–1 share of total words; 0 when the call has no words. */
  share: number;
}

/**
 * Total words per speaker for the share chart. Sorted most words first.
 * Works for both full and two-way stats.
 */
export function wordShareFromStats(stats: SpeakerStats): WordShareEntry[] {
  const raw =
    stats.mode === 'full'
      ? stats.speakers.map((s) => ({
          key: s.key,
          name: s.displayName,
          words: s.wordCount,
        }))
      : [
          { key: stats.you.key, name: stats.you.displayName, words: stats.you.wordCount },
          {
            key: stats.restOfCall.key,
            name: stats.restOfCall.displayName,
            words: stats.restOfCall.wordCount,
          },
        ];

  const total = raw.reduce((sum, entry) => sum + entry.words, 0);

  return raw
    .map((entry) => ({
      ...entry,
      share: total > 0 ? entry.words / total : 0,
    }))
    .sort((a, b) => b.words - a.words || a.name.localeCompare(b.name));
}
