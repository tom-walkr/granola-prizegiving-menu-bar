<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted, ref, useTemplateRef } from 'vue';
import AwardsBoard from './components/AwardsBoard.vue';
import NoteSelector from './components/NoteSelector.vue';
import PopoverShell from './components/PopoverShell.vue';

const selectedNoteId = ref<string | null>(null);
const launchAtLogin = ref(false);
const noteSelector = useTemplateRef('noteSelector');

async function onLaunchAtLoginChange(): Promise<void> {
  launchAtLogin.value = await invoke<boolean>('set_launch_at_login', {
    enabled: launchAtLogin.value,
  });
}

onMounted(async () => {
  launchAtLogin.value = await invoke<boolean>('get_launch_at_login');

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
      <h1>Granola Prizegiving</h1>
      <label>
        <input type="checkbox" v-model="launchAtLogin" @change="onLaunchAtLoginChange" />
        Launch at login
      </label>
    </template>

    <NoteSelector ref="noteSelector" @select="selectedNoteId = $event" />
    <AwardsBoard v-if="selectedNoteId" :note-id="selectedNoteId" />
  </PopoverShell>
</template>
