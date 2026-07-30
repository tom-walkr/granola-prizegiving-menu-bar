import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AwardCard from './AwardCard.vue';

const meta: Meta<typeof AwardCard> = {
  component: AwardCard,
  title: 'Components/AwardCard',
};

export default meta;

type Story = StoryObj<typeof AwardCard>;

// AwardCard is a plain props-in component with no async state of its own, so
// "loading" / "not ready" / "empty" here are just representative placeholder
// content rather than states the component manages itself.
export const Loading: Story = {
  args: { title: 'Chatterbox', winnerName: '—', value: '…' },
};

export const NoteNotReady: Story = {
  args: { title: 'Chatterbox', winnerName: '—', value: 'Not ready yet' },
};

export const EmptyTranscript: Story = {
  args: { title: 'Chatterbox', winnerName: '—', value: 'No data' },
};

export const LongestMonologue: Story = {
  args: { title: 'Longest Monologue', winnerName: 'Bob Jones', value: '3m 0s' },
};

export const QuietestMouse: Story = {
  args: { title: 'Quietest Mouse', winnerName: 'Alice Smith', value: '11s' },
};

export const Chatterbox: Story = {
  args: { title: 'Chatterbox', winnerName: 'Carol Diaz', value: '3m 35s' },
};

export const FastestTalker: Story = {
  args: { title: 'Fastest Talker', winnerName: 'Carol Diaz', value: '160 wpm' },
};

export const MostInterruptions: Story = {
  args: { title: 'Most Interruptions (approx.)', winnerName: 'Alice Smith', value: '3' },
};
