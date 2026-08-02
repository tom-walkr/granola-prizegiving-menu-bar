<script setup lang="ts">
withDefaults(
  defineProps<{
    /** How many meeting rows to reserve. */
    rows?: number;
  }>(),
  { rows: 4 }
);
</script>

<template>
  <div class="meeting-list-skeleton" aria-busy="true" aria-label="Loading notes">
    <div class="meeting-list-skeleton__date skeleton skeleton--line" />
    <div
      v-for="index in rows"
      :key="index"
      class="meeting-list-skeleton__row"
      :style="{ '--stagger': index - 1 }"
    >
      <span class="skeleton skeleton--avatar" />
      <span class="meeting-list-skeleton__copy">
        <span
          class="skeleton skeleton--line meeting-list-skeleton__title"
          :style="{ width: index % 2 === 0 ? '68%' : '82%' }"
        />
        <span
          class="skeleton skeleton--line meeting-list-skeleton__subtitle"
          :style="{ width: index % 3 === 0 ? '44%' : '58%' }"
        />
      </span>
      <span class="skeleton skeleton--line meeting-list-skeleton__time" />
    </div>
  </div>
</template>

<style scoped>
.meeting-list-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.meeting-list-skeleton__date {
  width: 5.5rem;
  margin: var(--space-base) var(--space-md) var(--space-xs);
}

.meeting-list-skeleton__row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-height: 52px;
  padding: var(--space-sm) var(--space-md);
  animation: skeleton-row-in var(--duration-slow) var(--ease-out-expo) both;
  animation-delay: calc(var(--stagger, 0) * 40ms);
}

.meeting-list-skeleton__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.meeting-list-skeleton__title {
  height: 0.95em;
}

.meeting-list-skeleton__subtitle {
  height: 0.75em;
}

.meeting-list-skeleton__time {
  flex-shrink: 0;
  width: 2.5rem;
  height: 0.75em;
}

@keyframes skeleton-row-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .meeting-list-skeleton__row {
    animation: none;
  }
}
</style>
