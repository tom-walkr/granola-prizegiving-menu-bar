<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { listAllNotes } from '../api/granola';
import type { NoteListItem } from '../api/types';
import MeetingList from './MeetingList.vue';

const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000;
// Ignore refresh() calls (e.g. from rapid popover open/close) this soon after the last fetch.
const MIN_REFRESH_GAP_MS = 2000;

const props = withDefaults(
  defineProps<{
    selectedId?: string | null;
    pollIntervalMs?: number;
    /** Storybook-only: pins a state that isn't otherwise reachable from fixture data. Real usage never sets this. */
    forcedStatus?: 'loading' | 'error' | 'empty';
  }>(),
  { pollIntervalMs: DEFAULT_POLL_INTERVAL_MS, selectedId: null }
);

const emit = defineEmits<{ select: [noteId: string] }>();

const notes = ref<NoteListItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

let pollHandle: ReturnType<typeof setInterval> | undefined;
let lastFetchAt = 0;

const showList = computed(() => !isLoading.value && !error.value && notes.value.length > 0);

async function loadNotes(): Promise<void> {
  if (props.forcedStatus === 'loading') {
    isLoading.value = true;
    return;
  }
  if (props.forcedStatus === 'error') {
    isLoading.value = false;
    error.value = 'Failed to load notes.';
    return;
  }
  if (props.forcedStatus === 'empty') {
    isLoading.value = false;
    notes.value = [];
    return;
  }

  isLoading.value = true;
  error.value = null;
  try {
    notes.value = await listAllNotes();
    lastFetchAt = Date.now();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load notes.';
  } finally {
    isLoading.value = false;
  }
}

function refresh(): void {
  if (Date.now() - lastFetchAt < MIN_REFRESH_GAP_MS) return;
  void loadNotes();
}

onMounted(() => {
  void loadNotes();
  pollHandle = setInterval(() => void loadNotes(), props.pollIntervalMs);
});

onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle);
});

defineExpose({ refresh });
</script>

<template>
  <section class="note-selector" aria-label="Recent notes">
    <p v-if="isLoading && notes.length === 0" class="note-selector__status">Loading notes…</p>
    <p v-else-if="error" class="note-selector__status" role="alert">{{ error }}</p>
    <p v-else-if="notes.length === 0" class="note-selector__status">No notes found.</p>
    <MeetingList
      v-else-if="showList"
      :notes="notes"
      :selected-id="selectedId"
      @select="emit('select', $event)"
    />
  </section>
</template>

<style scoped>
.note-selector__status {
  margin: 0;
  padding: var(--space-base) var(--space-md);
  font-size: var(--text-sm-size);
  line-height: var(--text-sm-leading);
  color: var(--color-ink-muted);
}
</style>
