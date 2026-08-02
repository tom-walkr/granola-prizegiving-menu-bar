import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Must match `build.devUrl` in src-tauri/tauri.conf.json (npm run dev → tray webview).
const TAURI_DEV_PORT = 1420;

export default defineConfig({
  plugins: [vue()],
  server: {
    port: TAURI_DEV_PORT,
    strictPort: true,
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
});
