import type { Meta, StoryObj } from '@storybook/vue3-vite';
import granolaLogo from '../assets/granola-pg-logo.svg';
import PopoverShell from './PopoverShell.vue';

// PopoverShell is layout-only, so these stories just vary the slot content to
// preview how each downstream state will sit inside the shell.
const header = `
  <div class="popover-shell__brand">
    <img class="popover-shell__logo" src="${granolaLogo}" alt="" width="22" height="22" />
    <h1>Granola Prizegiving</h1>
  </div>
`;

const meta: Meta<typeof PopoverShell> = {
  component: PopoverShell,
  title: 'Components/PopoverShell',
};

export default meta;

type Story = StoryObj<typeof PopoverShell>;

export const Loaded: Story = {
  render: () => ({
    components: { PopoverShell },
    template: `
      <PopoverShell>
        <template #header>${header}</template>
        <p>Mode: Full breakdown</p>
        <article><h3>Chatterbox</h3><p>Carol Diaz</p><p>3m 35s</p></article>
      </PopoverShell>
    `,
  }),
};

export const Loading: Story = {
  render: () => ({
    components: { PopoverShell },
    template: `
      <PopoverShell>
        <template #header>${header}</template>
        <p>Loading awards…</p>
      </PopoverShell>
    `,
  }),
};

export const NoteNotReady: Story = {
  render: () => ({
    components: { PopoverShell },
    template: `
      <PopoverShell>
        <template #header>${header}</template>
        <p>This note isn't ready yet — it may still be processing.</p>
      </PopoverShell>
    `,
  }),
};

export const EmptyTranscript: Story = {
  render: () => ({
    components: { PopoverShell },
    template: `
      <PopoverShell>
        <template #header>${header}</template>
        <p>No transcript is available for this note.</p>
      </PopoverShell>
    `,
  }),
};
