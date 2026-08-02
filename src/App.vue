<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import granolaLogo from './assets/granola-pg-logo.svg';
import settingsCog from './assets/settings-cog.svg?raw';
import AwardsBoard from './components/AwardsBoard.vue';
import NoteSelector from './components/NoteSelector.vue';
import PopoverShell from './components/PopoverShell.vue';
import {
  listenSettingsChanged,
  loadSettings,
  openSettingsWindow,
} from './settings/store';

const selectedNoteId = ref<string | null>(null);
const ready = ref(false);
const noteSelector = useTemplateRef('noteSelector');

let stopSettingsListen: (() => void) | undefined;

onMounted(async () => {
  await loadSettings();
  ready.value = true;

  // Not running inside Tauri (e.g. Storybook, plain `vite` preview) — skip window wiring.
  if (!('__TAURI_INTERNALS__' in window)) return;

  // Transparent canvas so the native Menu vibrancy applied in Rust shows through.
  document.documentElement.dataset.chrome = 'vibrancy';

  await getCurrentWindow().onFocusChanged(({ payload: isFocused }) => {
    if (isFocused) noteSelector.value?.refresh();
  });

  stopSettingsListen = await listenSettingsChanged(() => {
    selectedNoteId.value = null;
    noteSelector.value?.refresh();
  });
});

onUnmounted(() => {
  stopSettingsListen?.();
});

async function onOpenSettings(): Promise<void> {
  await openSettingsWindow();
}
</script>

<template>
  <PopoverShell>
    <template #header>
      <div class="popover-shell__brand-row">
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
        <button
          type="button"
          class="popover-shell__settings"
          aria-label="Open settings"
          title="Settings"
          @click="onOpenSettings"
          v-html="settingsCog"
        />
      </div>
    </template>

    <template v-if="ready">
      <NoteSelector
        ref="noteSelector"
        :selected-id="selectedNoteId"
        @select="selectedNoteId = $event"
      />
      <AwardsBoard v-if="selectedNoteId" :note-id="selectedNoteId" />
    </template>
  </PopoverShell>
</template>
