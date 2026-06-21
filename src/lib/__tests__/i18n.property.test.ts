import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCycleStore } from '../../store/useCycleStore';
import { useSymptomStore } from '../../store/useSymptomStore';
import en from '../../i18n/en';
import es from '../../i18n/es';
import type { Translations } from '../../i18n/index';
import type { Cycle, SymptomLog, FlowLevel, MucusType } from '../../types';

// Feature: menstrual-cycle-tracker, Property 16: Language switching preserves app state
// For any valid application state (cycles, symptoms, settings) and any supported locale
// ('en' or 'es'), switching the locale must:
// (a) update all UI text keys without errors (all defined keys resolve to non-empty strings)
// (b) not modify any user data (cycles, symptoms, notes, tags)
// (c) persist the new locale in AppSettings

// **Validates: Requirements 12.3, 12.4, 12.6**

// === Generators ===

const localeArb = fc.constantFrom<'en' | 'es'>('en', 'es');

const flowLevelArb = fc.constantFrom<FlowLevel>('none', 'light', 'medium', 'heavy', 'spotting');
const mucusTypeArb = fc.constantFrom<MucusType>('dry', 'sticky', 'creamy', 'eggWhite', 'watery');

const physicalSymptomsArb = fc.record({
  cramps: fc.integer({ min: 0, max: 5 }),
  backPain: fc.integer({ min: 0, max: 5 }),
  headache: fc.integer({ min: 0, max: 5 }),
  bloating: fc.integer({ min: 0, max: 5 }),
  breastTenderness: fc.integer({ min: 0, max: 5 }),
  fatigue: fc.integer({ min: 0, max: 5 }),
  nausea: fc.integer({ min: 0, max: 5 }),
  acne: fc.integer({ min: 0, max: 5 }),
});

const emotionalSymptomsArb = fc.record({
  moodSwings: fc.integer({ min: 0, max: 5 }),
  anxiety: fc.integer({ min: 0, max: 5 }),
  sadness: fc.integer({ min: 0, max: 5 }),
  irritability: fc.integer({ min: 0, max: 5 }),
  energy: fc.integer({ min: 0, max: 5 }),
});

const symptomLogArb = fc.record({
  date: fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
    .map(d => d.toISOString().split('T')[0]),
  physical: physicalSymptomsArb,
  emotional: emotionalSymptomsArb,
  hormonal: fc.record({
    flow: flowLevelArb,
    cervicalMucus: mucusTypeArb,
  }),
  libido: fc.integer({ min: 0, max: 5 }),
  appetite: fc.integer({ min: 0, max: 5 }),
  sleep: fc.integer({ min: 0, max: 48 }).map(n => n * 0.5),
  weight: fc.option(fc.double({ min: 30.0, max: 300.0, noNaN: true }), { nil: null }),
  temperature: fc.option(fc.double({ min: 35.0, max: 42.0, noNaN: true }), { nil: null }),
  notes: fc.string({ maxLength: 500 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 10 }),
});

const isoDateArb = fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
  .map(d => d.toISOString().split('T')[0]);

const cycleArb = fc.record({
  id: fc.uuid(),
  startDate: isoDateArb,
  endDate: fc.option(isoDateArb, { nil: null }),
  periodDays: fc.array(isoDateArb, { maxLength: 7 }),
  phases: fc.record({
    menstrual: fc.record({ start: isoDateArb, end: isoDateArb }),
    follicular: fc.record({ start: isoDateArb, end: isoDateArb }),
    ovulation: fc.record({ start: isoDateArb, end: isoDateArb }),
    luteal: fc.record({ start: isoDateArb, end: isoDateArb }),
  }),
  averageCycleLength: fc.integer({ min: 26, max: 30 }),
  periodDuration: fc.integer({ min: 3, max: 7 }),
});

// Generate random app state
const appStateArb = fc.record({
  cycles: fc.array(cycleArb, { minLength: 0, maxLength: 5 }),
  logs: fc.array(symptomLogArb, { minLength: 0, maxLength: 10 }),
  locale: localeArb,
});

// === Helpers ===

/** Recursively collect all leaf string values from a translations object */
function collectAllLeafValues(obj: unknown, prefix = ''): { key: string; value: unknown }[] {
  const results: { key: string; value: unknown }[] = [];
  if (obj === null || obj === undefined) return results;
  if (typeof obj === 'string') {
    results.push({ key: prefix, value: obj });
    return results;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const newPrefix = prefix ? `${prefix}.${k}` : k;
      results.push(...collectAllLeafValues(v, newPrefix));
    }
  }
  return results;
}

/** Resolve a dot-notation key against a translations object */
function resolve(obj: Translations, key: string): string {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return key; // fallback
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : key;
}

// === Tests ===

describe('Property 16: Language switching preserves app state', () => {
  const translations: Record<'en' | 'es', Translations> = { en, es };

  beforeEach(() => {
    // Reset all stores between runs
    localStorage.clear();
    useSettingsStore.setState({
      settings: {
        cycleLengthAvg: 28,
        periodDurationAvg: 5,
        lutealPhaseDays: 14,
        theme: 'light',
        firstDayOfWeek: 1,
        exportFormat: 'json',
        locale: 'es',
      },
      onboardingComplete: false,
      locale: 'es',
    });
    useCycleStore.setState({ cycles: [], activeCycleId: null });
    useSymptomStore.setState({ logs: [] });
  });

  it('(a) all translation keys resolve to non-empty strings for both locales', () => {
    fc.assert(
      fc.property(localeArb, (locale) => {
        const dict = translations[locale];
        const leaves = collectAllLeafValues(dict);

        // Every leaf must be a non-empty string
        for (const { key, value } of leaves) {
          expect(typeof value).toBe('string');
          expect((value as string).length).toBeGreaterThan(0);
          // Also verify the resolve function works for this key
          const resolved = resolve(dict, key);
          expect(resolved).toBe(value);
        }

        // Verify both locales have the same set of keys
        const enKeys = collectAllLeafValues(en).map(l => l.key).sort();
        const esKeys = collectAllLeafValues(es).map(l => l.key).sort();
        expect(enKeys).toEqual(esKeys);
      }),
      { numRuns: 100 }
    );
  });

  it('(b) switching locale does not modify user data (cycles, symptoms, notes, tags)', () => {
    fc.assert(
      fc.property(appStateArb, localeArb, (state, targetLocale) => {
        // Set up initial state with user data
        useCycleStore.setState({ cycles: state.cycles, activeCycleId: null });
        useSymptomStore.setState({ logs: state.logs });
        useSettingsStore.getState().setLocale(state.locale);

        // Snapshot user data before switching
        const cyclesBefore = JSON.parse(JSON.stringify(useCycleStore.getState().cycles));
        const logsBefore = JSON.parse(JSON.stringify(useSymptomStore.getState().logs));

        // Switch locale
        useSettingsStore.getState().setLocale(targetLocale);

        // Verify user data remains unchanged
        const cyclesAfter = useCycleStore.getState().cycles;
        const logsAfter = useSymptomStore.getState().logs;

        expect(cyclesAfter).toEqual(cyclesBefore);
        expect(logsAfter).toEqual(logsBefore);

        // Specifically verify notes and tags are untouched
        for (let i = 0; i < logsAfter.length; i++) {
          expect(logsAfter[i].notes).toBe(logsBefore[i].notes);
          expect(logsAfter[i].tags).toEqual(logsBefore[i].tags);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('(c) switching locale persists the new locale in AppSettings', () => {
    fc.assert(
      fc.property(appStateArb, localeArb, (state, targetLocale) => {
        // Set initial state
        useCycleStore.setState({ cycles: state.cycles, activeCycleId: null });
        useSymptomStore.setState({ logs: state.logs });
        useSettingsStore.getState().setLocale(state.locale);

        // Switch locale
        useSettingsStore.getState().setLocale(targetLocale);

        // Verify locale is persisted in both the store-level locale field and settings.locale
        const settingsState = useSettingsStore.getState();
        expect(settingsState.locale).toBe(targetLocale);
        expect(settingsState.settings.locale).toBe(targetLocale);
      }),
      { numRuns: 100 }
    );
  });
});
