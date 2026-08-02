import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import type { NoteListItem } from '../api/types';
import MeetingList from './MeetingList.vue';

/** Story fixtures shaped like Granola's note list screenshot. */
const granolaLikeNotes: NoteListItem[] = [
  {
    id: 'broshir',
    title: 'Broshir',
    created_at: '2026-06-19T15:30:00.000Z',
    updated_at: '2026-06-19T15:45:00.000Z',
    attendees: [{ name: 'Douglas Brion' }],
  },
  {
    id: 'gcp',
    title: 'GCP partnership internal discussion',
    created_at: '2026-06-19T16:00:00.000Z',
    updated_at: '2026-06-19T16:40:00.000Z',
    attendees: [
      { name: 'Douglas Brion' },
      { name: 'Damjan' },
      { name: 'Carol Diaz' },
      { name: 'Eve Park' },
    ],
  },
  {
    id: 'chris',
    title: 'Chris <> Tom',
    created_at: '2026-06-19T11:00:00.000Z',
    updated_at: '2026-06-19T11:25:00.000Z',
    attendees: [{ name: 'Chris' }, { name: 'Tom Walker' }],
  },
  {
    id: 'ai-chats',
    title: 'AI chats',
    created_at: '2026-06-18T16:00:00.000Z',
    updated_at: '2026-06-18T16:20:00.000Z',
    attendees: [{ name: 'You' }, { name: 'Jordan Lee' }],
  },
  {
    id: 'standup',
    title: 'Weekly Standup',
    created_at: '2026-06-18T09:00:00.000Z',
    updated_at: '2026-06-18T09:15:00.000Z',
    attendees: [
      { name: 'Alice Smith' },
      { name: 'Bob Jones' },
      { name: 'Carol Diaz' },
    ],
  },
];

const meta: Meta<typeof MeetingList> = {
  component: MeetingList,
  title: 'Design System/MeetingList',
  parameters: {
    docs: {
      description: {
        component:
          'Meeting rows with optional date grouping. Pass `collapsible` to tuck non-selected rows into a hover stack (Storybook demo). The popover uses a recent / browse split instead.',
      },
    },
  },
  decorators: [
    () => ({
      template:
        '<div style="max-width: 420px; padding: 16px 8px; min-height: 280px;"><story /></div>',
    }),
  ],
};

export default meta;

type Story = StoryObj<typeof MeetingList>;

export const BrowseBeforeSelection: Story = {
  name: 'Browse (no selection)',
  args: {
    notes: granolaLikeNotes,
    selectedId: null,
  },
};

export const CollapsedStack: Story = {
  name: 'Collapsed stack',
  render: () => ({
    components: { MeetingList },
    setup() {
      const selectedId = ref<string | null>('broshir');
      return { notes: granolaLikeNotes, selectedId };
    },
    template: `
      <div>
        <p style="margin: 0 0 12px; font: 12px/1.4 system-ui; color: #72726e;">
          Leave the list to collapse · hover to expand
        </p>
        <MeetingList
          :notes="notes"
          :selected-id="selectedId"
          collapsible
          @select="selectedId = $event"
        />
      </div>
    `,
  }),
};

export const Interactive: Story = {
  render: () => ({
    components: { MeetingList },
    setup() {
      const selectedId = ref<string | null>(null);
      return { notes: granolaLikeNotes, selectedId };
    },
    template: `
      <div>
        <p style="margin: 0 0 12px; font: 12px/1.4 system-ui; color: #72726e;">
          Pick a meeting — then move the pointer away to see the stack.
        </p>
        <MeetingList
          :notes="notes"
          :selected-id="selectedId"
          collapsible
          @select="selectedId = $event"
        />
      </div>
    `,
  }),
};
