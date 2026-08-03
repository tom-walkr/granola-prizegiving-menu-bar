import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WordShareChart from './WordShareChart.vue';

const meta: Meta<typeof WordShareChart> = {
  component: WordShareChart,
  title: 'Design System/WordShareChart',
  decorators: [
    () => ({
      template: '<div style="max-width: 360px; padding: 12px;"><story /></div>',
    }),
  ],
};

export default meta;

type Story = StoryObj<typeof WordShareChart>;

export const ThreeSpeakers: Story = {
  args: {
    entries: [
      { key: 'carol', name: 'Carol Diaz', words: 612, seconds: 420, wordShare: 0.52, timeShare: 0.48 },
      { key: 'bob', name: 'Bob Jones', words: 428, seconds: 310, wordShare: 0.36, timeShare: 0.35 },
      { key: 'alice', name: 'Alice Smith', words: 140, seconds: 150, wordShare: 0.12, timeShare: 0.17 },
    ],
  },
};

export const TwoWay: Story = {
  args: {
    entries: [
      {
        key: 'rest-of-call',
        name: 'Rest of call',
        words: 180,
        seconds: 240,
        wordShare: 0.72,
        timeShare: 0.67,
      },
      { key: 'you', name: 'You', words: 70, seconds: 120, wordShare: 0.28, timeShare: 0.33 },
    ],
  },
};

export const AnonymousLabels: Story = {
  args: {
    entries: [
      { key: 'Speaker A', name: 'Speaker A', words: 220, seconds: 180, wordShare: 0.44, timeShare: 0.45 },
      { key: 'Speaker B', name: 'Speaker B', words: 180, seconds: 140, wordShare: 0.36, timeShare: 0.35 },
      { key: 'Speaker C', name: 'Speaker C', words: 100, seconds: 80, wordShare: 0.2, timeShare: 0.2 },
    ],
  },
};
