import { describe, expect, it } from 'vitest';
import { mockIosStandupNote, mockMacosOneOnOneNote } from '../../mocks/notes';
import { computeAwards } from '../awards';
import { formatAwardsForSlack } from '../slackSummary';
import { computeSpeakerStats } from '../speakerStats';

describe('formatAwardsForSlack', () => {
  it('formats a full prizegiving as Slack mrkdwn with ceremony flair', () => {
    const stats = computeSpeakerStats(
      mockIosStandupNote.transcript ?? [],
      mockIosStandupNote.attendees
    );
    const result = computeAwards(stats);
    const text = formatAwardsForSlack(
      { title: mockIosStandupNote.title, createdAt: mockIosStandupNote.created_at },
      result
    );

    expect(text).toContain(':trophy: *Granola Prizegiving*');
    expect(text).toContain('*Weekly Standup*');
    expect(text).toContain('_And the winners are…_');
    expect(text).toContain(':speaking_head_in_silhouette: *Longest Monologue*');
    expect(text).toContain('*Bob Jones*');
    expect(text).toContain(':mouse2: *Quietest Mouse*');
    expect(text).toContain('*Alice Smith*');
    expect(text).toContain(':mega: *Chatterbox*');
    expect(text).toContain('*Carol Diaz*');
    expect(text).toContain(':zap: *Fastest Talker*');
    expect(text).toContain(':raised_hand_with_fingers_splayed: *Most Interruptions (approx.)*');
    expect(text).toContain('_Copied from Granola Prizegiving_');
  });

  it('formats a two-way comparison without inventing five awards', () => {
    const stats = computeSpeakerStats(mockMacosOneOnOneNote.transcript ?? []);
    const result = computeAwards(stats);
    const text = formatAwardsForSlack(
      { title: mockMacosOneOnOneNote.title, createdAt: mockMacosOneOnOneNote.created_at },
      result
    );

    expect(text).toContain('*Vendor Proposal Call*');
    expect(text).toContain(':scales: *Talk-time check*');
    expect(text).toContain('You talked less than the rest of the call');
    expect(text).not.toContain('And the winners are');
    expect(text).not.toContain('Longest Monologue');
  });

  it('escapes Slack-sensitive characters in meeting titles and names', () => {
    const text = formatAwardsForSlack(
      { title: 'A & B <sync>', createdAt: '2026-07-21T09:00:00.000Z' },
      {
        mode: 'full',
        awards: [
          {
            id: 'chatterbox',
            title: 'Chatterbox',
            winnerName: 'Tom <Boss>',
            value: '1m 0s',
          },
        ],
      }
    );

    expect(text).toContain('*A &amp; B &lt;sync&gt;*');
    expect(text).toContain('*Tom &lt;Boss&gt;*');
  });
});
