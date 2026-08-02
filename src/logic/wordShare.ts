import type { SpeakerStats } from './speakerStats';

export interface WordShareEntry {
  key: string;
  name: string;
  words: number;
  seconds: number;
  /** 0–1 share of total words; 0 when the call has no words. */
  wordShare: number;
  /** 0–1 share of total talk time; 0 when the call has no duration. */
  timeShare: number;
}

/**
 * Per-speaker word and talk-time totals for the share chart.
 * Sorted most words first (the chart re-sorts when switched to time mode).
 * Works for both full and two-way stats.
 */
export function wordShareFromStats(stats: SpeakerStats): WordShareEntry[] {
  const raw =
    stats.mode === 'full'
      ? stats.speakers.map((s) => ({
          key: s.key,
          name: s.displayName,
          words: s.wordCount,
          seconds: s.totalDurationSeconds,
        }))
      : [
          {
            key: stats.you.key,
            name: stats.you.displayName,
            words: stats.you.wordCount,
            seconds: stats.you.totalDurationSeconds,
          },
          {
            key: stats.restOfCall.key,
            name: stats.restOfCall.displayName,
            words: stats.restOfCall.wordCount,
            seconds: stats.restOfCall.totalDurationSeconds,
          },
        ];

  const totalWords = raw.reduce((sum, entry) => sum + entry.words, 0);
  const totalSeconds = raw.reduce((sum, entry) => sum + entry.seconds, 0);

  return raw
    .map((entry) => ({
      ...entry,
      wordShare: totalWords > 0 ? entry.words / totalWords : 0,
      timeShare: totalSeconds > 0 ? entry.seconds / totalSeconds : 0,
    }))
    .sort((a, b) => b.words - a.words || a.name.localeCompare(b.name));
}

export function formatTalkDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const remaining = whole % 60;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}
