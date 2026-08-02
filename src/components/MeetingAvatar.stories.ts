import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MeetingAvatar from './MeetingAvatar.vue';

const meta: Meta<typeof MeetingAvatar> = {
  component: MeetingAvatar,
  title: 'Design System/MeetingAvatar',
  args: {
    initials: 'GP',
    prizegiving: null,
  },
};

export default meta;

type Story = StoryObj<typeof MeetingAvatar>;

export const Initials: Story = {};

export const FullPrizegiving: Story = {
  args: { initials: 'WS', prizegiving: 'full' },
};

export const TwoWayOnly: Story = {
  args: { initials: 'VP', prizegiving: 'two-way' },
};
