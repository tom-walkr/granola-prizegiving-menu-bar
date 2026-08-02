<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted, ref, useTemplateRef } from 'vue';
import granolaLogo from './assets/granola-pg-logo.svg';
import AwardsBoard from './components/AwardsBoard.vue';
import NoteSelector from './components/NoteSelector.vue';
import PopoverShell from './components/PopoverShell.vue';

const selectedNoteId = ref<string | null>(null);
const noteSelector = useTemplateRef('noteSelector');

onMounted(async () => {
  // Not running inside Tauri (e.g. Storybook, plain `vite` preview) — skip window wiring.
  if (!('__TAURI_INTERNALS__' in window)) return;

  // Transparent canvas so the native Menu vibrancy applied in Rust shows through.
  document.documentElement.dataset.chrome = 'vibrancy';

  await getCurrentWindow().onFocusChanged(({ payload: isFocused }) => {
    if (isFocused) noteSelector.value?.refresh();
  });
});
</script>

<template>
  <PopoverShell>
    <template #header>
      <div class="popover-shell__brand">
        <img
          class="popover-shell__logo"
          :src="granolaLogo"
          alt=""
          width="22"
          height="22"
        />
        <h1>Granola Prizegiving</h1>
      </div>
    </template>

    <NoteSelector
      ref="noteSelector"
      :selected-id="selectedNoteId"
      @select="selectedNoteId = $event"
    />
    <AwardsBoard v-if="selectedNoteId" :note-id="selectedNoteId" />
  </PopoverShell>
</template>
