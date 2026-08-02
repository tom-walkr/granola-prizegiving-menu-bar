import { createApp } from 'vue';
import App from './App.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import './styles/tokens.css';
import './styles/base.css';
import './styles/chrome.css';

// Default to flat (opaque parchment) until App detects the Tauri shell.
document.documentElement.dataset.chrome = 'flat';

async function boot(): Promise<void> {
  let label = 'popover';
  if ('__TAURI_INTERNALS__' in window) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    label = getCurrentWindow().label;
  }

  if (label === 'settings') {
    createApp(SettingsPanel).mount('#app');
    return;
  }

  createApp(App).mount('#app');
}

void boot();
