import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MeetingAvatar from './MeetingAvatar.vue';

const meta: Meta<typeof MeetingAvatar> = {
  component: MeetingAvatar,
  title: 'Design System/MeetingAvatar',
  args: {
    initials: 'GP',
    shared: false,
  },
};

export default meta;

type Story = StoryObj<typeof MeetingAvatar>;

export const Initials: Story = {};

export const Shared: Story = {
  args: { initials: 'BR', shared: true },
};
