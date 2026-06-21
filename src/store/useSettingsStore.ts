import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types';
import { exportAllData, importData as importStorageData } from '../lib/storage';

const DEFAULT_SETTINGS: AppSettings = {
  cycleLengthAvg: 28,
  periodDurationAvg: 5,
  lutealPhaseDays: 14,
  theme: 'light',
  firstDayOfWeek: 1,
  exportFormat: 'json',
  locale: 'es',
};

interface SettingsStoreState {
  settings: AppSettings;
  onboardingComplete: boolean;
  locale: 'en' | 'es';
}

interface SettingsStoreActions {
  updateSettings: (partial: Partial<AppSettings>) => void;
  completeOnboarding: () => void;
  exportData: (format: 'json' | 'csv') => void;
  importData: (data: string) => { success: boolean; error?: string };
  resetToDefaults: () => void;
  setLocale: (locale: 'en' | 'es') => void;
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // State
      settings: { ...DEFAULT_SETTINGS },
      onboardingComplete: false,
      locale: DEFAULT_SETTINGS.locale,

      // Actions
      updateSettings: (partial: Partial<AppSettings>) => {
        set((state) => {
          const newSettings = { ...state.settings, ...partial };
          return {
            settings: newSettings,
            // Keep locale in sync if it changes through settings
            ...(partial.locale ? { locale: partial.locale } : {}),
          };
        });
      },

      completeOnboarding: () => {
        set({ onboardingComplete: true });
      },

      exportData: (format: 'json' | 'csv') => {
        try {
          exportAllData(format);
        } catch (error) {
          // Handle QuotaExceededError or other errors gracefully
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.error('Export failed: storage quota exceeded');
          } else {
            console.error('Export failed:', error);
          }
        }
      },

      importData: (data: string) => {
        try {
          const result = importStorageData(data);
          if (result.success) {
            // Reload settings from localStorage after import
            const storedSettings = localStorage.getItem('app-settings');
            if (storedSettings) {
              try {
                const parsed = JSON.parse(storedSettings);
                // The persist middleware stores state nested, but importData writes raw settings
                const settings = parsed.state?.settings ?? parsed;
                if (settings && typeof settings === 'object' && 'cycleLengthAvg' in settings) {
                  set({
                    settings: { ...DEFAULT_SETTINGS, ...settings },
                    locale: settings.locale ?? DEFAULT_SETTINGS.locale,
                  });
                }
              } catch {
                // Ignore parse errors, keep current state
              }
            }
          }
          return { success: result.success, error: result.error };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown import error';
          return { success: false, error: message };
        }
      },

      resetToDefaults: () => {
        set({
          settings: { ...DEFAULT_SETTINGS },
          locale: DEFAULT_SETTINGS.locale,
        });
      },

      setLocale: (locale: 'en' | 'es') => {
        set((state) => ({
          locale,
          settings: { ...state.settings, locale },
        }));
      },
    }),
    {
      name: 'app-settings',
      // Handle storage errors gracefully
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
              console.error('Settings persistence failed: storage quota exceeded. Data remains in memory.');
            } else {
              console.error('Settings persistence failed:', error);
            }
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // Silently ignore removal errors
          }
        },
      },
    }
  )
);

export { DEFAULT_SETTINGS };
