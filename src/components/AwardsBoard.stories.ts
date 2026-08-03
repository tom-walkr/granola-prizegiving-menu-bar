import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AwardsBoard from './AwardsBoard.vue';

const meta: Meta<typeof AwardsBoard> = {
  component: AwardsBoard,
  title: 'Design System/AwardsBoard',
  decorators: [
    () => ({
      template: '<div style="max-width: 360px; padding: 12px;"><story /></div>',
    }),
  ],
};

export default meta;

type Story = StoryObj<typeof AwardsBoard>;

export const Loaded: Story = {
  args: { noteId: 'note-ios-standup' },
};

export const LoadedTwoWay: Story = {
  args: { noteId: 'note-macos-1on1' },
};

export const AnonymousSpeakers: Story = {
  args: { noteId: 'note-anonymous-speakers' },
};

export const Loading: Story = {
  args: { noteId: 'note-ios-standup', forcedStatus: 'loading' },
};

// Passing an id that isn't in the mock fixtures reproduces the real 404 branch: getNote() resolves to null.
export const NoteNotReady: Story = {
  args: { noteId: 'note-still-processing' },
};

export const EmptyTranscript: Story = {
  args: { noteId: 'note-empty-transcript' },
};

export const Error: Story = {
  args: { noteId: 'note-ios-standup', forcedStatus: 'error' },
};
