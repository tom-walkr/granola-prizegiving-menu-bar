<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <h2 class="meeting-date-header">{{ label }}</h2>
</template>

<style scoped>
.meeting-date-header {
  margin: 0;
  padding: var(--space-base) var(--space-md) var(--space-xs);
  font-family: var(--font-sans);
  font-size: var(--text-xs-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--text-xs-leading);
  letter-spacing: var(--text-xs-tracking);
  color: var(--color-ink-muted);
}
</style>
