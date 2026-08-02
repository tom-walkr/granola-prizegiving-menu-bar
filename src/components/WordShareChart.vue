<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue';
import { formatTalkDuration, type WordShareEntry } from '../logic/wordShare';

type ShareMode = 'words' | 'time';

const props = defineProps<{
  entries: WordShareEntry[];
}>();

const DOT_COLORS = [
  'var(--color-dot-olive)',
  'var(--color-dot-blue)',
  'var(--color-dot-gold)',
  'var(--color-dot-coral)',
  'var(--color-dot-amber)',
] as const;

const mode = ref<ShareMode>('words');
const popping = ref(false);
const flipping = ref(false);

let flipTimer: ReturnType<typeof setTimeout> | undefined;
let popTimer: ReturnType<typeof setTimeout> | undefined;

/** Keep each speaker on a stable color even when the list re-sorts. */
const colorByKey = computed(() => {
  const map = new Map<string, string>();
  props.entries.forEach((entry, index) => {
    map.set(entry.key, DOT_COLORS[index % DOT_COLORS.length]);
  });
  return map;
});

const sortedEntries = computed(() => {
  const list = [...props.entries];
  if (mode.value === 'time') {
    return list.sort((a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name));
  }
  return list.sort((a, b) => b.words - a.words || a.name.localeCompare(b.name));
});

const totalValue = computed(() =>
  mode.value === 'time'
    ? props.entries.reduce((sum, entry) => sum + entry.seconds, 0)
    : props.entries.reduce((sum, entry) => sum + entry.words, 0)
);

/** Whether the active mode has something to draw in the bar. */
const hasData = computed(() => sortedEntries.value.length > 0 && totalValue.value > 0);

/**
 * Keep the control clickable even when the active mode is empty (e.g. words
 * exist but talk-time is 0) — otherwise one click into that mode freezes it.
 */
const canToggle = computed(() => props.entries.length > 0);

function colorFor(entry: WordShareEntry): string {
  return colorByKey.value.get(entry.key) ?? DOT_COLORS[0];
}

function formatWords(words: number): string {
  return new Intl.NumberFormat('en-GB').format(words);
}

function valueOf(entry: WordShareEntry): number {
  return mode.value === 'time' ? entry.seconds : entry.words;
}

function shareOf(entry: WordShareEntry): number {
  return mode.value === 'time' ? entry.timeShare : entry.wordShare;
}

function formatValue(entry: WordShareEntry): string {
  return mode.value === 'time' ? formatTalkDuration(entry.seconds) : formatWords(entry.words);
}

function formatTotal(): string {
  return mode.value === 'time'
    ? `${formatTalkDuration(totalValue.value)} total`
    : `${formatWords(totalValue.value)} total`;
}

function clearTimers(): void {
  if (flipTimer !== undefined) {
    clearTimeout(flipTimer);
    flipTimer = undefined;
  }
  if (popTimer !== undefined) {
    clearTimeout(popTimer);
    popTimer = undefined;
  }
}

async function toggleMode(): Promise<void> {
  if (!canToggle.value) return;

  clearTimers();
  mode.value = mode.value === 'words' ? 'time' : 'words';

  // Restart CSS animations cleanly (toggle class off → on).
  popping.value = false;
  flipping.value = false;
  await nextTick();
  popping.value = true;
  flipping.value = true;

  popTimer = setTimeout(() => {
    popping.value = false;
    popTimer = undefined;
  }, 420);
  flipTimer = setTimeout(() => {
    flipping.value = false;
    flipTimer = undefined;
  }, 320);
}

onUnmounted(() => clearTimers());
</script>

<template>
  <section
    class="word-share"
    :class="{ 'is-interactive': canToggle }"
    :role="canToggle ? 'button' : undefined"
    :tabindex="canToggle ? 0 : undefined"
    :aria-label="
      canToggle
        ? mode === 'words'
          ? 'Words per person. Click to show talk time.'
          : 'Talk time per person. Click to show words.'
        : mode === 'words'
          ? 'Words per person'
          : 'Talk time per person'
    "
    @click="toggleMode"
    @keydown.enter.prevent="toggleMode"
    @keydown.space.prevent="toggleMode"
  >
    <!-- Motion shell: hover + click scale live here so they don't fight content transforms. -->
    <div
      class="word-share__motion"
      :class="{ 'is-popping': popping, 'is-flipping': flipping }"
    >
      <header class="word-share__header">
        <h3 class="word-share__title">{{ mode === 'words' ? 'Words' : 'Time' }}</h3>
        <p class="word-share__total">{{ formatTotal() }}</p>
      </header>

      <div v-if="hasData" class="word-share__bar" aria-hidden="true">
        <span
          v-for="entry in entries"
          :key="entry.key"
          class="word-share__segment"
          :style="{
            flexGrow: valueOf(entry),
            background: colorFor(entry),
          }"
          :title="`${entry.name}: ${formatValue(entry)}`"
        />
      </div>
      <div v-else class="word-share__bar word-share__bar--empty" aria-hidden="true" />

      <ul class="word-share__legend">
        <li v-for="entry in sortedEntries" :key="entry.key" class="word-share__row">
          <span class="word-share__swatch" :style="{ background: colorFor(entry) }" />
          <span class="word-share__name">{{ entry.name }}</span>
          <span class="word-share__value">{{ formatValue(entry) }}</span>
          <span class="word-share__pct">{{ Math.round(shareOf(entry) * 100) }}%</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.word-share {
  display: block;
  border-radius: var(--radius-xl);
  background: var(--oats-fill-soft);
}

.word-share.is-interactive {
  cursor: pointer;
}

.word-share.is-interactive:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.word-share__motion {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-xl);
  transform: scale(1);
  transform-origin: center center;
  transition: transform var(--duration-moderate) var(--ease-out-expo);
  will-change: transform;
}

.word-share.is-interactive:hover .word-share__motion,
.word-share.is-interactive:focus-visible .word-share__motion {
  transform: scale(1.02);
}

.word-share__motion.is-popping {
  animation: word-share-pop 420ms var(--ease-out-expo);
}

@keyframes word-share-pop {
  0% {
    transform: scale(1.02);
  }
  40% {
    transform: scale(0.965);
  }
  100% {
    transform: scale(1.02);
  }
}

.word-share__motion.is-flipping .word-share__title,
.word-share__motion.is-flipping .word-share__total,
.word-share__motion.is-flipping .word-share__value,
.word-share__motion.is-flipping .word-share__pct {
  animation: word-share-flip 300ms var(--ease-out-expo) both;
}

@keyframes word-share-flip {
  from {
    opacity: 0.35;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.word-share__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
}

.word-share__title {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-xs-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-xs-leading);
  letter-spacing: var(--text-xs-tracking);
  color: var(--color-ink-muted);
}

.word-share__total {
  margin: 0;
  font-size: var(--text-xs-size);
  line-height: var(--text-xs-leading);
  color: var(--color-ink-quiet);
  font-variant-numeric: tabular-nums;
}

.word-share__bar {
  display: flex;
  overflow: hidden;
  width: 100%;
  height: 12px;
  border-radius: var(--radius-pill);
  background: var(--oats-fill-soft-opaque);
}

.word-share__bar--empty {
  opacity: 0.5;
}

.word-share__segment {
  min-width: 0;
  flex-basis: 0;
  transition: flex-grow var(--duration-slow) var(--ease-out-expo);
}

.word-share__segment + .word-share__segment {
  box-shadow: inset 1.5px 0 0 var(--oats-surface);
}

.word-share__legend {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.word-share__row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto auto;
  gap: var(--space-sm);
  align-items: center;
  min-height: 22px;
  padding: 2px 0;
}

.word-share__swatch {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
}

.word-share__name {
  overflow: hidden;
  font-size: var(--text-sm-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-sm-leading);
  color: var(--color-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.word-share__value,
.word-share__pct {
  font-size: var(--text-xs-size);
  line-height: var(--text-xs-leading);
  color: var(--color-ink-muted);
  font-variant-numeric: tabular-nums;
}

.word-share__pct {
  min-width: 2.5em;
  color: var(--color-ink-quiet);
  text-align: right;
}

@media (prefers-reduced-motion: reduce) {
  .word-share__motion {
    transition: none;
  }

  .word-share.is-interactive:hover .word-share__motion,
  .word-share.is-interactive:focus-visible .word-share__motion {
    transform: none;
  }

  .word-share__motion.is-popping,
  .word-share__motion.is-flipping .word-share__title,
  .word-share__motion.is-flipping .word-share__total,
  .word-share__motion.is-flipping .word-share__value,
  .word-share__motion.is-flipping .word-share__pct {
    animation: none;
  }

  .word-share__segment {
    transition: none;
  }
}
</style>
