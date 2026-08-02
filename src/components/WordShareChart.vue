<script setup lang="ts">
import { computed, ref } from 'vue';
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

const hasData = computed(() => sortedEntries.value.length > 0 && totalValue.value > 0);

function colorFor(index: number): string {
  return DOT_COLORS[index % DOT_COLORS.length];
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

function toggleMode(): void {
  mode.value = mode.value === 'words' ? 'time' : 'words';
}
</script>

<template>
  <section
    class="word-share"
    :aria-label="mode === 'words' ? 'Words per person' : 'Talk time per person'"
  >
    <header class="word-share__header">
      <h3 class="word-share__title">{{ mode === 'words' ? 'Words' : 'Time' }}</h3>
      <p class="word-share__total">{{ formatTotal() }}</p>
    </header>

    <button
      v-if="hasData"
      type="button"
      class="word-share__bar"
      :aria-label="
        mode === 'words'
          ? 'Show talk time share. ' +
            sortedEntries
              .map((entry) => `${entry.name}: ${formatWords(entry.words)} words`)
              .join(', ')
          : 'Show word share. ' +
            sortedEntries
              .map((entry) => `${entry.name}: ${formatTalkDuration(entry.seconds)}`)
              .join(', ')
      "
      @click="toggleMode"
    >
      <span
        v-for="(entry, index) in sortedEntries"
        :key="entry.key"
        class="word-share__segment"
        :style="{
          flexGrow: valueOf(entry),
          background: colorFor(index),
        }"
        :title="`${entry.name}: ${formatValue(entry)}`"
      />
    </button>
    <div v-else class="word-share__bar word-share__bar--empty" aria-hidden="true" />

    <ul class="word-share__legend">
      <li v-for="(entry, index) in sortedEntries" :key="entry.key" class="word-share__row">
        <span class="word-share__swatch" :style="{ background: colorFor(index) }" />
        <span class="word-share__name">{{ entry.name }}</span>
        <span class="word-share__value">{{ formatValue(entry) }}</span>
        <span class="word-share__pct">{{ Math.round(shareOf(entry) * 100) }}%</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.word-share {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-xl);
  background: var(--oats-fill-soft);
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
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--oats-fill-soft-opaque);
  cursor: pointer;
  appearance: none;
}

.word-share__bar:focus-visible {
  outline: 2px solid var(--color-fill-accent);
  outline-offset: 2px;
}

.word-share__bar--empty {
  opacity: 0.5;
}

.word-share__segment {
  min-width: 0;
  flex-basis: 0;
  pointer-events: none;
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
</style>
