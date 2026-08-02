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
      { key: 'carol', name: 'Carol Diaz', words: 612, share: 0.52 },
      { key: 'bob', name: 'Bob Jones', words: 428, share: 0.36 },
      { key: 'alice', name: 'Alice Smith', words: 140, share: 0.12 },
    ],
  },
};

export const TwoWay: Story = {
  args: {
    entries: [
      { key: 'rest-of-call', name: 'Rest of call', words: 180, share: 0.72 },
      { key: 'you', name: 'You', words: 70, share: 0.28 },
    ],
  },
};
