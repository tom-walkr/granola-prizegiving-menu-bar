<script setup lang="ts">
import { computed } from 'vue';
import type { AwardId } from '../logic/awards';
import { initialsFromTitle } from '../logic/meetingDisplay';
import MeetingAvatar from './MeetingAvatar.vue';

const props = defineProps<{
  awardId: AwardId;
  title: string;
  winnerName: string;
  metric: string;
}>();

const initials = computed(() => initialsFromTitle(props.winnerName));
</script>

<template>
  <article class="award-card" :data-award="awardId">
    <header class="award-card__header">
      <span class="award-card__mark" aria-hidden="true" />
      <h3 class="award-card__title">{{ title }}</h3>
    </header>

    <div class="award-card__body">
      <MeetingAvatar :initials="initials" />
      <div class="award-card__copy">
        <p class="award-card__winner">{{ winnerName }}</p>
        <p class="award-card__value">{{ metric }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.award-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-xl);
  background: var(--oats-surface-raised);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.award-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.award-card__mark {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--award-accent, var(--color-dot-olive));
}

.award-card__title {
  margin: 0;
  overflow: hidden;
  font-family: var(--font-sans);
  font-size: var(--text-xs-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-xs-leading);
  letter-spacing: var(--text-xs-tracking);
  color: var(--color-ink-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.award-card__body {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.award-card__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.award-card__winner {
  margin: 0;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: var(--text-md-size);
  font-weight: var(--font-weight-normal);
  line-height: var(--text-md-leading);
  letter-spacing: var(--text-md-tracking);
  color: var(--color-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.award-card__value {
  margin: 0;
  font-size: var(--text-sm-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-sm-leading);
  color: var(--award-accent-ink, var(--color-ink-accent-strong));
  font-variant-numeric: tabular-nums;
}

.award-card[data-award='longest-monologue'] {
  --award-accent: var(--color-dot-gold);
  --award-accent-ink: var(--color-oats-gold-400);
}

.award-card[data-award='quietest-everywhere'] {
  --award-accent: var(--color-dot-blue);
  --award-accent-ink: var(--color-oats-blue-400);
}

.award-card[data-award='chatterbox'] {
  --award-accent: var(--color-dot-olive);
  --award-accent-ink: var(--color-ink-accent-strong);
}

.award-card[data-award='fastest-talker'] {
  --award-accent: var(--color-dot-amber);
  --award-accent-ink: var(--color-oats-yellow-400);
}

.award-card[data-award='most-interruptions'] {
  --award-accent: var(--color-dot-coral);
  --award-accent-ink: var(--color-ink-danger);
}

/* Vibrancy: raised fill would paint opaque — use soft wash instead. */
html[data-chrome='vibrancy'] .award-card {
  background: var(--oats-fill-soft);
  box-shadow: none;
}
</style>
