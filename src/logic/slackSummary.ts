import type { AwardId, AwardsResult } from './awards';
import { formatMeetingDate, formatMeetingTime } from './meetingDisplay';
import { formatTalkDuration } from './wordShare';

export interface SlackSummaryMeeting {
  title: string;
  createdAt: string;
}

export interface SlackClipboardPayload {
  /** Unformatted text for apps that only read text/plain. */
  plain: string;
  /** Rich HTML — Slack (and similar) pick this up on paste. */
  html: string;
}

/** Unicode emoji per award — render natively when pasted into Slack. */
const AWARD_EMOJI: Record<AwardId, string> = {
  'longest-monologue': '🗣️',
  'quietest-mouse': '🐁',
  chatterbox: '📣',
  'fastest-talker': '⚡',
  'most-interruptions': '🖐️',
};

const AWARD_TAGLINES: Record<AwardId, (value: string) => string> = {
  'longest-monologue': (value) => `${value} of uninterrupted glory`,
  'quietest-mouse': (value) => `just ${value} on the clock`,
  chatterbox: (value) => `${value} of floor time`,
  'fastest-talker': (value) => `${value} — words flying`,
  'most-interruptions': (value) => `${value} overlaps (approx.)`,
};

/**
 * Plain-text prizegiving summary — no markdown/mrkdwn markers.
 */
export function formatAwardsPlain(
  meeting: SlackSummaryMeeting,
  result: AwardsResult
): string {
  return buildSummary(meeting, result, {
    bold: (text) => text,
    italic: (text) => text,
    code: (text) => text,
    lineBreak: '\n',
  });
}

/**
 * Rich clipboard payload for Slack paste.
 * Slack ignores *mrkdwn* in plain paste; it applies formatting from text/html.
 */
export function formatAwardsForSlack(
  meeting: SlackSummaryMeeting,
  result: AwardsResult
): SlackClipboardPayload {
  const plain = formatAwardsPlain(meeting, result);
  const htmlBody = buildSummary(meeting, result, {
    bold: (text) => `<b>${text}</b>`,
    italic: (text) => `<i>${text}</i>`,
    code: (text) => `<code>${text}</code>`,
    lineBreak: '<br>',
    escapeText: escapeHtml,
  });

  return {
    plain,
    html: `<html><body>${htmlBody}</body></html>`,
  };
}

interface SummaryFormat {
  bold: (text: string) => string;
  italic: (text: string) => string;
  code: (text: string) => string;
  lineBreak: string;
  /** Escape user-controlled strings when emitting markup; identity for plain. */
  escapeText?: (text: string) => string;
}

function buildSummary(
  meeting: SlackSummaryMeeting,
  result: AwardsResult,
  fmt: SummaryFormat
): string {
  const escape = fmt.escapeText ?? ((text: string) => text);
  const when = `${formatMeetingDate(meeting.createdAt)} · ${formatMeetingTime(meeting.createdAt)}`;
  const br = fmt.lineBreak;
  const blank = `${br}${br}`;

  const header = [
    `🏆 ${fmt.bold('Granola Prizegiving')}`,
    fmt.bold(escape(meeting.title)),
    fmt.italic(escape(when)),
  ].join(br);

  if (result.mode === 'two-way') {
    return [
      header,
      `⚖️ ${fmt.bold('Talk-time check')}`,
      fmt.italic(escape(result.label)),
      `${fmt.bold(escape(result.you.displayName))}  ${fmt.code(escape(formatTalkDuration(result.you.totalDurationSeconds)))}`,
      `${fmt.bold(escape(result.restOfCall.displayName))}  ${fmt.code(escape(formatTalkDuration(result.restOfCall.totalDurationSeconds)))}`,
      fmt.italic('Copied from Granola Prizegiving'),
    ].join(blank);
  }

  const ceremony = result.awards
    .map((award) => {
      const emoji = AWARD_EMOJI[award.id];
      const tagline = AWARD_TAGLINES[award.id](fmt.code(escape(award.value)));
      return [
        `${emoji} ${fmt.bold(escape(award.title))}`,
        `${fmt.bold(escape(award.winnerName))} — ${tagline}`,
      ].join(br);
    })
    .join(blank);

  return [
    header,
    fmt.italic('And the winners are…'),
    ceremony,
    fmt.italic('Copied from Granola Prizegiving'),
  ].join(blank);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
