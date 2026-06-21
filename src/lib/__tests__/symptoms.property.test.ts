import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { addDays, parseISO } from 'date-fns';
import { generatePhaseSummary, hasEnoughDataForSummary } from '../symptoms';
import { getRecommendations } from '../recommendations';
import type {
  SymptomLog,
  CyclePhases,
  Cycle,
  PhysicalSymptoms,
  PhysicalSymptomKey,
} from '../../types';

// Feature: menstrual-cycle-tracker, Property 5: Phase summary generation
// For any set of SymptomLogs within a cycle, the `generatePhaseSummary` function must:
// (a) calculate the arithmetic mean of each symptom using only the days with records within each phase
// (b) return null for phases with no recorded days
// (c) return a valid summary only when the cycle has 7 or more days with records (use `hasEnoughDataForSummary`)

// **Validates: Requirements 4.1, 4.2, 4.4, 4.6**

// Generators
const isoDateArb = fc
  .date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
  .map((d) => d.toISOString().split('T')[0]);

const cycleConfigArb = fc.record({
  cycleLength: fc.integer({ min: 26, max: 30 }),
  periodDuration: fc.integer({ min: 3, max: 7 }),
  lutealPhaseDays: fc.constant(14),
});

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


/** Build CyclePhases from a start date and config */
function buildPhases(
  startDate: string,
  cycleLength: number,
  periodDuration: number,
  lutealPhaseDays: number
): CyclePhases {
  const start = parseISO(startDate);
  const menstrualEnd = addDays(start, periodDuration - 1);
  const ovulationDay = cycleLength - lutealPhaseDays;
  const ovulationStart = addDays(start, ovulationDay - 2);
  const ovulationEnd = addDays(start, ovulationDay);
  const follicularStart = addDays(menstrualEnd, 1);
  const follicularEnd = addDays(ovulationStart, -1);
  const lutealStart = addDays(ovulationEnd, 1);
  const lutealEnd = addDays(start, cycleLength - 1);

  return {
    menstrual: {
      start: startDate,
      end: menstrualEnd.toISOString().split('T')[0],
    },
    follicular: {
      start: follicularStart.toISOString().split('T')[0],
      end: follicularEnd.toISOString().split('T')[0],
    },
    ovulation: {
      start: ovulationStart.toISOString().split('T')[0],
      end: ovulationEnd.toISOString().split('T')[0],
    },
    luteal: {
      start: lutealStart.toISOString().split('T')[0],
      end: lutealEnd.toISOString().split('T')[0],
    },
  };
}

const PHYSICAL_KEYS: (keyof PhysicalSymptoms)[] = [
  'cramps', 'backPain', 'headache', 'bloating',
  'breastTenderness', 'fatigue', 'nausea', 'acne',
];

const EMOTIONAL_KEYS = [
  'moodSwings', 'anxiety', 'sadness', 'irritability', 'energy',
] as const;

describe('Property 5: Phase summary generation', () => {
  it('(a) calculates arithmetic mean of each symptom using only days with records within each phase', () => {
    fc.assert(
      fc.property(
        isoDateArb,
        cycleConfigArb,
        fc.integer({ min: 1, max: 28 }),
        (startDate, config, logCount) => {
          const phases = buildPhases(
            startDate,
            config.cycleLength,
            config.periodDuration,
            config.lutealPhaseDays
          );

          // Generate random day offsets within cycle (unique)
          const actualLogCount = Math.min(logCount, config.cycleLength);
          const dayOffsets: number[] = [];
          for (let i = 0; i < actualLogCount; i++) {
            dayOffsets.push(i % config.cycleLength);
          }
          const uniqueOffsets = [...new Set(dayOffsets)];

          // Create logs with deterministic but varied values
          const logs: SymptomLog[] = uniqueOffsets.map((offset) => {
            const date = addDays(parseISO(startDate), offset)
              .toISOString()
              .split('T')[0];
            return {
              date,
              physical: {
                cramps: (offset % 5) + 1,
                backPain: ((offset + 1) % 5),
                headache: ((offset + 2) % 5),
                bloating: ((offset + 3) % 5),
                breastTenderness: ((offset + 4) % 5),
                fatigue: (offset % 4),
                nausea: ((offset + 1) % 4),
                acne: ((offset + 2) % 4),
              },
              emotional: {
                moodSwings: (offset % 5),
                anxiety: ((offset + 1) % 5),
                sadness: ((offset + 2) % 5),
                irritability: ((offset + 3) % 5),
                energy: ((offset + 4) % 5),
              },
              hormonal: { flow: 'none' as const, cervicalMucus: 'dry' as const },
              libido: 0,
              appetite: 0,
              sleep: 7,
              weight: null,
              temperature: null,
              notes: '',
              tags: [],
            };
          });

          const summary = generatePhaseSummary(logs, phases);
          const phaseNames = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;

          for (const phaseName of phaseNames) {
            const range = phases[phaseName];
            const phaseStart = parseISO(range.start);
            const phaseEnd = parseISO(range.end);

            // Filter logs in this phase manually
            const phaseLogs = logs.filter((log) => {
              const logDate = parseISO(log.date);
              return logDate >= phaseStart && logDate <= phaseEnd;
            });

            if (phaseLogs.length === 0) {
              expect(summary[phaseName]).toBeNull();
            } else {
              expect(summary[phaseName]).not.toBeNull();
              const data = summary[phaseName]!;

              // Verify arithmetic mean for each physical key
              for (const key of PHYSICAL_KEYS) {
                const expectedMean =
                  phaseLogs.reduce((sum, log) => sum + log.physical[key], 0) /
                  phaseLogs.length;
                expect(data.physicalAvg[key]).toBeCloseTo(expectedMean, 10);
              }

              // Verify arithmetic mean for each emotional key
              for (const key of EMOTIONAL_KEYS) {
                const expectedMean =
                  phaseLogs.reduce((sum, log) => sum + log.emotional[key], 0) /
                  phaseLogs.length;
                expect(data.emotionalAvg[key]).toBeCloseTo(expectedMean, 10);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('(b) returns null for phases with no recorded days', () => {
    fc.assert(
      fc.property(isoDateArb, cycleConfigArb, (startDate, config) => {
        const phases = buildPhases(
          startDate,
          config.cycleLength,
          config.periodDuration,
          config.lutealPhaseDays
        );

        // No logs at all — all phases should be null
        const summary = generatePhaseSummary([], phases);

        expect(summary.menstrual).toBeNull();
        expect(summary.follicular).toBeNull();
        expect(summary.ovulation).toBeNull();
        expect(summary.luteal).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('(c) hasEnoughDataForSummary requires 7+ days with records in the cycle', () => {
    fc.assert(
      fc.property(
        isoDateArb,
        cycleConfigArb,
        fc.integer({ min: 0, max: 30 }),
        (startDate, config, logCount) => {
          const endDate = addDays(parseISO(startDate), config.cycleLength - 1)
            .toISOString()
            .split('T')[0];

          const cycle: Cycle = {
            id: 'test-cycle',
            startDate,
            endDate,
            periodDays: [],
            phases: buildPhases(
              startDate,
              config.cycleLength,
              config.periodDuration,
              config.lutealPhaseDays
            ),
            averageCycleLength: config.cycleLength,
            periodDuration: config.periodDuration,
          };

          // Create logs within the cycle (capped to cycle length)
          const actualCount = Math.min(logCount, config.cycleLength);
          const logs: SymptomLog[] = Array.from({ length: actualCount }, (_, i) => ({
            date: addDays(parseISO(startDate), i).toISOString().split('T')[0],
            physical: {
              cramps: 0, backPain: 0, headache: 0, bloating: 0,
              breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0,
            },
            emotional: {
              moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0,
            },
            hormonal: { flow: 'none' as const, cervicalMucus: 'dry' as const },
            libido: 0,
            appetite: 0,
            sleep: 7,
            weight: null,
            temperature: null,
            notes: '',
            tags: [],
          }));

          const result = hasEnoughDataForSummary(logs, cycle);

          if (actualCount >= 7) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('(c) hasEnoughDataForSummary returns false when cycle has no endDate', () => {
    fc.assert(
      fc.property(isoDateArb, cycleConfigArb, (startDate, config) => {
        const cycle: Cycle = {
          id: 'test-cycle',
          startDate,
          endDate: null, // active cycle, no endDate
          periodDays: [],
          phases: buildPhases(
            startDate,
            config.cycleLength,
            config.periodDuration,
            config.lutealPhaseDays
          ),
          averageCycleLength: config.cycleLength,
          periodDuration: config.periodDuration,
        };

        // Even with many logs, should return false
        const logs: SymptomLog[] = Array.from({ length: 15 }, (_, i) => ({
          date: addDays(parseISO(startDate), i).toISOString().split('T')[0],
          physical: {
            cramps: 0, backPain: 0, headache: 0, bloating: 0,
            breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0,
          },
          emotional: {
            moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 0,
          },
          hormonal: { flow: 'none' as const, cervicalMucus: 'dry' as const },
          libido: 0,
          appetite: 0,
          sleep: 7,
          weight: null,
          temperature: null,
          notes: '',
          tags: [],
        }));

        expect(hasEnoughDataForSummary(logs, cycle)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: menstrual-cycle-tracker, Property 6: Recommendation generation by intensity
// For any SymptomLog, the `getRecommendations` function must:
// (a) generate recommendations only for physical symptoms with intensity >= 3
// (b) return a maximum of 5 recommendations
// (c) group by symptom
// (d) order groups by descending intensity of the corresponding symptom

// **Validates: Requirements 5.1, 5.6**

const symptomLogFullArb: fc.Arbitrary<SymptomLog> = fc.record({
  date: isoDateArb,
  physical: physicalSymptomsArb,
  emotional: emotionalSymptomsArb,
  hormonal: fc.record({
    flow: fc.constantFrom('none' as const, 'light' as const, 'medium' as const, 'heavy' as const, 'spotting' as const),
    cervicalMucus: fc.constantFrom('dry' as const, 'sticky' as const, 'creamy' as const, 'eggWhite' as const, 'watery' as const),
  }),
  libido: fc.integer({ min: 0, max: 5 }),
  appetite: fc.integer({ min: 0, max: 5 }),
  sleep: fc.integer({ min: 0, max: 48 }).map((n) => n * 0.5),
  weight: fc.option(fc.double({ min: 30.0, max: 300.0, noNaN: true }), { nil: null }),
  temperature: fc.option(fc.double({ min: 35.0, max: 42.0, noNaN: true }), { nil: null }),
  notes: fc.string({ maxLength: 500 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 10 }),
});

describe('Property 6: Recommendation generation by intensity', () => {
  it('(a) generates recommendations only for physical symptoms with intensity >= 3', () => {
    fc.assert(
      fc.property(symptomLogFullArb, (log) => {
        const recs = getRecommendations(log);

        // Every recommendation must be for a symptom with intensity >= 3
        for (const rec of recs) {
          const intensity = log.physical[rec.symptom];
          expect(intensity).toBeGreaterThanOrEqual(3);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('(b) returns a maximum of 5 recommendations', () => {
    fc.assert(
      fc.property(symptomLogFullArb, (log) => {
        const recs = getRecommendations(log);
        expect(recs.length).toBeLessThanOrEqual(5);
      }),
      { numRuns: 100 }
    );
  });

  it('(c) groups recommendations by symptom', () => {
    fc.assert(
      fc.property(symptomLogFullArb, (log) => {
        const recs = getRecommendations(log);

        if (recs.length === 0) return;

        // Recommendations for the same symptom should appear consecutively
        const symptomOrder: PhysicalSymptomKey[] = [];
        for (const rec of recs) {
          if (symptomOrder.length === 0 || symptomOrder[symptomOrder.length - 1] !== rec.symptom) {
            symptomOrder.push(rec.symptom);
          }
        }

        // Verify all recs for a symptom are grouped (no symptom appears twice in the order)
        const uniqueSymptoms = new Set(symptomOrder);
        expect(uniqueSymptoms.size).toBe(symptomOrder.length);
      }),
      { numRuns: 100 }
    );
  });

  it('(d) orders groups by descending intensity of the corresponding symptom', () => {
    fc.assert(
      fc.property(symptomLogFullArb, (log) => {
        const recs = getRecommendations(log);

        if (recs.length <= 1) return;

        // Extract ordered unique symptom groups
        const symptomGroups: PhysicalSymptomKey[] = [];
        for (const rec of recs) {
          if (symptomGroups.length === 0 || symptomGroups[symptomGroups.length - 1] !== rec.symptom) {
            symptomGroups.push(rec.symptom);
          }
        }

        // Verify descending intensity order between groups
        for (let i = 1; i < symptomGroups.length; i++) {
          const prevIntensity = log.physical[symptomGroups[i - 1]];
          const currIntensity = log.physical[symptomGroups[i]];
          expect(prevIntensity).toBeGreaterThanOrEqual(currIntensity);
        }
      }),
      { numRuns: 100 }
    );
  });
});
