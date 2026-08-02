<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getNote } from '../api/granola';
import { computeAwards } from '../logic/awards';
import type { AwardsResult } from '../logic/awards';
import { computeSpeakerStats } from '../logic/speakerStats';
import type { SpeakerStats } from '../logic/speakerStats';
import { wordShareFromStats } from '../logic/wordShare';
import AwardCard from './AwardCard.vue';
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

const wordShare = computed(() => (stats.value ? wordShareFromStats(stats.value) : []));

async function load(noteId: string): Promise<void> {
  status.value = 'loading';
  errorMessage.value = '';
  result.value = null;
  stats.value = null;

  if (props.forcedStatus === 'loading') return;
  if (props.forcedStatus === 'error') {
    errorMessage.value = 'Something went wrong loading this note.';
    status.value = 'error';
    return;
  }

  try {
    const note = await getNote(noteId, { includeTranscript: true });
    if (!note) {
      status.value = 'not-ready';
      return;
    }
    if (!note.transcript || note.transcript.length === 0) {
      status.value = 'empty';
      return;
    }
    const nextStats = computeSpeakerStats(note.transcript, note.attendees);
    stats.value = nextStats;
    result.value = computeAwards(nextStats);
    status.value = 'ready';
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Something went wrong loading this note.';
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
  <section class="awards-board" aria-label="Awards">
    <p v-if="status === 'loading'" class="awards-board__status">Loading awards…</p>
    <p v-else-if="status === 'not-ready'" class="awards-board__status">
      This note isn't ready yet — it may still be processing.
    </p>
    <p v-else-if="status === 'empty'" class="awards-board__status">
      No transcript is available for this note.
    </p>
    <p v-else-if="status === 'error'" class="awards-board__status" role="alert">
      {{ errorMessage }}
    </p>

    <template v-else-if="status === 'ready' && result">
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
  gap: var(--space-md);
  min-width: 0;
}

.awards-board__status {
  margin: 0;
  padding: var(--space-base) var(--space-md);
  font-size: var(--text-sm-size);
  line-height: var(--text-sm-leading);
  color: var(--color-ink-muted);
}

.awards-board__grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
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
