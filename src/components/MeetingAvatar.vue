<script setup lang="ts">
import { computed } from 'vue';
import type { PrizegivingCapability } from '../logic/prizegivingCapability';
import { prizegivingCapabilityLabel } from '../logic/prizegivingCapability';

const props = withDefaults(
  defineProps<{
    initials: string;
    /**
     * Prizegiving readiness for this note. Empty / probing → no dot;
     * two-way → grey; full → green.
     */
    prizegiving?: PrizegivingCapability | null;
  }>(),
  {
    prizegiving: null,
  }
);

/** Grey (two-way) and green (full) dots; empty / probing show nothing. */
const prizeDot = computed(() => {
  if (props.prizegiving === 'full' || props.prizegiving === 'two-way') {
    return props.prizegiving;
  }
  return null;
});

const prizeLabel = computed(() =>
  prizeDot.value ? prizegivingCapabilityLabel(prizeDot.value) : null
);
</script>

<template>
  <span class="meeting-avatar">
    <span class="meeting-avatar__face" aria-hidden="true">{{ initials }}</span>
    <span
      v-if="prizeDot"
      class="meeting-avatar__prize"
      :class="`is-${prizeDot}`"
      :title="prizeLabel ?? undefined"
      :aria-label="prizeLabel ?? undefined"
    />
  </span>
</template>

<style scoped>
.meeting-avatar {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.meeting-avatar__face {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-md);
  background: var(--oats-fill-soft-opaque);
  color: var(--color-ink-muted);
  font-size: var(--text-2xs-size);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.02em;
  line-height: 1;
  user-select: none;
}

.meeting-avatar__prize {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 1.5px var(--oats-surface);
}

.meeting-avatar__prize.is-full {
  background: var(--color-dot-olive);
}

.meeting-avatar__prize.is-two-way {
  background: var(--color-ink-quiet);
  opacity: 0.85;
}
</style>
