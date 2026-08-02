import { describe, expect, it } from 'vitest';
import type { TranscriptUtterance } from '../../api/types';
import { mockIosStandupNote, mockMacosOneOnOneNote } from '../../mocks/notes';
import { computeSpeakerStats } from '../speakerStats';

function utterance(
  label: string | undefined,
  source: 'microphone' | 'speaker',
  start: number,
  end: number,
  text: string
): TranscriptUtterance {
  return {
    speaker: { source, diarization_label: label },
    text,
    start_timestamp: start,
    end_timestamp: end,
    confidence: 0.9,
  };
}

describe('computeSpeakerStats', () => {
  it('handles a single speaker with no diarization labels as a two-way split', () => {
    const utterances = [
      utterance(undefined, 'microphone', 0, 10, 'Just talking to myself here.'),
      utterance(undefined, 'microphone', 10, 20, 'Recording a quick memo.'),
    ];

    const stats = computeSpeakerStats(utterances);

    expect(stats.mode).toBe('two-way');
    if (stats.mode !== 'two-way') throw new Error('unreachable');
    expect(stats.you.totalDurationSeconds).toBe(20);
    expect(stats.restOfCall.totalDurationSeconds).toBe(0);
    expect(stats.restOfCall.wordsPerMinute).toBe(0);
  });

  it('produces a full per-speaker breakdown for an iOS note with 6 labeled speakers', () => {
    const stats = computeSpeakerStats(mockIosStandupNote.transcript ?? [], mockIosStandupNote.attendees);

    expect(stats.mode).toBe('full');
    if (stats.mode !== 'full') throw new Error('unreachable');
    expect(stats.speakers).toHaveLength(6);

    const names = stats.speakers.map((speaker) => speaker.displayName).sort();
    expect(names).toEqual([
      'Alice Smith',
      'Bob Jones',
      'Carol Diaz',
      'Dana Okonkwo',
      'Eve Chen',
      'Frank Müller',
    ]);

    const bob = stats.speakers.find((speaker) => speaker.displayName === 'Bob Jones');
    expect(bob?.longestUtterance?.durationSeconds).toBe(180);

    const alice = stats.speakers.find((speaker) => speaker.displayName === 'Alice Smith');
    expect(alice?.overlapCount).toBeGreaterThan(0);
  });

  it('produces a two-way split for a macOS note with only microphone/speaker sources', () => {
    const stats = computeSpeakerStats(mockMacosOneOnOneNote.transcript ?? []);

    expect(stats.mode).toBe('two-way');
    if (stats.mode !== 'two-way') throw new Error('unreachable');
    expect(stats.you.totalDurationSeconds).toBeGreaterThan(0);
    expect(stats.restOfCall.totalDurationSeconds).toBeGreaterThan(stats.you.totalDurationSeconds);
  });

  it('handles a note with zero transcript entries without crashing', () => {
    const stats = computeSpeakerStats([]);

    expect(stats.mode).toBe('two-way');
    if (stats.mode !== 'two-way') throw new Error('unreachable');
    expect(stats.you.utteranceCount).toBe(0);
    expect(stats.you.wordsPerMinute).toBe(0);
    expect(stats.you.longestUtterance).toBeNull();
    expect(stats.restOfCall.utteranceCount).toBe(0);
  });

  it('estimates duration from words when start and end timestamps are equal', () => {
    const text =
      'This is a long voice memo where Granola stamped the same start and end time on the utterance.';
    const stats = computeSpeakerStats([
      utterance('Speaker A', 'microphone', 0, 0, text),
    ]);

    expect(stats.mode).toBe('full');
    if (stats.mode !== 'full') throw new Error('unreachable');
    expect(stats.speakers[0].wordCount).toBeGreaterThan(0);
    expect(stats.speakers[0].totalDurationSeconds).toBeGreaterThan(0);
    expect(stats.speakers[0].wordsPerMinute).toBeCloseTo(150, 0);
  });

  it('counts an overlapping utterance as an interruption for the interrupting speaker', () => {
    const utterances = [
      utterance('alice', 'microphone', 0, 10, 'Talking about the roadmap for a while now.'),
      // Bob starts before Alice's utterance ends.
      utterance('bob', 'speaker', 8, 12, 'Sorry, quick point.'),
      utterance('alice', 'microphone', 12, 20, 'As I was saying.'),
    ];

    const stats = computeSpeakerStats(utterances, [{ name: 'Alice' }, { name: 'Bob' }]);

    expect(stats.mode).toBe('full');
    if (stats.mode !== 'full') throw new Error('unreachable');
    const bob = stats.speakers.find((speaker) => speaker.displayName === 'Bob');
    const alice = stats.speakers.find((speaker) => speaker.displayName === 'Alice');
    expect(bob?.overlapCount).toBe(1);
    expect(alice?.overlapCount).toBe(0);
  });
});
