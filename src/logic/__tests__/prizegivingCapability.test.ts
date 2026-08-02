import { describe, expect, it } from 'vitest';
import type { TranscriptUtterance } from '../../api/types';
import { classifyPrizegivingCapability } from '../prizegivingCapability';

function utterance(
  label: string | undefined,
  source: 'microphone' | 'speaker' = 'microphone'
): TranscriptUtterance {
  return {
    speaker: { source, diarization_label: label },
    text: 'hi',
    start_timestamp: 0,
    end_timestamp: 1,
    confidence: 1,
  };
}

describe('classifyPrizegivingCapability', () => {
  it('returns empty for missing or blank transcripts', () => {
    expect(classifyPrizegivingCapability(undefined)).toBe('empty');
    expect(classifyPrizegivingCapability([])).toBe('empty');
  });

  it('returns full when any utterance is diarized', () => {
    expect(
      classifyPrizegivingCapability([
        utterance(undefined, 'microphone'),
        utterance('Speaker A', 'speaker'),
      ])
    ).toBe('full');
  });

  it('returns two-way for microphone/speaker-only transcripts', () => {
    expect(
      classifyPrizegivingCapability([
        utterance(undefined, 'microphone'),
        utterance(undefined, 'speaker'),
      ])
    ).toBe('two-way');
  });
});
