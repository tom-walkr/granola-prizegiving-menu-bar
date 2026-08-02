import type { Attendee, TranscriptUtterance } from '../api/types';

export interface SpeakerProfile {
  key: string;
  displayName: string;
  totalDurationSeconds: number;
  utteranceCount: number;
  longestUtterance: { durationSeconds: number; text: string } | null;
  wordCount: number;
  wordsPerMinute: number;
  /** Approximate: counts utterances that started before the previous (different) speaker's utterance ended. */
  overlapCount: number;
}

export interface FullSpeakerStats {
  mode: 'full';
  speakers: SpeakerProfile[];
}

export interface TwoWaySpeakerStats {
  mode: 'two-way';
  you: SpeakerProfile;
  restOfCall: SpeakerProfile;
}

export type SpeakerStats = FullSpeakerStats | TwoWaySpeakerStats;

interface Accumulator {
  key: string;
  displayName: string;
  totalDurationSeconds: number;
  utteranceCount: number;
  longestUtterance: { durationSeconds: number; text: string } | null;
  wordCount: number;
  overlapCount: number;
}

function newAccumulator(key: string, displayName: string): Accumulator {
  return {
    key,
    displayName,
    totalDurationSeconds: 0,
    utteranceCount: 0,
    longestUtterance: null,
    wordCount: 0,
    overlapCount: 0,
  };
}

function finalize(acc: Accumulator): SpeakerProfile {
  const minutes = acc.totalDurationSeconds / 60;
  return {
    key: acc.key,
    displayName: acc.displayName,
    totalDurationSeconds: acc.totalDurationSeconds,
    utteranceCount: acc.utteranceCount,
    longestUtterance: acc.longestUtterance,
    wordCount: acc.wordCount,
    wordsPerMinute: minutes > 0 ? acc.wordCount / minutes : 0,
    overlapCount: acc.overlapCount,
  };
}

function utteranceDuration(utterance: TranscriptUtterance): number {
  const start = Number(utterance.start_timestamp);
  const end = Number(utterance.end_timestamp);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, end - start);
}

/** Fallback when Granola returns equal start/end (common on memos / dictation). */
const WORDS_PER_MINUTE_ESTIMATE = 150;

function estimateDurationFromWords(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return (wordCount / WORDS_PER_MINUTE_ESTIMATE) * 60;
}

function countWords(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

/**
 * Accumulates duration/word/overlap stats for a chronologically-sorted list
 * of utterances into pre-seeded accumulators, keyed by `keyFor`.
 */
function accumulate(
  sorted: TranscriptUtterance[],
  keyFor: (utterance: TranscriptUtterance) => string,
  accumulators: Map<string, Accumulator>
): void {
  sorted.forEach((utterance, index) => {
    const key = keyFor(utterance);
    const acc = accumulators.get(key);
    if (!acc) return;

    const words = countWords(utterance.text);
    let duration = utteranceDuration(utterance);
    // Timed span missing or zero — estimate from words so awards aren't all "0s".
    if (duration <= 0 && words > 0) {
      duration = estimateDurationFromWords(words);
    }

    acc.totalDurationSeconds += duration;
    acc.utteranceCount += 1;
    acc.wordCount += words;

    if (!acc.longestUtterance || duration > acc.longestUtterance.durationSeconds) {
      acc.longestUtterance = { durationSeconds: duration, text: utterance.text };
    }

    if (index > 0) {
      const previous = sorted[index - 1];
      const previousKey = keyFor(previous);
      if (previousKey !== key && utterance.start_timestamp < previous.end_timestamp) {
        acc.overlapCount += 1;
      }
    }
  });
}

function diarizationKey(utterance: TranscriptUtterance): string {
  return utterance.speaker.diarization_label ?? `unlabeled-${utterance.speaker.source}`;
}

function computeFullBreakdown(sorted: TranscriptUtterance[], attendees: Attendee[]): FullSpeakerStats {
  const orderSeen: string[] = [];
  const accumulators = new Map<string, Accumulator>();

  for (const utterance of sorted) {
    const key = diarizationKey(utterance);
    if (accumulators.has(key)) continue;

    orderSeen.push(key);
    // The API doesn't map diarization labels to attendee identity directly,
    // so we join positionally (first label seen -> first attendee) as a
    // best effort; falls back to the raw label when attendees run out.
    const attendee = attendees[orderSeen.length - 1];
    accumulators.set(key, newAccumulator(key, attendee?.name ?? key));
  }

  accumulate(sorted, diarizationKey, accumulators);

  return { mode: 'full', speakers: Array.from(accumulators.values()).map(finalize) };
}

function twoWayKey(utterance: TranscriptUtterance): string {
  return utterance.speaker.source === 'microphone' ? 'you' : 'rest-of-call';
}

function computeTwoWay(sorted: TranscriptUtterance[]): TwoWaySpeakerStats {
  const accumulators = new Map<string, Accumulator>([
    ['you', newAccumulator('you', 'You')],
    ['rest-of-call', newAccumulator('rest-of-call', 'Rest of call')],
  ]);

  accumulate(sorted, twoWayKey, accumulators);

  return {
    mode: 'two-way',
    you: finalize(accumulators.get('you') as Accumulator),
    restOfCall: finalize(accumulators.get('rest-of-call') as Accumulator),
  };
}

/**
 * Branches on whether any utterance carries a diarization_label: iOS
 * transcripts get a full per-person breakdown, macOS-only transcripts (no
 * labels, just microphone/speaker) get a two-way "you vs rest of call" split.
 */
export function computeSpeakerStats(
  utterances: TranscriptUtterance[],
  attendees: Attendee[] = []
): SpeakerStats {
  const sorted = [...utterances].sort((a, b) => a.start_timestamp - b.start_timestamp);
  const hasDiarization = sorted.some((utterance) => Boolean(utterance.speaker.diarization_label));

  return hasDiarization ? computeFullBreakdown(sorted, attendees) : computeTwoWay(sorted);
}
