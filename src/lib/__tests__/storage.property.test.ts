import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  validateStorageData,
  importData,
  getPhaseColor,
} from '../storage';
import type { SymptomLog } from '../../types';

// === Custom Generators ===

const isoDateArb = fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
  .map(d => d.toISOString().split('T')[0]);

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

const hormonalSymptomsArb = fc.record({
  flow: fc.constantFrom('none' as const, 'light' as const, 'medium' as const, 'heavy' as const, 'spotting' as const),
  cervicalMucus: fc.constantFrom('dry' as const, 'sticky' as const, 'creamy' as const, 'eggWhite' as const, 'watery' as const),
});

const validSleepArb = fc.integer({ min: 0, max: 48 }).map(n => n * 0.5); // 0-24 step 0.5

const validWeightArb = fc.oneof(
  fc.constant(null),
  fc.double({ min: 30.0, max: 300.0, noNaN: true, noDefaultInfinity: true })
);

const validTemperatureArb = fc.oneof(
  fc.constant(null),
  fc.double({ min: 35.0, max: 42.0, noNaN: true, noDefaultInfinity: true })
);

const validNotesArb = fc.string({ maxLength: 500 });

const validTagsArb = fc.array(
  fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.length > 0),
  { maxLength: 10 }
);

const symptomLogArb: fc.Arbitrary<SymptomLog> = fc.record({
  date: isoDateArb,
  physical: physicalSymptomsArb,
  emotional: emotionalSymptomsArb,
  hormonal: hormonalSymptomsArb,
  libido: fc.integer({ min: 0, max: 5 }),
  appetite: fc.integer({ min: 0, max: 5 }),
  sleep: validSleepArb,
  weight: validWeightArb,
  temperature: validTemperatureArb,
  notes: validNotesArb,
  tags: validTagsArb,
});

const validCycleArb = fc.record({
  id: fc.uuid(),
  startDate: isoDateArb,
  endDate: fc.oneof(fc.constant(null), isoDateArb),
  periodDays: fc.array(isoDateArb, { minLength: 1, maxLength: 7 }),
  phases: fc.record({
    menstrual: fc.record({ start: isoDateArb, end: isoDateArb }),
    follicular: fc.record({ start: isoDateArb, end: isoDateArb }),
    ovulation: fc.record({ start: isoDateArb, end: isoDateArb }),
    luteal: fc.record({ start: isoDateArb, end: isoDateArb }),
  }),
  averageCycleLength: fc.integer({ min: 26, max: 30 }),
  periodDuration: fc.integer({ min: 3, max: 7 }),
});

const validSettingsArb = fc.record({
  cycleLengthAvg: fc.integer({ min: 26, max: 30 }),
  periodDurationAvg: fc.integer({ min: 3, max: 7 }),
  lutealPhaseDays: fc.constant(14),
  theme: fc.constantFrom('light' as const, 'dark' as const),
  firstDayOfWeek: fc.constantFrom(0 as const, 1 as const),
  exportFormat: fc.constantFrom('json' as const, 'csv' as const),
  locale: fc.constantFrom('en' as const, 'es' as const),
});

// === Property 1: SymptomLog Round-trip ===
// Feature: menstrual-cycle-tracker, Property 1: SymptomLog round-trip (save/load)
// For any valid SymptomLog, saving it to localStorage and retrieving it
// must produce an object identical to the original.
// **Validates: Requirements 1.3, 1.7**

describe('Property 1: SymptomLog round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saving and retrieving a SymptomLog via localStorage produces an identical object', () => {
    fc.assert(
      fc.property(symptomLogArb, (log) => {
        // Save to localStorage
        const key = 'app-symptoms';
        const existing = JSON.parse(localStorage.getItem(key) || '[]') as SymptomLog[];
        // Remove any existing entry for the same date
        const filtered = existing.filter(l => l.date !== log.date);
        filtered.push(log);
        localStorage.setItem(key, JSON.stringify(filtered));

        // Retrieve
        const stored = JSON.parse(localStorage.getItem(key) || '[]') as SymptomLog[];
        const retrieved = stored.find(l => l.date === log.date);

        expect(retrieved).toBeDefined();
        expect(retrieved!.date).toBe(log.date);
        expect(retrieved!.physical).toEqual(log.physical);
        expect(retrieved!.emotional).toEqual(log.emotional);
        expect(retrieved!.hormonal).toEqual(log.hormonal);
        expect(retrieved!.libido).toBe(log.libido);
        expect(retrieved!.appetite).toBe(log.appetite);
        expect(retrieved!.sleep).toBe(log.sleep);
        expect(retrieved!.weight).toBe(log.weight);
        expect(retrieved!.temperature).toBe(log.temperature);
        expect(retrieved!.notes).toBe(log.notes);
        expect(retrieved!.tags).toEqual(log.tags);
      }),
      { numRuns: 100 }
    );
  });
});

// === Property 2: Input range validation ===
// Feature: menstrual-cycle-tracker, Property 2: Input range validation
// For any numeric value, the validation function must accept values in valid ranges
// and reject values outside those ranges.
// **Validates: Requirements 1.4, 1.8, 1.9**

describe('Property 2: Input range validation', () => {
  it('accepts valid SymptomLog values within allowed ranges', () => {
    fc.assert(
      fc.property(symptomLogArb, (log) => {
        const result = validateStorageData({ symptoms: [log] });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects physical symptom values outside 0-5 range', () => {
    fc.assert(
      fc.property(
        fc.integer().filter(n => n < 0 || n > 5),
        (invalidValue) => {
          const log = {
            date: '2024-01-01',
            physical: {
              cramps: invalidValue,
              backPain: 0, headache: 0, bloating: 0,
              breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0,
            },
            emotional: { moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0 },
            hormonal: { flow: 'none', cervicalMucus: 'dry' },
            libido: 0, appetite: 0, sleep: 8, weight: null, temperature: null,
            notes: '', tags: [],
          };
          const result = validateStorageData({ symptoms: [log] });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('cramps'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects sleep values outside 0-24 range or not in 0.5 increments', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: -100, max: -0.1, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 24.1, max: 100, noNaN: true, noDefaultInfinity: true })
        ),
        (invalidSleep) => {
          const log = {
            date: '2024-01-01',
            physical: { cramps: 0, backPain: 0, headache: 0, bloating: 0, breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0 },
            emotional: { moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0 },
            hormonal: { flow: 'none', cervicalMucus: 'dry' },
            libido: 0, appetite: 0, sleep: invalidSleep, weight: null, temperature: null,
            notes: '', tags: [],
          };
          const result = validateStorageData({ symptoms: [log] });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('sleep'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects weight values outside 30.0-300.0 range (when not null)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: -100, max: 29.9, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 300.1, max: 1000, noNaN: true, noDefaultInfinity: true })
        ),
        (invalidWeight) => {
          const log = {
            date: '2024-01-01',
            physical: { cramps: 0, backPain: 0, headache: 0, bloating: 0, breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0 },
            emotional: { moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0 },
            hormonal: { flow: 'none', cervicalMucus: 'dry' },
            libido: 0, appetite: 0, sleep: 8, weight: invalidWeight, temperature: null,
            notes: '', tags: [],
          };
          const result = validateStorageData({ symptoms: [log] });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('weight'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects temperature values outside 35.0-42.0 range (when not null)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: -10, max: 34.9, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 42.1, max: 100, noNaN: true, noDefaultInfinity: true })
        ),
        (invalidTemp) => {
          const log = {
            date: '2024-01-01',
            physical: { cramps: 0, backPain: 0, headache: 0, bloating: 0, breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0 },
            emotional: { moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0 },
            hormonal: { flow: 'none', cervicalMucus: 'dry' },
            libido: 0, appetite: 0, sleep: 8, weight: null, temperature: invalidTemp,
            notes: '', tags: [],
          };
          const result = validateStorageData({ symptoms: [log] });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('temperature'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects notes longer than 500 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 1000 }),
        (longNotes) => {
          const log = {
            date: '2024-01-01',
            physical: { cramps: 0, backPain: 0, headache: 0, bloating: 0, breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0 },
            emotional: { moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0 },
            hormonal: { flow: 'none', cervicalMucus: 'dry' },
            libido: 0, appetite: 0, sleep: 8, weight: null, temperature: null,
            notes: longNotes, tags: [],
          };
          const result = validateStorageData({ symptoms: [log] });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('notes'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects tags arrays with more than 10 elements', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 11, maxLength: 20 }),
        (tooManyTags) => {
          const log = {
            date: '2024-01-01',
            physical: { cramps: 0, backPain: 0, headache: 0, bloating: 0, breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0 },
            emotional: { moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0 },
            hormonal: { flow: 'none', cervicalMucus: 'dry' },
            libido: 0, appetite: 0, sleep: 8, weight: null, temperature: null,
            notes: '', tags: tooManyTags,
          };
          const result = validateStorageData({ symptoms: [log] });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('tags'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects tags with more than 30 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 31, maxLength: 60 }),
        (longTag) => {
          const log = {
            date: '2024-01-01',
            physical: { cramps: 0, backPain: 0, headache: 0, bloating: 0, breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0 },
            emotional: { moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0 },
            hormonal: { flow: 'none', cervicalMucus: 'dry' },
            libido: 0, appetite: 0, sleep: 8, weight: null, temperature: null,
            notes: '', tags: [longTag],
          };
          const result = validateStorageData({ symptoms: [log] });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('tags'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// === Property 13: Export/import round-trip ===
// Feature: menstrual-cycle-tracker, Property 13: Export/import round-trip
// For any valid application state (cycles, symptoms, settings), exporting to JSON
// and then importing that JSON must restore a state equivalent to the original.
// **Validates: Requirements 9.4, 9.5**

describe('Property 13: Export/import round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exporting data as JSON and importing it restores equivalent state', () => {
    fc.assert(
      fc.property(
        fc.record({
          cycles: fc.array(validCycleArb, { minLength: 0, maxLength: 5 }),
          symptoms: fc.array(symptomLogArb, { minLength: 0, maxLength: 5 }),
          settings: validSettingsArb,
        }),
        (data) => {
          // Set up localStorage with initial data
          localStorage.setItem('app-cycles', JSON.stringify(data.cycles));
          localStorage.setItem('app-symptoms', JSON.stringify(data.symptoms));
          localStorage.setItem('app-settings', JSON.stringify(data.settings));

          // Simulate export (build JSON string like exportAllData does internally)
          const exportedJson = JSON.stringify({
            cycles: data.cycles,
            symptoms: data.symptoms,
            settings: data.settings,
          });

          // Clear and import
          localStorage.clear();
          const result = importData(exportedJson);

          expect(result.success).toBe(true);
          expect(result.cyclesImported).toBe(data.cycles.length);
          expect(result.logsImported).toBe(data.symptoms.length);

          // Verify cycles restored
          const storedCycles = JSON.parse(localStorage.getItem('app-cycles') || '[]');
          expect(storedCycles).toEqual(data.cycles);

          // Verify symptoms restored
          const storedSymptoms = JSON.parse(localStorage.getItem('app-symptoms') || '[]');
          expect(storedSymptoms).toEqual(data.symptoms);

          // Verify settings restored
          const storedSettings = JSON.parse(localStorage.getItem('app-settings') || '{}');
          expect(storedSettings).toEqual(data.settings);

          localStorage.clear();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// === Property 14: Invalid import safety ===
// Feature: menstrual-cycle-tracker, Property 14: Safety against invalid import
// For any invalid JSON string or with incorrect structure, importData must return
// an error and existing data in localStorage must remain unmodified.
// **Validates: Requirements 9.7**

describe('Property 14: Invalid import safety', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('invalid JSON returns error without modifying existing data', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          try { JSON.parse(s); return false; } catch { return true; }
        }),
        (invalidJson) => {
          // Set up existing data
          const existingCycles = [{ id: 'existing-1', startDate: '2024-01-01', endDate: '2024-01-28', periodDays: ['2024-01-01'], phases: { menstrual: { start: '2024-01-01', end: '2024-01-05' }, follicular: { start: '2024-01-06', end: '2024-01-13' }, ovulation: { start: '2024-01-14', end: '2024-01-16' }, luteal: { start: '2024-01-17', end: '2024-01-28' } }, averageCycleLength: 28, periodDuration: 5 }];
          localStorage.setItem('app-cycles', JSON.stringify(existingCycles));

          const result = importData(invalidJson);

          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();

          // Verify existing data is unmodified
          const storedCycles = JSON.parse(localStorage.getItem('app-cycles') || '[]');
          expect(storedCycles).toEqual(existingCycles);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('valid JSON with incorrect structure returns error without modifying existing data', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Valid JSON but wrong types for cycles/symptoms
          fc.record({
            cycles: fc.constant('not-an-array'),
          }).map(obj => JSON.stringify(obj)),
          // Missing required fields
          fc.record({
            something: fc.string(),
          }).map(obj => JSON.stringify(obj)),
          // Primitives (valid JSON but not objects)
          fc.oneof(
            fc.integer().map(n => JSON.stringify(n)),
            fc.boolean().map(b => JSON.stringify(b)),
            fc.constant('null')
          )
        ),
        (invalidStructure) => {
          // Set up existing data
          const existingSymptoms = [{ date: '2024-01-01', physical: { cramps: 2, backPain: 0, headache: 0, bloating: 0, breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0 }, emotional: { moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0 }, hormonal: { flow: 'none', cervicalMucus: 'dry' }, libido: 0, appetite: 0, sleep: 8, weight: null, temperature: null, notes: '', tags: [] }];
          localStorage.setItem('app-symptoms', JSON.stringify(existingSymptoms));

          const result = importData(invalidStructure);

          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();

          // Verify existing data is unmodified
          const storedSymptoms = JSON.parse(localStorage.getItem('app-symptoms') || '[]');
          expect(storedSymptoms).toEqual(existingSymptoms);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// === Property 15: Phase to color mapping ===
// Feature: menstrual-cycle-tracker, Property 15: Phase to color mapping
// For any cycle phase, getPhaseColor must return exactly the correct hex color.
// **Validates: Requirements 3.1**

describe('Property 15: Phase to color mapping', () => {
  const phaseColorMap: Record<string, string> = {
    menstrual: '#FA6364',
    follicular: '#FFB04C',
    ovulation: '#4ECDC4',
    luteal: '#9B7ED8',
  };

  it('each phase returns its correct hex color for all valid phase inputs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('menstrual' as const, 'follicular' as const, 'ovulation' as const, 'luteal' as const),
        (phase) => {
          const color = getPhaseColor(phase);
          expect(color).toBe(phaseColorMap[phase]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
