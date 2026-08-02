import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AwardCard from './AwardCard.vue';

const meta: Meta<typeof AwardCard> = {
  component: AwardCard,
  title: 'Design System/AwardCard',
  decorators: [
    () => ({
      template: '<div style="max-width: 360px; padding: 12px;"><story /></div>',
    }),
  ],
};

export default meta;

type Story = StoryObj<typeof AwardCard>;

export const LongestMonologue: Story = {
  args: {
    awardId: 'longest-monologue',
    title: 'Longest Monologue',
    winnerName: 'Bob Jones',
    value: '3m 0s',
  },
};

export const QuietestMouse: Story = {
  args: {
    awardId: 'quietest-mouse',
    title: 'Quietest Mouse',
    winnerName: 'Alice Smith',
    value: '11s',
  },
};

export const Chatterbox: Story = {
  args: {
    awardId: 'chatterbox',
    title: 'Chatterbox',
    winnerName: 'Carol Diaz',
    value: '3m 35s',
  },
};

export const FastestTalker: Story = {
  args: {
    awardId: 'fastest-talker',
    title: 'Fastest Talker',
    winnerName: 'Carol Diaz',
    value: '160 wpm',
  },
};

export const MostInterruptions: Story = {
  args: {
    awardId: 'most-interruptions',
    title: 'Most Interruptions (approx.)',
    winnerName: 'Alice Smith',
    value: '3',
  },
};
