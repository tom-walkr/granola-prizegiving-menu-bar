/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRANOLA_API_KEY: string | undefined;
  readonly VITE_USE_MOCK_DATA: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
