<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { describeGranolaLoadError, getNote, listAllNotes } from '../api/granola';
import type { NoteListItem } from '../api/types';
import chevronLeft from '../assets/chevron-left.svg?raw';
import granolaLogo from '../assets/granola-pg-logo.svg';
import {
  classifyPrizegivingCapability,
  type PrizegivingCapability,
} from '../logic/prizegivingCapability';
import MeetingList from './MeetingList.vue';
import MeetingListSkeleton from './MeetingListSkeleton.vue';

const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000;
const MIN_REFRESH_GAP_MS = 2000;
const RECENT_COUNT = 3;

type View = 'recent' | 'browse';

const props = withDefaults(
  defineProps<{
    selectedId?: string | null;
    pollIntervalMs?: number;
    /** Storybook-only: pins a state that isn't otherwise reachable from fixture data. Real usage never sets this. */
    forcedStatus?: 'loading' | 'error' | 'empty';
  }>(),
  { pollIntervalMs: DEFAULT_POLL_INTERVAL_MS, selectedId: null }
);

const emit = defineEmits<{
  select: [noteId: string];
  browsing: [active: boolean];
}>();

const notes = ref<NoteListItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const view = ref<View>('recent');
/** Directional slide: forward = into browse, back = return to recent. */
const slideName = ref('note-slide-forward');
const prizegivingById = reactive<Record<string, PrizegivingCapability>>({});

let pollHandle: ReturnType<typeof setInterval> | undefined;
let lastFetchAt = 0;
let probeGeneration = 0;

const showSkeleton = computed(() => isLoading.value && notes.value.length === 0 && !error.value);
const showList = computed(() => notes.value.length > 0);

const sortedNotes = computed(() =>
  [...notes.value].sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
);

const recentNotes = computed(() => sortedNotes.value.slice(0, RECENT_COUNT));
const olderCount = computed(() => Math.max(0, sortedNotes.value.length - RECENT_COUNT));
const canBrowse = computed(() => olderCount.value > 0);

watch(
  view,
  (next) => {
    emit('browsing', next === 'browse');
    if (next === 'browse') void probePrizegiving(sortedNotes.value.map((n) => n.id));
  },
  { immediate: true }
);

/**
 * List payloads have no transcript — fetch each note (rate-limited) to learn
 * whether diarization labels will unlock full AwardCards.
 */
async function probePrizegiving(ids: string[]): Promise<void> {
  const generation = probeGeneration;
  const pending = ids.filter((id) => prizegivingById[id] === undefined);
  if (pending.length === 0) return;

  await Promise.all(
    pending.map(async (id) => {
      try {
        const note = await getNote(id, { includeTranscript: true });
        if (generation !== probeGeneration) return;
        prizegivingById[id] = note
          ? classifyPrizegivingCapability(note.transcript)
          : 'empty';
        // List endpoint omits attendees — fill them in once we have detail.
        if (note && note.attendees.length > 0) {
          const index = notes.value.findIndex((n) => n.id === id);
          if (index >= 0) {
            notes.value[index] = { ...notes.value[index], attendees: note.attendees };
          }
        }
      } catch {
        // Leave unset so a later refresh can retry.
      }
    })
  );
}

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
  error.value = null;
  try {
    notes.value = await listAllNotes();
    lastFetchAt = Date.now();
    probeGeneration += 1;

    const liveIds = new Set(notes.value.map((n) => n.id));
    for (const id of Object.keys(prizegivingById)) {
      if (!liveIds.has(id)) delete prizegivingById[id];
    }

    const newestIds = [...notes.value]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
      .slice(0, RECENT_COUNT)
      .map((n) => n.id);
    // Re-check recent notes so a transcript that finishes processing can flip to full.
    for (const id of newestIds) delete prizegivingById[id];

    void probePrizegiving(newestIds);
    if (view.value === 'browse') {
      void probePrizegiving(notes.value.map((n) => n.id));
    }
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

function openBrowse(): void {
  slideName.value = 'note-slide-forward';
  view.value = 'browse';
}

function closeBrowse(): void {
  slideName.value = 'note-slide-back';
  view.value = 'recent';
}

function onSelect(noteId: string): void {
  emit('select', noteId);
  if (view.value === 'browse') closeBrowse();
}

onMounted(() => {
  void loadNotes();
  pollHandle = setInterval(() => void loadNotes(), props.pollIntervalMs);
});

onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle);
  probeGeneration += 1;
});

defineExpose({ refresh });
</script>

<template>
  <section
    class="note-selector"
    :aria-label="view === 'browse' ? 'All meetings' : 'Recent meetings'"
  >
    <MeetingListSkeleton v-if="showSkeleton" :rows="3" />

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

    <div v-else-if="showList" class="note-selector__deck">
      <Transition :name="slideName">
        <div v-if="view === 'recent'" key="recent" class="note-selector__page">
          <p class="note-selector__eyebrow">Recent</p>

          <MeetingList
            :notes="recentNotes"
            :selected-id="selectedId"
            :grouped="false"
            :prizegiving-by-id="prizegivingById"
            collapsible
            @select="onSelect"
          />

          <button
            v-if="canBrowse"
            type="button"
            class="note-selector__browse"
            @click="openBrowse"
          >
            <span class="note-selector__browse-label">Browse all meetings</span>
            <span class="note-selector__browse-meta">{{ olderCount }} older</span>
          </button>
        </div>

        <div v-else key="browse" class="note-selector__page note-selector__page--browse">
          <div class="note-selector__browse-bar">
            <button
              type="button"
              class="note-selector__back"
              aria-label="Back to recent meetings"
              @click="closeBrowse"
              v-html="chevronLeft"
            />
            <div class="note-selector__browse-heading">
              <p class="note-selector__eyebrow">All meetings</p>
              <p class="note-selector__browse-count">{{ sortedNotes.length }}</p>
            </div>
          </div>

          <div class="note-selector__browse-scroll">
            <MeetingList
              :notes="sortedNotes"
              :selected-id="selectedId"
              :prizegiving-by-id="prizegivingById"
              @select="onSelect"
            />
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.note-selector {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.note-selector__deck {
  position: relative;
  overflow: hidden;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.note-selector__page {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 100%;
  min-width: 0;
}

.note-selector__page--browse {
  min-height: 0;
  flex: 1;
  gap: var(--space-sm);
}

.note-selector__eyebrow {
  margin: 0;
  padding: var(--space-xxs) var(--space-md) 0;
  font-size: var(--text-xs-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-xs-leading);
  letter-spacing: var(--text-xs-tracking);
  color: var(--color-ink-muted);
  text-transform: uppercase;
}

.note-selector__browse {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
  width: 100%;
  margin: var(--space-xs) 0 0;
  padding: var(--space-sm) var(--space-md);
  border: 0;
  border-radius: var(--radius-xl);
  background: transparent;
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.note-selector__browse:hover,
.note-selector__browse:focus-visible {
  background: var(--oats-fill-soft);
}

.note-selector__browse:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 1px;
}

.note-selector__browse-label {
  font-size: var(--text-sm-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-sm-leading);
}

.note-selector__browse-meta {
  flex-shrink: 0;
  font-size: var(--text-xs-size);
  line-height: var(--text-xs-leading);
  color: var(--color-ink-quiet);
  font-variant-numeric: tabular-nums;
}

.note-selector__browse-bar {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: 0;
  padding-right: var(--space-md);
}

.note-selector__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
}

.note-selector__back:hover,
.note-selector__back:focus-visible {
  background: var(--chrome-row-hover);
  color: var(--color-ink);
}

.note-selector__back:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 1px;
}

.note-selector__back :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
}

.note-selector__browse-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
  flex: 1;
  min-width: 0;
}

.note-selector__browse-heading .note-selector__eyebrow {
  padding: 0;
}

.note-selector__browse-count {
  margin: 0;
  font-size: var(--text-xs-size);
  line-height: var(--text-xs-leading);
  color: var(--color-ink-quiet);
  font-variant-numeric: tabular-nums;
}

.note-selector__browse-scroll {
  min-height: 0;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  margin-inline: calc(-1 * var(--space-xxs));
  padding-inline: var(--space-xxs);
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

/* Forward: recent exits left, browse enters from right */
.note-slide-forward-enter-active,
.note-slide-forward-leave-active,
.note-slide-back-enter-active,
.note-slide-back-leave-active {
  transition:
    transform var(--duration-slow) var(--ease-out-expo),
    opacity var(--duration-moderate) var(--ease-out);
}

.note-slide-forward-leave-active,
.note-slide-back-leave-active {
  position: absolute;
  inset-inline: 0;
  top: 0;
  width: 100%;
}

.note-slide-forward-enter-from {
  transform: translateX(18%);
  opacity: 0;
}

.note-slide-forward-leave-to {
  transform: translateX(-12%);
  opacity: 0;
}

.note-slide-back-enter-from {
  transform: translateX(-12%);
  opacity: 0;
}

.note-slide-back-leave-to {
  transform: translateX(18%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .note-slide-forward-enter-active,
  .note-slide-forward-leave-active,
  .note-slide-back-enter-active,
  .note-slide-back-leave-active {
    transition: none;
  }
}
</style>
