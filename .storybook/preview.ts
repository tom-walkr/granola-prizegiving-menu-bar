import type { Preview } from '@storybook/vue3-vite'
import '../src/styles/tokens.css'
import '../src/styles/base.css'
import '../src/styles/chrome.css'

// Storybook has no NSVisualEffectView — keep the opaque parchment canvas.
if (typeof document !== 'undefined') {
  document.documentElement.dataset.chrome = 'flat'
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        parchment: { name: 'Parchment', value: '#f7f7f2' },
        raised: { name: 'Raised', value: '#ffffff' },
        sunken: { name: 'Sunken', value: '#f2f2ec' },
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  initialGlobals: {
    backgrounds: { value: 'parchment' },
  },
};

export default preview;