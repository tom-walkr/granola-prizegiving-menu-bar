<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getNote, describeGranolaLoadError } from '../api/granola';
import { computeAwards } from '../logic/awards';
import type { AwardsResult } from '../logic/awards';
import { computeSpeakerStats } from '../logic/speakerStats';
import type { SpeakerStats } from '../logic/speakerStats';
import { wordShareFromStats } from '../logic/wordShare';
import AwardCard from './AwardCard.vue';
import AwardsBoardSkeleton from './AwardsBoardSkeleton.vue';
import TwoWayComparison from './TwoWayComparison.vue';
import WordShareChart from './WordShareChart.vue';

type Status = 'loading' | 'ready' | 'not-ready' | 'empty' | 'error';

const props = defineProps<{
  noteId: string;
  /** Storybook-only: pins a state that isn't otherwise reachable from fixture data. Real usage never sets this. */
  forcedStatus?: Extract<Status, 'loading' | 'error'>;
}>();

const status = ref<Status>('loading');
const errorMessage = ref('');
const result = ref<AwardsResult | null>(null);
const stats = ref<SpeakerStats | null>(null);
const loadedNoteId = ref<string | null>(null);

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

async function load(noteId: string): Promise<void> {
  status.value = 'loading';
  errorMessage.value = '';

  // Drop stale awards when switching notes so we don't flash the wrong meeting.
  if (loadedNoteId.value !== noteId) {
    result.value = null;
    stats.value = null;
  }

  if (props.forcedStatus === 'loading') return;
  if (props.forcedStatus === 'error') {
    errorMessage.value = 'Something went wrong loading this note.';
    status.value = 'error';
    result.value = null;
    stats.value = null;
    loadedNoteId.value = null;
    return;
  }

  try {
    const note = await getNote(noteId, { includeTranscript: true });
    if (!note) {
      result.value = null;
      stats.value = null;
      loadedNoteId.value = null;
      status.value = 'not-ready';
      return;
    }
    if (!note.transcript || note.transcript.length === 0) {
      result.value = null;
      stats.value = null;
      loadedNoteId.value = null;
      status.value = 'empty';
      return;
    }
    const nextStats = computeSpeakerStats(note.transcript, note.attendees);
    stats.value = nextStats;
    result.value = computeAwards(nextStats);
    loadedNoteId.value = noteId;
    status.value = 'ready';
  } catch (err) {
    errorMessage.value = describeGranolaLoadError(err);
    result.value = null;
    stats.value = null;
    loadedNoteId.value = null;
    status.value = 'error';
  }
}

onMounted(() => load(props.noteId));
watch(
  () => props.noteId,
  (noteId) => load(noteId)
);
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
          :value="award.value"
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
