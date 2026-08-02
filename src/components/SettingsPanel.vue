<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  closeSettingsWindow,
  loadSettings,
  saveSettings,
} from '../settings/store';
import type { AppSettings } from '../settings/types';

const draft = ref<AppSettings>({ apiKey: '', useMockData: false });
const saving = ref(false);
const error = ref<string | null>(null);
const showKey = ref(false);

const canSave = computed(() => {
  if (draft.value.useMockData) return true;
  return draft.value.apiKey.trim().length > 0;
});

const hint = computed(() => {
  if (draft.value.useMockData) return 'Mock fixtures will be used instead of the live API.';
  if (!draft.value.apiKey.trim()) return 'Add an API key, or turn on mock data.';
  return 'Requests go to public-api.granola.ai with your key.';
});

onMounted(async () => {
  document.documentElement.dataset.chrome = 'flat';
  draft.value = await loadSettings();
});

watch(
  () => draft.value.useMockData,
  (mock) => {
    if (mock) error.value = null;
  }
);

async function onCancel(): Promise<void> {
  await closeSettingsWindow();
}

async function onSave(): Promise<void> {
  if (!canSave.value || saving.value) return;
  saving.value = true;
  error.value = null;
  try {
    await saveSettings(draft.value);
    await closeSettingsWindow();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Couldn’t save settings.';
  } finally {
    saving.value = false;
  }
}

function selectLive(): void {
  draft.value.useMockData = false;
}

function selectMock(): void {
  draft.value.useMockData = true;
}
</script>

<template>
  <div class="settings-window">
    <header class="settings-window__header">
      <h1 class="settings-window__title">Settings</h1>
      <button
        type="button"
        class="settings-window__close"
        aria-label="Close settings"
        @click="onCancel"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2.1 2.1l7.8 7.8M9.9 2.1L2.1 9.9"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </header>

    <p class="settings-window__intro">
      Choose how Prizegiving loads meeting notes — live from your Granola workspace, or
      from local mock fixtures.
      <a
        class="settings-window__link"
        href="https://docs.granola.ai"
        target="_blank"
        rel="noreferrer"
      >Learn more</a>
    </p>

    <div class="settings-window__cards" role="radiogroup" aria-label="Data source">
      <button
        type="button"
        class="settings-card"
        :class="{ 'settings-card--selected': !draft.useMockData }"
        role="radio"
        :aria-checked="!draft.useMockData"
        @click="selectLive"
      >
        <span class="settings-card__check" aria-hidden="true">
          <span v-if="!draft.useMockData" class="settings-card__check-mark" />
        </span>
        <span class="settings-card__body">
          <span class="settings-card__title">Live Granola API</span>
          <ul class="settings-card__list">
            <li>Uses your personal Granola API key</li>
            <li>Loads real notes and transcripts</li>
            <li>Requires network access</li>
          </ul>
        </span>
      </button>

      <button
        type="button"
        class="settings-card"
        :class="{ 'settings-card--selected': draft.useMockData }"
        role="radio"
        :aria-checked="draft.useMockData"
        @click="selectMock"
      >
        <span class="settings-card__check" aria-hidden="true">
          <span v-if="draft.useMockData" class="settings-card__check-mark" />
        </span>
        <span class="settings-card__body">
          <span class="settings-card__title">Mock data</span>
          <ul class="settings-card__list">
            <li>Built-in fixture notes (no API key)</li>
            <li>Useful for Storybook-style demos</li>
            <li>Works fully offline</li>
          </ul>
        </span>
      </button>
    </div>

    <div v-if="!draft.useMockData" class="settings-window__field">
      <label class="settings-window__label" for="api-key">API key</label>
      <div class="settings-window__input-row">
        <input
          id="api-key"
          class="settings-window__input"
          :type="showKey ? 'text' : 'password'"
          name="api-key"
          autocomplete="off"
          spellcheck="false"
          placeholder="grn_…"
          :value="draft.apiKey"
          @input="draft.apiKey = ($event.target as HTMLInputElement).value"
        />
        <button
          type="button"
          class="settings-window__ghost-btn"
          @click="showKey = !showKey"
        >
          {{ showKey ? 'Hide' : 'Show' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="settings-window__error" role="alert">{{ error }}</p>

    <footer class="settings-window__footer">
      <p class="settings-window__hint">{{ hint }}</p>
      <div class="settings-window__actions">
        <button type="button" class="settings-btn settings-btn--ghost" @click="onCancel">
          Cancel
        </button>
        <button
          type="button"
          class="settings-btn settings-btn--primary"
          :disabled="!canSave || saving"
          @click="onSave"
        >
          {{ saving ? 'Saving…' : 'Save settings' }}
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.settings-window {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  min-height: 100vh;
  padding: var(--space-2xl);
  background: var(--color-oats-neutral-100);
  color: var(--color-ink);
  font-family: var(--font-sans);
}

.settings-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.settings-window__title {
  margin: 0;
  font-size: var(--text-heading-sm-size);
  font-weight: var(--font-weight-semibold);
  line-height: var(--text-heading-sm-leading);
  letter-spacing: var(--text-heading-sm-tracking);
  color: var(--color-oats-neutral-900);
}

.settings-window__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-oats-neutral-500);
  cursor: pointer;
}

.settings-window__close:hover {
  background: var(--color-oats-off-black-a6);
  color: var(--color-oats-neutral-800);
}

.settings-window__intro {
  margin: 0;
  font-size: var(--text-md-size);
  line-height: 1.45;
  color: var(--color-oats-neutral-600);
}

.settings-window__link {
  color: inherit;
  text-underline-offset: 2px;
}

.settings-window__cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.settings-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  width: 100%;
  margin: 0;
  padding: var(--space-lg);
  border: 1px solid var(--color-oats-neutral-200);
  border-radius: var(--radius-xl);
  background: var(--color-oats-white);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.settings-card:hover {
  border-color: var(--color-oats-neutral-300);
}

.settings-card--selected {
  border-color: var(--color-oats-green-400);
  box-shadow: 0 0 0 1px var(--color-oats-green-400);
}

.settings-card__check {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border: 1.5px solid var(--color-oats-neutral-300);
  border-radius: 5px;
  background: var(--color-oats-white);
}

.settings-card--selected .settings-card__check {
  border-color: var(--color-oats-green-500);
  background: var(--color-oats-green-500);
}

.settings-card__check-mark {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--color-oats-white);
}

.settings-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 0;
}

.settings-card__title {
  font-size: var(--text-md-size);
  font-weight: var(--font-weight-semibold);
  line-height: var(--text-md-leading);
  color: var(--color-oats-neutral-900);
}

.settings-card__list {
  margin: 0;
  padding-left: 1.1em;
  font-size: var(--text-sm-size);
  line-height: 1.45;
  color: var(--color-oats-neutral-500);
}

.settings-card__list li + li {
  margin-top: 2px;
}

.settings-window__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.settings-window__label {
  font-size: var(--text-sm-size);
  font-weight: var(--font-weight-medium);
  color: var(--color-oats-neutral-700);
}

.settings-window__input-row {
  display: flex;
  gap: var(--space-sm);
}

.settings-window__input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 var(--space-md);
  border: 1px solid var(--color-oats-neutral-200);
  border-radius: var(--radius-lg);
  background: var(--color-oats-white);
  color: var(--color-oats-neutral-900);
  font: inherit;
  font-size: var(--text-md-size);
  font-family: var(--font-mono);
}

.settings-window__input:focus {
  outline: none;
  border-color: var(--color-oats-green-400);
  box-shadow: var(--shadow-focus-ring);
}

.settings-window__ghost-btn {
  flex-shrink: 0;
  height: 40px;
  padding: 0 var(--space-md);
  border: 1px solid var(--color-oats-neutral-200);
  border-radius: var(--radius-pill);
  background: var(--color-oats-white);
  color: var(--color-oats-neutral-700);
  font: inherit;
  font-size: var(--text-sm-size);
  cursor: pointer;
}

.settings-window__ghost-btn:hover {
  background: var(--color-oats-neutral-50);
}

.settings-window__error {
  margin: 0;
  font-size: var(--text-sm-size);
  color: var(--color-oats-red-400);
}

.settings-window__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-top: auto;
  padding-top: var(--space-md);
}

.settings-window__hint {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm-size);
  line-height: 1.35;
  color: var(--color-oats-neutral-500);
}

.settings-window__actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-sm);
}

.settings-btn {
  height: 36px;
  padding: 0 var(--space-lg);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: var(--text-sm-size);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.settings-btn--ghost {
  border: 1px solid var(--color-oats-neutral-300);
  background: var(--color-oats-white);
  color: var(--color-oats-neutral-800);
}

.settings-btn--ghost:hover {
  background: var(--color-oats-neutral-50);
}

.settings-btn--primary {
  border: 0;
  background: var(--color-oats-green-500);
  color: var(--color-oats-white);
}

.settings-btn--primary:hover:not(:disabled) {
  background: var(--color-oats-green-600);
}

.settings-btn--primary:disabled {
  background: var(--color-oats-neutral-300);
  color: var(--color-oats-white);
  cursor: not-allowed;
}
</style>
