<script setup lang="ts">
// Chrome root for the tray popover: native Menu vibrancy underneath,
// Granola token overrides (tint, ink) on the header / content slots.
</script>

<template>
  <div class="popover-shell">
    <header class="popover-shell__header">
      <slot name="header" />
    </header>
    <main class="popover-shell__content">
      <slot />
    </main>
  </div>
</template>
