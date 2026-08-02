export type AppSettings = {
  apiKey: string;
  useMockData: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  useMockData: false,
};

/** Seed first-run form fields from Vite env (optional; Storybook / migration). */
export function envSeedSettings(): AppSettings {
  return {
    apiKey: import.meta.env.VITE_GRANOLA_API_KEY?.trim() ?? '',
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  };
}
