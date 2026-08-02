<script setup lang="ts">
import trophyIcon from '../assets/trophy.svg?raw';
import type { PrizegivingCapability } from '../logic/prizegivingCapability';
import { prizegivingCapabilityLabel } from '../logic/prizegivingCapability';
import MeetingAvatar from './MeetingAvatar.vue';

withDefaults(
  defineProps<{
    title: string;
    subtitle: string;
    time: string;
    initials: string;
    selected?: boolean;
    /** Show the share badge when the note has other attendees. */
    shared?: boolean;
    /**
     * Whether this note can render full AwardCards (`full`), only the
     * you-vs-rest comparison, or nothing. Omit / null while still probing.
     */
    prizegiving?: PrizegivingCapability | null;
  }>(),
  {
    selected: false,
    shared: false,
    prizegiving: null,
  }
);

defineEmits<{ select: [] }>();
</script>

<template>
  <button
    type="button"
    class="meeting-entry"
    :class="{ 'is-selected': selected }"
    :aria-pressed="selected"
    @click="$emit('select')"
  >
    <MeetingAvatar :initials="initials" :shared="shared" />

    <span class="meeting-entry__body">
      <span class="meeting-entry__title">{{ title }}</span>
      <span v-if="subtitle" class="meeting-entry__subtitle">{{ subtitle }}</span>
    </span>

    <span class="meeting-entry__meta">
      <span
        v-if="prizegiving"
        class="meeting-entry__prizegiving"
        :class="`is-${prizegiving}`"
        :title="prizegivingCapabilityLabel(prizegiving)"
        :aria-label="prizegivingCapabilityLabel(prizegiving)"
        v-html="trophyIcon"
      />
      <span class="meeting-entry__time">{{ time }}</span>
    </span>
  </button>
</template>

<style scoped>
.meeting-entry {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border: 0;
  border-radius: var(--radius-xl);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: default;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.meeting-entry:hover,
.meeting-entry:focus-visible {
  background: var(--oats-fill-soft);
}

.meeting-entry:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 1px;
}

.meeting-entry.is-selected,
.meeting-entry.is-selected:hover {
  background: var(--oats-fill-soft-opaque);
}

.meeting-entry__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.meeting-entry__title {
  overflow: hidden;
  font-size: var(--text-md-size);
  font-weight: var(--font-weight-semibold);
  line-height: var(--text-md-leading);
  letter-spacing: var(--text-md-tracking);
  color: var(--color-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-entry__subtitle {
  overflow: hidden;
  font-size: var(--text-sm-size);
  font-weight: var(--font-weight-normal);
  line-height: var(--text-sm-leading);
  letter-spacing: var(--text-sm-tracking);
  color: var(--color-ink-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-entry__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  margin-left: var(--space-sm);
  min-height: 2.4em;
}

.meeting-entry__prizegiving {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
}

.meeting-entry__prizegiving :deep(svg) {
  display: block;
  width: 14px;
  height: 14px;
}

.meeting-entry__prizegiving.is-full {
  color: var(--color-ink-accent-strong);
}

.meeting-entry__prizegiving.is-two-way,
.meeting-entry__prizegiving.is-empty {
  color: var(--color-ink-quiet);
  opacity: 0.45;
}

.meeting-entry__time {
  font-size: var(--text-sm-size);
  font-weight: var(--font-weight-normal);
  line-height: var(--text-sm-leading);
  letter-spacing: var(--text-sm-tracking);
  color: var(--color-ink-muted);
  font-variant-numeric: tabular-nums;
}
</style>
