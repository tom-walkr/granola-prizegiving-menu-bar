<script setup lang="ts">
withDefaults(
  defineProps<{
    /** How many award cards to reserve (full breakdown uses five). */
    cards?: number;
  }>(),
  { cards: 3 }
);
</script>

<template>
  <div class="awards-skeleton" aria-busy="true" aria-label="Loading awards">
    <section class="awards-skeleton__chart">
      <header class="awards-skeleton__chart-header">
        <span class="skeleton skeleton--line awards-skeleton__chart-title" />
        <span class="skeleton skeleton--line awards-skeleton__chart-total" />
      </header>
      <span class="skeleton skeleton--pill awards-skeleton__bar" />
      <ul class="awards-skeleton__legend">
        <li v-for="index in 3" :key="index" class="awards-skeleton__legend-row">
          <span class="skeleton skeleton--dot" />
          <span
            class="skeleton skeleton--line"
            :style="{ width: index === 1 ? '42%' : index === 2 ? '36%' : '28%' }"
          />
          <span class="skeleton skeleton--line awards-skeleton__legend-value" />
        </li>
      </ul>
    </section>

    <div
      v-for="index in cards"
      :key="index"
      class="awards-skeleton__card"
      :style="{ '--stagger': index - 1 }"
    >
      <header class="awards-skeleton__card-header">
        <span class="skeleton skeleton--dot" />
        <span
          class="skeleton skeleton--line"
          :style="{ width: index % 2 === 0 ? '38%' : '48%' }"
        />
      </header>
      <div class="awards-skeleton__card-body">
        <span class="skeleton skeleton--avatar" />
        <span class="awards-skeleton__card-copy">
          <span class="skeleton skeleton--line awards-skeleton__winner" />
          <span class="skeleton skeleton--line awards-skeleton__value" />
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.awards-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--stack-gap);
  min-width: 0;
}

.awards-skeleton__chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-xl);
  background: var(--oats-fill-soft);
}

.awards-skeleton__chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.awards-skeleton__chart-title {
  width: 3.5rem;
  height: 0.75em;
}

.awards-skeleton__chart-total {
  width: 4.5rem;
  height: 0.75em;
}

.awards-skeleton__bar {
  width: 100%;
}

.awards-skeleton__legend {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.awards-skeleton__legend-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  gap: var(--space-sm);
  align-items: center;
  min-height: 22px;
  padding: 2px 0;
}

.awards-skeleton__legend-value {
  width: 2.75rem;
}

.awards-skeleton__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-xl);
  background: var(--oats-surface-raised);
  box-shadow: inset 0 0 0 1px var(--color-border);
  animation: awards-skeleton-in var(--duration-slow) var(--ease-out-expo) both;
  animation-delay: calc(var(--stagger, 0) * 40ms);
}

.awards-skeleton__card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.awards-skeleton__card-body {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.awards-skeleton__card-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.awards-skeleton__winner {
  width: 55%;
  height: 0.95em;
}

.awards-skeleton__value {
  width: 28%;
  height: 0.75em;
}

@keyframes awards-skeleton-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

html[data-chrome='vibrancy'] .awards-skeleton__card {
  background: var(--oats-fill-soft);
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .awards-skeleton__card {
    animation: none;
  }
}
</style>
