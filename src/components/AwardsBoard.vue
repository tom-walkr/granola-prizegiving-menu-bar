<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { getNote } from '../api/granola';
import { computeAwards } from '../logic/awards';
import type { AwardsResult } from '../logic/awards';
import { computeSpeakerStats } from '../logic/speakerStats';
import AwardCard from './AwardCard.vue';

type Status = 'loading' | 'ready' | 'not-ready' | 'empty' | 'error';

const props = defineProps<{
  noteId: string;
  /** Storybook-only: pins a state that isn't otherwise reachable from fixture data. Real usage never sets this. */
  forcedStatus?: Extract<Status, 'loading' | 'error'>;
}>();

const status = ref<Status>('loading');
const errorMessage = ref('');
const result = ref<AwardsResult | null>(null);

async function load(noteId: string): Promise<void> {
  status.value = 'loading';
  errorMessage.value = '';
  result.value = null;

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
    const stats = computeSpeakerStats(note.transcript, note.attendees);
    result.value = computeAwards(stats);
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
  <section aria-label="Awards">
    <p v-if="status === 'loading'">Loading awards…</p>
    <p v-else-if="status === 'not-ready'">This note isn't ready yet — it may still be processing.</p>
    <p v-else-if="status === 'empty'">No transcript is available for this note.</p>
    <p v-else-if="status === 'error'" role="alert">{{ errorMessage }}</p>
    <template v-else-if="status === 'ready' && result">
      <p>Mode: {{ result.mode === 'full' ? 'Full breakdown' : 'Two-way comparison' }}</p>
      <div v-if="result.mode === 'full'">
        <AwardCard
          v-for="award in result.awards"
          :key="award.id"
          :title="award.title"
          :winner-name="award.winnerName"
          :value="award.value"
        />
      </div>
      <p v-else>{{ result.label }}</p>
    </template>
  </section>
</template>
