<script setup lang="ts">
import { computed } from 'vue';
import type { NoteListItem } from '../api/types';
import {
  formatAttendeeLine,
  formatMeetingTime,
  groupNotesByDate,
  initialsFromTitle,
} from '../logic/meetingDisplay';
import MeetingDateHeader from './MeetingDateHeader.vue';
import MeetingEntry from './MeetingEntry.vue';

const props = defineProps<{
  notes: NoteListItem[];
  selectedId?: string | null;
}>();

defineEmits<{ select: [noteId: string] }>();

const groups = computed(() => groupNotesByDate(props.notes));
</script>

<template>
  <div class="meeting-list">
    <section
      v-for="group in groups"
      :key="group.key"
      class="meeting-list__group"
      :aria-label="group.label"
    >
      <MeetingDateHeader :label="group.label" />
      <ul class="meeting-list__rows">
        <li v-for="note in group.notes" :key="note.id" class="meeting-list__item">
          <MeetingEntry
            :title="note.title"
            :subtitle="formatAttendeeLine(note.attendees)"
            :time="formatMeetingTime(note.created_at)"
            :initials="initialsFromTitle(note.title)"
            :selected="note.id === selectedId"
            :shared="note.attendees.length > 1"
            @select="$emit('select', note.id)"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.meeting-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.meeting-list__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.meeting-list__rows {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.meeting-list__item {
  margin: 0;
  padding: 0;
}
</style>
