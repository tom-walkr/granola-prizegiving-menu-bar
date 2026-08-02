<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { describeGranolaLoadError, listAllNotes } from '../api/granola';
import type { NoteListItem } from '../api/types';
import granolaLogo from '../assets/granola-pg-logo.svg';
import MeetingList from './MeetingList.vue';
import MeetingListSkeleton from './MeetingListSkeleton.vue';

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

const showSkeleton = computed(() => isLoading.value && notes.value.length === 0 && !error.value);
const showList = computed(() => notes.value.length > 0);

async function loadNotes(): Promise<void> {
  if (props.forcedStatus === 'loading') {
    isLoading.value = true;
    return;
  }
  if (props.forcedStatus === 'error') {
    isLoading.value = false;
    error.value = 'Open Settings… and add your API key, or enable mock data.';
    return;
  }
  if (props.forcedStatus === 'empty') {
    isLoading.value = false;
    notes.value = [];
    return;
  }

  isLoading.value = true;
  // Keep any existing list visible while refreshing — only clear error on a new attempt.
  error.value = null;
  try {
    notes.value = await listAllNotes();
    lastFetchAt = Date.now();
  } catch (err) {
    error.value = describeGranolaLoadError(err);
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
    <MeetingListSkeleton v-if="showSkeleton" />

    <div v-else-if="error && notes.length === 0" class="note-selector__message" role="alert">
      <img
        class="note-selector__message-mark"
        :src="granolaLogo"
        alt=""
        width="36"
        height="36"
      />
      <p class="note-selector__message-title">Couldn't load notes</p>
      <p class="note-selector__message-hint">{{ error }}</p>
    </div>

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
.note-selector {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.note-selector__status {
  margin: 0;
  padding: var(--space-base) var(--space-md);
  font-size: var(--text-sm-size);
  line-height: var(--text-sm-leading);
  color: var(--color-ink-muted);
}

.note-selector__message {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-height: 180px;
  padding: var(--space-xl) var(--space-lg);
  text-align: center;
}

.note-selector__message-mark {
  display: block;
  width: 36px;
  height: 36px;
  margin-bottom: var(--space-xs);
  opacity: 0.9;
}

.note-selector__message-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-award-title-size);
  font-weight: var(--font-weight-normal);
  line-height: var(--text-award-title-leading);
  letter-spacing: var(--text-award-title-tracking);
  color: var(--color-ink);
}

.note-selector__message-hint {
  margin: 0;
  max-width: 22em;
  font-size: var(--text-sm-size);
  line-height: var(--text-sm-leading);
  color: var(--color-ink-quiet);
}
</style>
