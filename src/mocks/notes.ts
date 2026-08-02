import type { Note, NoteListItem, TranscriptUtterance } from '../api/types';

// Only used when VITE_USE_MOCK_DATA=true (see src/api/granola.ts). Never a
// fallback for a failed real request.

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
    confidence: 0.94,
  };
}

// iOS note: diarization_label present, so speakerStats produces a full
// 3-person breakdown. Timings are engineered so each award category has an
// unambiguous, non-tied winner: Bob's single long turn wins Longest
// Monologue, Carol talks the most and the fastest, and Alice — despite
// having the least total floor time — interjects enough to win Most
// Interruptions too.
const iosStandupTranscript: TranscriptUtterance[] = [
  utterance('alice', 'microphone', 0, 5, "Morning everyone, thanks so much for joining today's call."),
  utterance('bob', 'speaker', 5, 10, 'Morning, happy to be here and ready to dig in.'),
  utterance('carol', 'speaker', 10, 15, "Hey both, let's get started then."),
  utterance('alice', 'microphone', 14, 16, 'Right, yeah.'),
  utterance(
    'bob',
    'speaker',
    16,
    196,
    "Okay so let me walk everyone through where the roadmap stands right now, because there's been a lot of movement since the last sync and I want to make sure we're all looking at the same picture before we get into the numbers. So starting from the top, the migration work on the ingestion pipeline finished up last week, which means we're no longer writing to the old queue at all, everything is flowing through the new event bus, and honestly the latency numbers already look a lot better than I expected, we're seeing something like a forty percent drop in end to end processing time on the busiest days. That was the big blocker for the reporting team, so I think we can tell them to go ahead and start building against the new schema whenever they're ready. Separately, on the client side, the redesign of the onboarding flow is basically done, there are a couple of small polish items left, mostly around error states when someone types in a bad email or the verification code expires, but functionally it's there and we've already started routing a small percentage of new signups through it to watch for regressions. Early numbers are encouraging, completion rate is up a few points compared to the old flow, though it's still a small sample so I don't want to overstate it yet. On the infrastructure side we finally moved the staging environment onto the new cluster, which took longer than planned because of some networking issues with the load balancer configuration, but that's sorted now and staging should behave a lot more like production going forward, which should cut down on the surprises we've been seeing during release week. I also want to flag that we're going to need another engineer on the platform team sometime in the next quarter if we want to keep this pace, the on call load has been creeping up and a couple of people are starting to feel it. Last thing from me, the vendor contract renewal is due at the end of the month, procurement is already looped in, and I don't think there's anything blocking on our side, but I wanted to mention it in case anyone has last minute feedback on the terms before it gets signed off."
  ),
  utterance('carol', 'speaker', 196, 196.5, 'Mm-hmm.'),
  utterance('alice', 'microphone', 196.3, 197, 'Sure, sure.'),
  utterance(
    'carol',
    'speaker',
    197,
    257,
    "Yeah so if we look at the churn numbers from last quarter there's actually a pretty clear pattern forming once you split it out by plan tier, the enterprise accounts are basically flat, churn there is under two percent and mostly explained by known acquisitions or leadership changes on their side, nothing we could have really prevented. Where it gets more interesting is the mid market tier, that's where most of the movement is, and when we dug into the exit surveys the biggest theme by far was time to value, people aren't churning because the product doesn't work, they're churning before they ever really get to the point where it clicks for them, which points pretty squarely at onboarding rather than the core feature set. I pulled a sample of about forty of those accounts and read through the support tickets myself, and the same handful of setup steps kept tripping people up over and over, which honestly feels like a solvable problem if we prioritize it, rather than something structural about who we're selling to."
  ),
  utterance('bob', 'speaker', 257, 260, 'Got it.'),
  utterance(
    'carol',
    'speaker',
    260,
    350,
    "On the expansion side, though, the story is honestly a lot more encouraging, and I think it's worth spending real time on because it's been growing every quarter this year without us really pushing on it directly. Net revenue retention across the base is sitting well above where we modeled it back at the start of the year, and almost all of that lift is coming from seat expansion inside accounts that are already six months or older, which tells me the product is landing well once teams actually get past that early onboarding period we were just talking about. The other thing worth calling out is that the accounts expanding fastest are disproportionately the ones that adopted the reporting features early, so there does seem to be a real correlation between getting people into that part of the product and them sticking around and growing their usage over time. I'd love for us to think about whether there's a way to nudge more accounts toward that path earlier in their lifecycle instead of leaving it to chance, because right now it feels like we're benefiting from it without really having designed for it, and if we could make that intentional I think the expansion number could climb even further than where it already is. There's also a smaller pattern worth flagging around multi seat accounts that add a second workspace, those accounts expand roughly twice as fast as everyone else in the first year, and right now nobody on the team owns nudging people toward that specific behavior, so that might be worth picking up next quarter as its own small project."
  ),
  utterance('alice', 'microphone', 349, 351, 'Yeah totally.'),
  utterance(
    'carol',
    'speaker',
    351,
    410,
    "Right, and to wrap that thread up, the one thing I'd flag before we move off this is that we should probably line up the churn work and the expansion work under the same initiative instead of treating them as two separate projects, because they're really pointing at the same root cause, which is that the first couple of months of an account's life is where almost everything gets decided, and right now we don't have a single team clearly owning that window end to end. If we fixed that ownership gap I think both numbers move together, and honestly that feels like a bigger lever than most of the individual feature bets we've been debating."
  ),
  utterance('bob', 'speaker', 410, 413, 'Great, thanks Carol.'),
  utterance('alice', 'microphone', 413, 414, 'Thanks.'),
];

const macosOneOnOneTranscript: TranscriptUtterance[] = [
  utterance(undefined, 'microphone', 0, 4, "Hey, thanks for jumping on today, I know it's a bit late your side."),
  utterance(undefined, 'speaker', 4, 30, 'No worries at all, happy to make it work, what did you want to cover?'),
  utterance(undefined, 'microphone', 30, 33, 'Mainly just wanted to run through the proposal timeline.'),
  utterance(
    undefined,
    'speaker',
    32,
    70,
    "Sure, so from our side the earliest we could realistically start is the middle of next month, mostly because we're waiting on budget sign off, but once that clears we could move fast since the scope is already pretty well defined."
  ),
  utterance(undefined, 'microphone', 70, 74, 'That makes sense, yeah.'),
  utterance(
    undefined,
    'speaker',
    74,
    140,
    "The other thing worth mentioning is that we'd want a short discovery phase before the main build starts, just a couple of weeks, mainly to confirm the integration points on our end, since a few of our internal systems changed since we last scoped this together and I want to make sure nothing's assumed that's no longer true."
  ),
  utterance(undefined, 'microphone', 139, 143, 'Right, right, agreed.'),
  utterance(
    undefined,
    'speaker',
    143,
    170,
    "Great, I'll send over a revised timeline by end of week so you've got something concrete to share internally before the budget conversation."
  ),
  utterance(undefined, 'microphone', 170, 175, "Perfect, let's lock that in then, thanks so much."),
];

export const mockIosStandupNote: Note = {
  id: 'note-ios-standup',
  title: 'Weekly Standup',
  created_at: '2026-07-21T09:00:00.000Z',
  updated_at: '2026-07-21T09:07:00.000Z',
  attendees: [{ name: 'Alice Smith' }, { name: 'Bob Jones' }, { name: 'Carol Diaz' }],
  summary: {
    markdown:
      '## Weekly Standup\n\nRoadmap update from Bob, churn and expansion review from Carol.',
  },
  transcript: iosStandupTranscript,
};

export const mockMacosOneOnOneNote: Note = {
  id: 'note-macos-1on1',
  title: 'Vendor Proposal Call',
  created_at: '2026-07-22T14:00:00.000Z',
  updated_at: '2026-07-22T14:03:00.000Z',
  attendees: [{ name: 'You' }, { name: 'Jordan Lee' }, { name: 'Priya Nair' }],
  summary: {
    markdown: '## Vendor Proposal Call\n\nTimeline discussion for the upcoming proposal.',
  },
  transcript: macosOneOnOneTranscript,
};

export const mockEmptyTranscriptNote: Note = {
  id: 'note-empty-transcript',
  title: 'Quick Sync (no audio captured)',
  created_at: '2026-07-23T11:00:00.000Z',
  updated_at: '2026-07-23T11:01:00.000Z',
  attendees: [{ name: 'You' }],
  summary: null,
  transcript: [],
};

const MOCK_NOTES: Note[] = [mockIosStandupNote, mockMacosOneOnOneNote, mockEmptyTranscriptNote];

/** Extra list rows so Storybook / mock mode can exercise the browse-all page. */
const MOCK_LIST_ONLY: NoteListItem[] = [
  {
    id: 'note-list-design-review',
    title: 'Design review',
    created_at: '2026-07-20T15:00:00.000Z',
    updated_at: '2026-07-20T15:30:00.000Z',
    attendees: [{ name: 'Sam Ortiz' }, { name: 'Priya Nair' }],
  },
  {
    id: 'note-list-customer-call',
    title: 'Customer call — Northwind',
    created_at: '2026-07-19T10:00:00.000Z',
    updated_at: '2026-07-19T10:45:00.000Z',
    attendees: [{ name: 'You' }, { name: 'Alex Chen' }],
  },
  {
    id: 'note-list-hiring',
    title: 'Hiring sync',
    created_at: '2026-07-18T13:00:00.000Z',
    updated_at: '2026-07-18T13:20:00.000Z',
    attendees: [{ name: 'Jordan Lee' }],
  },
];

export function mockNoteList(): NoteListItem[] {
  const fromNotes = MOCK_NOTES.map(({ id, title, created_at, updated_at, attendees }) => ({
    id,
    title,
    created_at,
    updated_at,
    attendees,
  }));
  return [...fromNotes, ...MOCK_LIST_ONLY];
}

export function getMockNote(id: string): Note | null {
  return MOCK_NOTES.find((note) => note.id === id) ?? null;
}
