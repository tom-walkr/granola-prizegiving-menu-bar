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
  decorators: [
    () => ({
      template: '<div style="max-width: 420px; padding: 8px 4px;"><story /></div>',
    }),
  ],
};

export default meta;

type Story = StoryObj<typeof MeetingList>;

export const GranolaList: Story = {
  render: () => ({
    components: { MeetingList },
    setup() {
      const selectedId = ref<string | null>('broshir');
      return { notes: granolaLikeNotes, selectedId };
    },
    template: `
      <MeetingList
        :notes="notes"
        :selected-id="selectedId"
        @select="selectedId = $event"
      />
    `,
  }),
};

export const EmptyDayGrouping: Story = {
  args: {
    notes: granolaLikeNotes.slice(0, 2),
    selectedId: null,
  },
};
