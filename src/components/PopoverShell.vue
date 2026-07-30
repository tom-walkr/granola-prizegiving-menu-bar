<script setup lang="ts">
// Layout only: header + content slots for the tray popover window.
// No visual treatment yet — that's the design pass.
</script>

<template>
  <div>
    <header>
      <slot name="header" />
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
