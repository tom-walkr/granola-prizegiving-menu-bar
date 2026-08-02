import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MeetingEntry from './MeetingEntry.vue';

const meta: Meta<typeof MeetingEntry> = {
  component: MeetingEntry,
  title: 'Design System/MeetingEntry',
  args: {
    title: 'GCP partnership internal discussion',
    subtitle: 'Douglas, Damjan & 2 others',
    time: '16:00',
    initials: 'GP',
    shared: true,
    selected: false,
  },
  decorators: [
    () => ({
      template: '<div style="max-width: 420px; padding: 12px;"><story /></div>',
    }),
  ],
};

export default meta;

type Story = StoryObj<typeof MeetingEntry>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    title: 'Broshir',
    subtitle: 'Douglas Brion',
    time: '15:30',
    initials: 'BR',
    shared: true,
    selected: true,
  },
};

export const Solo: Story = {
  args: {
    title: 'Quick Sync (no audio captured)',
    subtitle: 'You',
    time: '11:00',
    initials: 'QS',
    shared: false,
  },
};

export const LongTitle: Story = {
  args: {
    title: 'Q3 planning — platform, growth, and enterprise expansion deep dive',
    subtitle: 'Alice, Bob & 5 others',
    time: '09:00',
    initials: 'QP',
    shared: true,
  },
};
