import { createApp } from 'vue';
import App from './App.vue';
import './styles/tokens.css';
import './styles/base.css';
import './styles/chrome.css';

// Default to flat (opaque parchment) until App detects the Tauri shell.
document.documentElement.dataset.chrome = 'flat';

createApp(App).mount('#app');
