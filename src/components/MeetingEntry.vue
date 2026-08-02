<script setup lang="ts">
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
  }>(),
  {
    selected: false,
    shared: false,
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
  flex-shrink: 0;
  margin-left: var(--space-sm);
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
