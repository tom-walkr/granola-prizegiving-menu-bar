import type { SpeakerProfile, SpeakerStats } from './speakerStats';

export type AwardId =
  | 'longest-monologue'
  | 'quietest-mouse'
  | 'chatterbox'
  | 'fastest-talker'
  | 'most-interruptions';

export interface AwardDefinition {
  id: AwardId;
  title: string;
  /** True for awards that only feel like a real "prize" with 3+ named speakers. */
  requiresFullBreakdown: boolean;
  pickWinner: (speakers: SpeakerProfile[]) => SpeakerProfile | undefined;
  formatValue: (speaker: SpeakerProfile) => string;
}

export interface AwardResult {
  id: AwardId;
  title: string;
  winnerName: string;
  value: string;
}

export interface FullAwardsResult {
  mode: 'full';
  awards: AwardResult[];
}

export interface TwoWayComparisonResult {
  mode: 'two-way';
  label: string;
  you: { displayName: string; totalDurationSeconds: number };
  restOfCall: { displayName: string; totalDurationSeconds: number };
}

export type AwardsResult = FullAwardsResult | TwoWayComparisonResult;

function maxBy(
  speakers: SpeakerProfile[],
  selector: (speaker: SpeakerProfile) => number
): SpeakerProfile | undefined {
  return speakers.reduce<SpeakerProfile | undefined>(
    (best, current) => (!best || selector(current) > selector(best) ? current : best),
    undefined
  );
}

function minBy(
  speakers: SpeakerProfile[],
  selector: (speaker: SpeakerProfile) => number
): SpeakerProfile | undefined {
  return speakers.reduce<SpeakerProfile | undefined>(
    (best, current) => (!best || selector(current) < selector(best) ? current : best),
    undefined
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

export const AWARD_DEFINITIONS: AwardDefinition[] = [
  {
    id: 'longest-monologue',
    title: 'Longest Monologue',
    requiresFullBreakdown: true,
    pickWinner: (speakers) =>
      maxBy(
        speakers.filter((speaker) => speaker.longestUtterance),
        (speaker) => speaker.longestUtterance?.durationSeconds ?? 0
      ),
    formatValue: (speaker) =>
      speaker.longestUtterance ? formatDuration(speaker.longestUtterance.durationSeconds) : '—',
  },
  {
    id: 'quietest-mouse',
    title: 'Quietest Mouse',
    requiresFullBreakdown: true,
    pickWinner: (speakers) => minBy(speakers, (speaker) => speaker.totalDurationSeconds),
    formatValue: (speaker) => formatDuration(speaker.totalDurationSeconds),
  },
  {
    id: 'chatterbox',
    title: 'Chatterbox',
    requiresFullBreakdown: false,
    pickWinner: (speakers) => maxBy(speakers, (speaker) => speaker.totalDurationSeconds),
    formatValue: (speaker) => formatDuration(speaker.totalDurationSeconds),
  },
  {
    id: 'fastest-talker',
    title: 'Fastest Talker',
    requiresFullBreakdown: false,
    pickWinner: (speakers) => maxBy(speakers, (speaker) => speaker.wordsPerMinute),
    formatValue: (speaker) => `${Math.round(speaker.wordsPerMinute)} wpm`,
  },
  {
    id: 'most-interruptions',
    title: 'Most Interruptions (approx.)',
    requiresFullBreakdown: false,
    pickWinner: (speakers) => maxBy(speakers, (speaker) => speaker.overlapCount),
    formatValue: (speaker) => `${speaker.overlapCount}`,
  },
];

function computeTwoWayComparison(
  you: SpeakerProfile,
  restOfCall: SpeakerProfile
): TwoWayComparisonResult {
  let label: string;
  if (you.totalDurationSeconds === restOfCall.totalDurationSeconds) {
    label = 'You talked about the same amount as the rest of the call';
  } else if (you.totalDurationSeconds > restOfCall.totalDurationSeconds) {
    label = 'You talked more than the rest of the call';
  } else {
    label = 'You talked less than the rest of the call';
  }

  return {
    mode: 'two-way',
    label,
    you: { displayName: you.displayName, totalDurationSeconds: you.totalDurationSeconds },
    restOfCall: { displayName: restOfCall.displayName, totalDurationSeconds: restOfCall.totalDurationSeconds },
  };
}

/**
 * Full breakdowns get all five award categories. Two-way data only supports
 * one honest comparison, not a five-category prizegiving, so it collapses to
 * a single labeled result instead of running the award definitions above.
 */
export function computeAwards(stats: SpeakerStats): AwardsResult {
  if (stats.mode === 'two-way') {
    return computeTwoWayComparison(stats.you, stats.restOfCall);
  }

  const awards = AWARD_DEFINITIONS.reduce<AwardResult[]>((results, definition) => {
    const winner = definition.pickWinner(stats.speakers);
    if (!winner) return results;
    results.push({
      id: definition.id,
      title: definition.title,
      winnerName: winner.displayName,
      value: definition.formatValue(winner),
    });
    return results;
  }, []);

  return { mode: 'full', awards };
}
