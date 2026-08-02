<script setup lang="ts">
defineProps<{
  label: string;
  youName: string;
  youSeconds: number;
  restName: string;
  restSeconds: number;
}>();

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}
</script>

<template>
  <article class="two-way">
    <p class="two-way__label">{{ label }}</p>
    <div class="two-way__split">
      <div class="two-way__side">
        <span class="two-way__name">{{ youName }}</span>
        <span class="two-way__value">{{ formatDuration(youSeconds) }}</span>
      </div>
      <span class="two-way__vs" aria-hidden="true">vs</span>
      <div class="two-way__side two-way__side--rest">
        <span class="two-way__name">{{ restName }}</span>
        <span class="two-way__value">{{ formatDuration(restSeconds) }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.two-way {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-xl);
  background: var(--oats-fill-soft);
}

.two-way__label {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg-size);
  font-weight: var(--font-weight-normal);
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--color-ink);
}

.two-way__split {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--space-sm);
  align-items: center;
}

.two-way__side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--oats-surface-raised);
}

.two-way__side--rest {
  text-align: right;
}

.two-way__vs {
  font-size: var(--text-xs-size);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-ink-quiet);
}

.two-way__name {
  overflow: hidden;
  font-size: var(--text-sm-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-sm-leading);
  color: var(--color-ink-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.two-way__value {
  font-size: var(--text-md-size);
  font-weight: var(--font-weight-semibold);
  line-height: var(--text-md-leading);
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}

html[data-chrome='vibrancy'] .two-way__side {
  background: var(--oats-fill-soft-opaque);
}
</style>
