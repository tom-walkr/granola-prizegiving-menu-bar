import { describe, expect, it } from 'vitest';
import { mockIosStandupNote, mockMacosOneOnOneNote } from '../../mocks/notes';
import { computeAwards } from '../awards';
import { formatAwardsForSlack, formatAwardsPlain } from '../slackSummary';
import { computeSpeakerStats } from '../speakerStats';

describe('formatAwardsPlain', () => {
  it('formats a full prizegiving without markup markers', () => {
    const stats = computeSpeakerStats(
      mockIosStandupNote.transcript ?? [],
      mockIosStandupNote.attendees
    );
    const result = computeAwards(stats);
    const text = formatAwardsPlain(
      { title: mockIosStandupNote.title, createdAt: mockIosStandupNote.created_at },
      result
    );

    expect(text).toContain('🏆 Granola Prizegiving');
    expect(text).toContain('Weekly Standup');
    expect(text).toContain('And the winners are…');
    expect(text).toContain('🗣️ Longest Monologue');
    expect(text).toContain('Bob Jones');
    expect(text).toContain('🐁 Quietest Mouse');
    expect(text).toContain('Alice Smith');
    expect(text).toContain('📣 Chatterbox');
    expect(text).toContain('Carol Diaz');
    expect(text).toContain('⚡ Fastest Talker');
    expect(text).toContain('🖐️ Most Interruptions (approx.)');
    expect(text).toContain('Copied from Granola Prizegiving');
    expect(text).not.toMatch(/[*_`]/);
    expect(text).not.toContain('<b>');
  });
});

describe('formatAwardsForSlack', () => {
  it('returns plain text plus HTML rich text for clipboard paste', () => {
    const stats = computeSpeakerStats(
      mockIosStandupNote.transcript ?? [],
      mockIosStandupNote.attendees
    );
    const result = computeAwards(stats);
    const { plain, html } = formatAwardsForSlack(
      { title: mockIosStandupNote.title, createdAt: mockIosStandupNote.created_at },
      result
    );

    expect(plain).toContain('🏆 Granola Prizegiving');
    expect(plain).not.toMatch(/[*_`]/);

    expect(html).toContain('<b>Granola Prizegiving</b>');
    expect(html).toContain('<b>Weekly Standup</b>');
    expect(html).toContain('<i>And the winners are…</i>');
    expect(html).toContain('🗣️ <b>Longest Monologue</b>');
    expect(html).toContain('<b>Bob Jones</b>');
    expect(html).toContain('🐁 <b>Quietest Mouse</b>');
    expect(html).toContain('<b>Alice Smith</b>');
    expect(html).toContain('📣 <b>Chatterbox</b>');
    expect(html).toContain('<b>Carol Diaz</b>');
    expect(html).toContain('⚡ <b>Fastest Talker</b>');
    expect(html).toContain('🖐️ <b>Most Interruptions (approx.)</b>');
    expect(html).toContain('<code>');
    expect(html).toContain('<i>Copied from Granola Prizegiving</i>');
  });

  it('formats a two-way comparison without inventing five awards', () => {
    const stats = computeSpeakerStats(mockMacosOneOnOneNote.transcript ?? []);
    const result = computeAwards(stats);
    const { plain, html } = formatAwardsForSlack(
      { title: mockMacosOneOnOneNote.title, createdAt: mockMacosOneOnOneNote.created_at },
      result
    );

    expect(plain).toContain('Vendor Proposal Call');
    expect(plain).toContain('Talk-time check');
    expect(plain).toContain('You talked less than the rest of the call');
    expect(plain).not.toContain('And the winners are');
    expect(plain).not.toContain('Longest Monologue');

    expect(html).toContain('<b>Vendor Proposal Call</b>');
    expect(html).toContain('⚖️ <b>Talk-time check</b>');
    expect(html).not.toContain('And the winners are');
  });

  it('escapes HTML-sensitive characters in meeting titles and names', () => {
    const { html, plain } = formatAwardsForSlack(
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

    expect(html).toContain('<b>A &amp; B &lt;sync&gt;</b>');
    expect(html).toContain('<b>Tom &lt;Boss&gt;</b>');
    expect(plain).toContain('A & B <sync>');
    expect(plain).toContain('Tom <Boss>');
  });
});
