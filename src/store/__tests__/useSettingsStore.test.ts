import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, DEFAULT_SETTINGS } from '../useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    localStorage.clear();
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS },
      onboardingComplete: false,
      locale: DEFAULT_SETTINGS.locale,
    });
  });

  describe('default state', () => {
    it('should have correct default settings', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.cycleLengthAvg).toBe(28);
      expect(state.settings.periodDurationAvg).toBe(5);
      expect(state.settings.lutealPhaseDays).toBe(14);
      expect(state.settings.theme).toBe('light');
      expect(state.settings.firstDayOfWeek).toBe(1);
      expect(state.settings.exportFormat).toBe('json');
      expect(state.settings.locale).toBe('es');
    });

    it('should have onboardingComplete as false by default', () => {
      const state = useSettingsStore.getState();
      expect(state.onboardingComplete).toBe(false);
    });

    it('should have locale matching default settings locale', () => {
      const state = useSettingsStore.getState();
      expect(state.locale).toBe('es');
    });
  });

  describe('updateSettings', () => {
    it('should update partial settings', () => {
      useSettingsStore.getState().updateSettings({ cycleLengthAvg: 30 });
      const state = useSettingsStore.getState();
      expect(state.settings.cycleLengthAvg).toBe(30);
      // Other settings remain unchanged
      expect(state.settings.periodDurationAvg).toBe(5);
      expect(state.settings.theme).toBe('light');
    });

    it('should update multiple settings at once', () => {
      useSettingsStore.getState().updateSettings({
        cycleLengthAvg: 26,
        periodDurationAvg: 7,
        theme: 'dark',
      });
      const state = useSettingsStore.getState();
      expect(state.settings.cycleLengthAvg).toBe(26);
      expect(state.settings.periodDurationAvg).toBe(7);
      expect(state.settings.theme).toBe('dark');
    });

    it('should sync locale when updating settings.locale', () => {
      useSettingsStore.getState().updateSettings({ locale: 'en' });
      const state = useSettingsStore.getState();
      expect(state.settings.locale).toBe('en');
      expect(state.locale).toBe('en');
    });
  });

  describe('completeOnboarding', () => {
    it('should set onboardingComplete to true', () => {
      useSettingsStore.getState().completeOnboarding();
      expect(useSettingsStore.getState().onboardingComplete).toBe(true);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all settings to defaults', () => {
      // First change some settings
      useSettingsStore.getState().updateSettings({
        cycleLengthAvg: 30,
        theme: 'dark',
        locale: 'en',
      });
      // Then reset
      useSettingsStore.getState().resetToDefaults();
      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
      expect(state.locale).toBe(DEFAULT_SETTINGS.locale);
    });
  });

  describe('setLocale', () => {
    it('should update locale and settings.locale', () => {
      useSettingsStore.getState().setLocale('en');
      const state = useSettingsStore.getState();
      expect(state.locale).toBe('en');
      expect(state.settings.locale).toBe('en');
    });

    it('should switch back to es', () => {
      useSettingsStore.getState().setLocale('en');
      useSettingsStore.getState().setLocale('es');
      const state = useSettingsStore.getState();
      expect(state.locale).toBe('es');
      expect(state.settings.locale).toBe('es');
    });
  });

  describe('importData', () => {
    it('should return error for invalid JSON', () => {
      const result = useSettingsStore.getState().importData('not json');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for missing required fields', () => {
      const result = useSettingsStore.getState().importData(JSON.stringify({ foo: 'bar' }));
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should successfully import valid data', () => {
      const validData = {
        cycles: [],
        symptoms: [],
        settings: {
          cycleLengthAvg: 26,
          periodDurationAvg: 4,
          lutealPhaseDays: 14,
          theme: 'dark',
          firstDayOfWeek: 0,
          exportFormat: 'csv',
          locale: 'en',
        },
      };
      const result = useSettingsStore.getState().importData(JSON.stringify(validData));
      expect(result.success).toBe(true);
    });
  });

  describe('persist middleware', () => {
    it('should use "app-settings" as the persist key', () => {
      // Trigger a state change to persist
      useSettingsStore.getState().updateSettings({ theme: 'dark' });
      const stored = localStorage.getItem('app-settings');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.settings.theme).toBe('dark');
    });
  });
});
