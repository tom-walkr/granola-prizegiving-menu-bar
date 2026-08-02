import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/vue3-vite',
  previewHead: (head) => `
    ${head}
    <link rel="stylesheet" href="https://use.typekit.net/jyo7jul.css" />
  `,
  // Storybook always runs against the mock fixtures (src/mocks/notes.ts),
  // regardless of any local .env — no API key or network access needed to
  // browse components in isolation.
  async viteFinal(viteConfig) {
    viteConfig.define = {
      ...viteConfig.define,
      'import.meta.env.VITE_USE_MOCK_DATA': JSON.stringify('true'),
    };
    return viteConfig;
  },
};

export default config;
