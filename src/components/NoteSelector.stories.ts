import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NoteSelector from './NoteSelector.vue';

const meta: Meta<typeof NoteSelector> = {
  component: NoteSelector,
  title: 'Components/NoteSelector',
};

export default meta;

type Story = StoryObj<typeof NoteSelector>;

// No forcedStatus: fetches for real (against the mock fixtures Storybook is wired to).
export const Loaded: Story = {};

export const Loading: Story = {
  args: { forcedStatus: 'loading' },
};

export const Empty: Story = {
  args: { forcedStatus: 'empty' },
};

export const Error: Story = {
  args: { forcedStatus: 'error' },
};
