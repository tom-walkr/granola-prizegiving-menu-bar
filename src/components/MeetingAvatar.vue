<script setup lang="ts">
defineProps<{
  initials: string;
  /** When true, shows the small share affordance on the avatar corner. */
  shared?: boolean;
}>();
</script>

<template>
  <span class="meeting-avatar" aria-hidden="true">
    <span class="meeting-avatar__face">{{ initials }}</span>
    <span v-if="shared" class="meeting-avatar__badge" title="Shared">
      <svg
        class="meeting-avatar__badge-icon"
        viewBox="0 0 12 12"
        width="10"
        height="10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.5 3.5L4 6l4.5 2.5"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="8.75" cy="3.25" r="1.35" fill="currentColor" />
        <circle cx="8.75" cy="8.75" r="1.35" fill="currentColor" />
        <circle cx="3.25" cy="6" r="1.35" fill="currentColor" />
      </svg>
    </span>
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

.meeting-avatar__badge {
  position: absolute;
  right: -3px;
  bottom: -3px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-pill);
  background: var(--color-oats-neutral-300);
  color: var(--color-oats-white);
  box-shadow: 0 0 0 1.5px var(--oats-surface);
}

.meeting-avatar__badge-icon {
  display: block;
}
</style>
