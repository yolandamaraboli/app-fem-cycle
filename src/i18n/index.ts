import { useMemo } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import type { PhysicalSymptoms, EmotionalSymptoms, FlowLevel, MucusType } from '../types';
import en from './en';
import es from './es';

export interface Translations {
  nav: {
    dashboard: string;
    calendar: string;
    dailyLog: string;
    history: string;
    settings: string;
  };
  phases: {
    menstrual: string;
    follicular: string;
    ovulation: string;
    luteal: string;
  };
  symptoms: {
    physical: Record<keyof PhysicalSymptoms, string>;
    emotional: Record<keyof EmotionalSymptoms, string>;
  };
  flow: Record<FlowLevel, string>;
  mucus: Record<MucusType, string>;
  pregnancy: {
    high: string;
    medium: string;
    low: string;
    disclaimer: string;
  };
  dashboard: {
    currentPhase: string;
    cycleDay: string;
    daysRemaining: string;
    pregnancyProbability: string;
    disclaimerLabel: string;
    recommendations: string;
    preventive: string;
    quickStats: string;
    statCycleLength: string;
    statPeriodDuration: string;
    statLutealPhase: string;
    days: string;
    recCategory: {
      physical: string;
      natural: string;
      pharmaceutical: string;
    };
  };
  settings: {
    title: string;
    cycleLength: string;
    cycleLengthHelp: string;
    periodDuration: string;
    periodDurationHelp: string;
    firstDayOfWeek: string;
    sunday: string;
    monday: string;
    exportFormat: string;
    language: string;
    spanish: string;
    english: string;
    dataManagement: string;
    exportData: string;
    importData: string;
    resetDefaults: string;
    resetConfirmTitle: string;
    resetConfirmMessage: string;
    resetConfirm: string;
    importSuccess: string;
    importError: string;
    exportSuccess: string;
    saveSuccess: string;
    validationCycleLength: string;
    validationPeriodDuration: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    export: string;
    import: string;
  };
  errors: Record<string, string>;
  emptyStates: Record<string, string>;
}

const translations: Record<'en' | 'es', Translations> = { en, es };

/**
 * Resolves a dot-notation key against a translations object.
 * Returns the key itself if not found (fallback).
 */
function resolve(obj: Translations, key: string): string {
  const parts = key.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : key;
}

/**
 * Hook that returns the current translation function and locale.
 * Reads locale from useSettingsStore.
 */
export function useTranslation(): { t: (key: string) => string; locale: 'en' | 'es' } {
  const locale = useSettingsStore((state) => state.locale);

  const t = useMemo(() => {
    const dict = translations[locale];
    return (key: string): string => resolve(dict, key);
  }, [locale]);

  return { t, locale };
}

/**
 * Detects the browser language and returns the matching supported locale.
 * Defaults to 'es' if no match is found.
 */
export function detectBrowserLocale(): 'en' | 'es' {
  if (typeof navigator === 'undefined') {
    return 'es';
  }
  const lang = navigator.language?.toLowerCase() ?? '';
  if (lang.startsWith('en')) {
    return 'en';
  }
  return 'es';
}

/**
 * Initializes the locale based on browser language detection.
 * Should be called once on first app load (when no persisted locale preference exists).
 */
export function initLocaleFromBrowser(): void {
  const store = useSettingsStore.getState();
  // Only auto-detect if this is a fresh install (no persisted settings yet)
  // The persist middleware will hydrate the store — if locale was already set, skip detection.
  // We check by seeing if localStorage has our key. If not, it's first load.
  try {
    const persisted = localStorage.getItem('app-settings');
    if (!persisted) {
      const detected = detectBrowserLocale();
      store.setLocale(detected);
    }
  } catch {
    // localStorage not available, keep default
  }
}
