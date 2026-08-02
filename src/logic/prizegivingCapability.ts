import type { TranscriptUtterance } from '../api/types';

/**
 * Whether a note can power the full AwardCard prizegiving (needs per-speaker
 * diarization labels), only the you-vs-rest comparison, or nothing yet.
 */
export type PrizegivingCapability = 'full' | 'two-way' | 'empty';

export function classifyPrizegivingCapability(
  transcript: TranscriptUtterance[] | null | undefined
): PrizegivingCapability {
  if (!transcript || transcript.length === 0) return 'empty';
  if (transcript.some((utterance) => Boolean(utterance.speaker.diarization_label))) {
    return 'full';
  }
  return 'two-way';
}

export function prizegivingCapabilityLabel(capability: PrizegivingCapability): string {
  switch (capability) {
    case 'full':
      return 'Full prizegiving — speakers are labeled';
    case 'two-way':
      return 'You vs rest only — no per-speaker labels';
    case 'empty':
      return 'No transcript to score yet';
  }
}
