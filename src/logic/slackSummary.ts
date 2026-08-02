import type { AwardId, AwardsResult } from './awards';
import { formatMeetingDate, formatMeetingTime } from './meetingDisplay';
import { formatTalkDuration } from './wordShare';

export interface SlackSummaryMeeting {
  title: string;
  createdAt: string;
}

/** Slack emoji shortcodes per award — render as native emoji in Slack. */
const AWARD_EMOJI: Record<AwardId, string> = {
  'longest-monologue': ':speaking_head_in_silhouette:',
  'quietest-mouse': ':mouse2:',
  chatterbox: ':mega:',
  'fastest-talker': ':zap:',
  'most-interruptions': ':raised_hand_with_fingers_splayed:',
};

const AWARD_TAGLINES: Record<AwardId, (value: string) => string> = {
  'longest-monologue': (value) => `\`${value}\` of uninterrupted glory`,
  'quietest-mouse': (value) => `just \`${value}\` on the clock`,
  chatterbox: (value) => `\`${value}\` of floor time`,
  'fastest-talker': (value) => `\`${value}\` — words flying`,
  'most-interruptions': (value) => `\`${value}\` overlaps (approx.)`,
};

/**
 * Build a Slack-mrkdwn summary of a meeting's prizegiving results,
 * ready to paste into a channel.
 */
export function formatAwardsForSlack(
  meeting: SlackSummaryMeeting,
  result: AwardsResult
): string {
  const when = `${formatMeetingDate(meeting.createdAt)} · ${formatMeetingTime(meeting.createdAt)}`;
  const header = [
    ':trophy: *Granola Prizegiving*',
    `*${escapeMrkdwn(meeting.title)}*`,
    `_${when}_`,
  ].join('\n');

  if (result.mode === 'two-way') {
    return [
      header,
      '',
      ':scales: *Talk-time check*',
      `_${escapeMrkdwn(result.label)}_`,
      '',
      `*${escapeMrkdwn(result.you.displayName)}*  \`${formatTalkDuration(result.you.totalDurationSeconds)}\``,
      `*${escapeMrkdwn(result.restOfCall.displayName)}*  \`${formatTalkDuration(result.restOfCall.totalDurationSeconds)}\``,
      '',
      footer(),
    ].join('\n');
  }

  const ceremony = result.awards.map((award) => {
    const emoji = AWARD_EMOJI[award.id];
    const tagline = AWARD_TAGLINES[award.id](award.value);
    return [
      `${emoji} *${escapeMrkdwn(award.title)}*`,
      `*${escapeMrkdwn(award.winnerName)}* — ${tagline}`,
    ].join('\n');
  });

  return [
    header,
    '',
    '_And the winners are…_',
    '',
    ceremony.join('\n\n'),
    '',
    footer(),
  ].join('\n');
}

function footer(): string {
  return '_Copied from Granola Prizegiving_';
}

/** Escape Slack mrkdwn special chars in user-controlled strings. */
function escapeMrkdwn(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
