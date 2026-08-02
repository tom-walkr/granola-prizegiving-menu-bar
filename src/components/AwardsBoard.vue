<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { getNote, describeGranolaLoadError } from '../api/granola';
import clipboardIcon from '../assets/clipboard.svg?raw';
import slackIcon from '../assets/slack.svg?raw';
import { computeAwards } from '../logic/awards';
import type { AwardsResult } from '../logic/awards';
import { formatAwardsForSlack, formatAwardsPlain } from '../logic/slackSummary';
import { computeSpeakerStats } from '../logic/speakerStats';
import type { SpeakerStats } from '../logic/speakerStats';
import { wordShareFromStats } from '../logic/wordShare';
import AwardCard from './AwardCard.vue';
import AwardsBoardSkeleton from './AwardsBoardSkeleton.vue';
import TwoWayComparison from './TwoWayComparison.vue';
import WordShareChart from './WordShareChart.vue';

type Status = 'loading' | 'ready' | 'not-ready' | 'empty' | 'error';
type CopyKind = 'plain' | 'slack';
type CopyFeedback = 'idle' | 'copied' | 'failed';

const COPY_RESET_MS = 2000;

const props = defineProps<{
  noteId: string;
  /** Storybook-only: pins a state that isn't otherwise reachable from fixture data. Real usage never sets this. */
  forcedStatus?: Extract<Status, 'loading' | 'error'>;
}>();

const status = ref<Status>('loading');
const errorMessage = ref('');
const stats = ref<SpeakerStats | null>(null);
const meetingTitle = ref('');
const meetingCreatedAt = ref('');
const loadedNoteId = ref<string | null>(null);
const plainCopyState = ref<CopyFeedback>('idle');
const slackCopyState = ref<CopyFeedback>('idle');

const copyResetHandles: Partial<Record<CopyKind, ReturnType<typeof setTimeout>>> = {};

/** Always derive awards from current stats so values stay in sync with the share chart. */
const result = computed<AwardsResult | null>(() =>
  stats.value ? computeAwards(stats.value) : null
);

const wordShare = computed(() => (stats.value ? wordShareFromStats(stats.value) : []));

/** First load / note switch with nothing to show yet — reserve layout with skeletons. */
const showSkeleton = computed(
  () => status.value === 'loading' && !(result.value && loadedNoteId.value === props.noteId)
);

/** Keep prior awards visible only while the same note is refreshing. */
const showContent = computed(
  () =>
    (status.value === 'ready' || status.value === 'loading') &&
    result.value !== null &&
    loadedNoteId.value === props.noteId
);

const plainCopyLabel = computed(() => copyLabel(plainCopyState.value, 'Copy'));
const slackCopyLabel = computed(() => copyLabel(slackCopyState.value, 'Copy for Slack'));

function copyLabel(state: CopyFeedback, idle: string): string {
  if (state === 'copied') return 'Copied!';
  if (state === 'failed') return 'Copy failed';
  return idle;
}

function copyStateRef(kind: CopyKind) {
  return kind === 'plain' ? plainCopyState : slackCopyState;
}

function resetCopyFeedback(): void {
  plainCopyState.value = 'idle';
  slackCopyState.value = 'idle';
  (Object.keys(copyResetHandles) as CopyKind[]).forEach((kind) => {
    const handle = copyResetHandles[kind];
    if (handle) clearTimeout(handle);
    delete copyResetHandles[kind];
  });
}

function scheduleCopyReset(kind: CopyKind): void {
  const existing = copyResetHandles[kind];
  if (existing) clearTimeout(existing);
  copyResetHandles[kind] = setTimeout(() => {
    copyStateRef(kind).value = 'idle';
    delete copyResetHandles[kind];
  }, COPY_RESET_MS);
}

function clearMeeting(): void {
  stats.value = null;
  meetingTitle.value = '';
  meetingCreatedAt.value = '';
  loadedNoteId.value = null;
  resetCopyFeedback();
}

async function load(noteId: string): Promise<void> {
  status.value = 'loading';
  errorMessage.value = '';
  resetCopyFeedback();

  // Drop stale awards when switching notes so we don't flash the wrong meeting.
  if (loadedNoteId.value !== noteId) {
    stats.value = null;
    meetingTitle.value = '';
    meetingCreatedAt.value = '';
  }

  if (props.forcedStatus === 'loading') return;
  if (props.forcedStatus === 'error') {
    errorMessage.value = 'Something went wrong loading this note.';
    status.value = 'error';
    clearMeeting();
    return;
  }

  try {
    const note = await getNote(noteId, { includeTranscript: true });
    if (!note) {
      clearMeeting();
      status.value = 'not-ready';
      return;
    }
    if (!note.transcript || note.transcript.length === 0) {
      clearMeeting();
      status.value = 'empty';
      return;
    }
    stats.value = computeSpeakerStats(note.transcript, note.attendees);
    meetingTitle.value = note.title;
    meetingCreatedAt.value = note.created_at;
    loadedNoteId.value = noteId;
    status.value = 'ready';
  } catch (err) {
    errorMessage.value = describeGranolaLoadError(err);
    clearMeeting();
    status.value = 'error';
  }
}

async function writePlainClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Slack needs text/html on the clipboard — *mrkdwn* plain paste stays literal. */
async function writeSlackClipboard(plain: string, html: string): Promise<void> {
  // WKWebView (Tauri) expects Promise values on ClipboardItem.
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/plain': Promise.resolve(new Blob([plain], { type: 'text/plain' })),
      'text/html': Promise.resolve(new Blob([html], { type: 'text/html' })),
    }),
  ]);
}

async function copyPlain(): Promise<void> {
  if (!result.value || !meetingTitle.value) return;

  const text = formatAwardsPlain(
    { title: meetingTitle.value, createdAt: meetingCreatedAt.value },
    result.value
  );

  try {
    await writePlainClipboard(text);
    plainCopyState.value = 'copied';
  } catch {
    plainCopyState.value = 'failed';
  }
  scheduleCopyReset('plain');
}

async function copyForSlack(): Promise<void> {
  if (!result.value || !meetingTitle.value) return;

  const { plain, html } = formatAwardsForSlack(
    { title: meetingTitle.value, createdAt: meetingCreatedAt.value },
    result.value
  );

  try {
    await writeSlackClipboard(plain, html);
    slackCopyState.value = 'copied';
  } catch {
    // Fall back to plain if rich clipboard write isn't available.
    try {
      await writePlainClipboard(plain);
      slackCopyState.value = 'copied';
    } catch {
      slackCopyState.value = 'failed';
    }
  }
  scheduleCopyReset('slack');
}

onMounted(() => load(props.noteId));
watch(
  () => props.noteId,
  (noteId) => load(noteId)
);
onUnmounted(() => {
  resetCopyFeedback();
});
</script>

<template>
  <section class="awards-board" aria-label="Awards" :aria-busy="status === 'loading' || undefined">
    <AwardsBoardSkeleton v-if="showSkeleton" />

    <div
      v-else-if="status === 'not-ready'"
      class="awards-board__message"
      role="status"
    >
      <p class="awards-board__message-title">Not ready yet</p>
      <p class="awards-board__message-hint">
        This note may still be processing.
      </p>
    </div>

    <div v-else-if="status === 'empty'" class="awards-board__message" role="status">
      <p class="awards-board__message-title">No transcript</p>
      <p class="awards-board__message-hint">
        Nothing to score for this note yet.
      </p>
    </div>

    <div v-else-if="status === 'error'" class="awards-board__message" role="alert">
      <p class="awards-board__message-title">Couldn't load awards</p>
      <p class="awards-board__message-hint">{{ errorMessage }}</p>
    </div>

    <template v-else-if="showContent && result">
      <WordShareChart :entries="wordShare" />

      <div v-if="result.mode === 'full'" class="awards-board__grid">
        <AwardCard
          v-for="(award, index) in result.awards"
          :key="award.id"
          class="awards-board__card"
          :style="{ '--stagger': index }"
          :award-id="award.id"
          :title="award.title"
          :winner-name="award.winnerName"
          :metric="award.value"
        />
      </div>

      <TwoWayComparison
        v-else
        :label="result.label"
        :you-name="result.you.displayName"
        :you-seconds="result.you.totalDurationSeconds"
        :rest-name="result.restOfCall.displayName"
        :rest-seconds="result.restOfCall.totalDurationSeconds"
      />

      <div class="awards-board__toolbar">
        <button
          type="button"
          class="awards-board__copy"
          :class="{
            'is-copied': plainCopyState === 'copied',
            'is-failed': plainCopyState === 'failed',
          }"
          :aria-label="plainCopyLabel"
          :title="plainCopyLabel"
          @click="copyPlain"
        >
          <span class="awards-board__copy-icon" aria-hidden="true" v-html="clipboardIcon" />
          <span class="awards-board__copy-label">{{ plainCopyLabel }}</span>
        </button>
        <button
          type="button"
          class="awards-board__copy"
          :class="{
            'is-copied': slackCopyState === 'copied',
            'is-failed': slackCopyState === 'failed',
          }"
          :aria-label="slackCopyLabel"
          :title="slackCopyLabel"
          @click="copyForSlack"
        >
          <span
            class="awards-board__copy-icon"
            aria-hidden="true"
            v-html="slackIcon"
          />
          <span class="awards-board__copy-label">{{ slackCopyLabel }}</span>
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.awards-board {
  display: flex;
  flex-direction: column;
  gap: var(--stack-gap);
  min-width: 0;
}

.awards-board__toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-xs);
}

.awards-board__copy {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0;
  padding: var(--space-xs) var(--space-sm);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-ink-muted);
  font-family: inherit;
  font-size: var(--text-xs-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-xs-leading);
  letter-spacing: var(--text-xs-tracking);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.awards-board__copy:hover,
.awards-board__copy:focus-visible {
  background: var(--chrome-row-hover);
  color: var(--color-ink);
}

.awards-board__copy:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 1px;
}

.awards-board__copy.is-copied {
  color: var(--color-ink-accent-strong);
}

.awards-board__copy.is-failed {
  color: var(--color-ink-danger);
}

.awards-board__copy-icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.awards-board__copy-icon :deep(svg) {
  display: block;
  width: 14px;
  height: 14px;
}

.awards-board__copy-label {
  white-space: nowrap;
}

.awards-board__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-height: 120px;
  padding: var(--space-xl) var(--space-lg);
  text-align: center;
}

.awards-board__message-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-award-title-size);
  font-weight: var(--font-weight-normal);
  line-height: var(--text-award-title-leading);
  letter-spacing: var(--text-award-title-tracking);
  color: var(--color-ink);
}

.awards-board__message-hint {
  margin: 0;
  max-width: 22em;
  font-size: var(--text-sm-size);
  line-height: var(--text-sm-leading);
  color: var(--color-ink-quiet);
}

.awards-board__grid {
  display: flex;
  flex-direction: column;
  gap: var(--stack-gap);
}

.awards-board__card {
  animation: award-card-in var(--duration-slow) var(--ease-out-expo) both;
  animation-delay: calc(var(--stagger, 0) * 40ms);
}

@keyframes award-card-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .awards-board__card {
    animation: none;
  }
}
</style>
