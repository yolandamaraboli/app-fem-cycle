import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseISO, addDays, differenceInDays } from 'date-fns';
import {
  calculateHistoryAverage,
  detectAnomalies,
  calculateVariation,
  calculateTrend,
  predictPhases,
} from '../cycle';
import type { Cycle } from '../../types';

// ============================================================
// Helpers & Generators
// ============================================================

/**
 * Creates a completed Cycle with a specific duration (in days).
 * Each cycle starts the day after the previous one ends.
 */
function buildCompletedCycles(durations: number[], baseDate = '2023-01-01'): Cycle[] {
  let currentDate = parseISO(baseDate);

  return durations.map((duration) => {
    const startDate = currentDate.toISOString().split('T')[0];
    const endDate = addDays(currentDate, duration).toISOString().split('T')[0];
    currentDate = addDays(currentDate, duration + 1);

    return {
      id: crypto.randomUUID(),
      startDate,
      endDate,
      periodDays: [],
      phases: predictPhases(startDate, 28, 5, 14),
      averageCycleLength: 28,
      periodDuration: 5,
    };
  });
}

/**
 * Arbitrary for an array of cycle durations (realistic range).
 * Each duration represents differenceInDays(endDate, startDate).
 */
const durationsArb = (minLength: number, maxLength: number) =>
  fc.array(fc.integer({ min: 20, max: 45 }), {
    minLength,
    maxLength,
  });

// ============================================================
// Property 9: History average calculation
// ============================================================

// Feature: menstrual-cycle-tracker, Property 9: History average calculation
// For any array of completed cycles, the averages calculation function must return
// the arithmetic mean of the durations of the last min(6, N) available cycles.

// **Validates: Requirements 7.2, 7.8**

describe('Property 9: History average calculation', () => {
  it('returns the arithmetic mean of the last min(6, N) completed cycles', () => {
    fc.assert(
      fc.property(durationsArb(1, 15), (durations) => {
        const cycles = buildCompletedCycles(durations);
        const result = calculateHistoryAverage(cycles);

        // Manual calculation
        const N = durations.length;
        const count = Math.min(6, N);
        const lastN = durations.slice(-count);
        const expectedAvg = lastN.reduce((a, b) => a + b, 0) / count;

        expect(result).toBeCloseTo(expectedAvg, 10);
      }),
      { numRuns: 100 }
    );
  });

  it('uses at most 6 cycles even when more are available', () => {
    fc.assert(
      fc.property(durationsArb(7, 15), (durations) => {
        const cycles = buildCompletedCycles(durations);
        const result = calculateHistoryAverage(cycles);

        // Should only consider the last 6
        const last6 = durations.slice(-6);
        const expectedAvg = last6.reduce((a, b) => a + b, 0) / 6;

        expect(result).toBeCloseTo(expectedAvg, 10);
      }),
      { numRuns: 100 }
    );
  });

  it('returns null for empty cycle array', () => {
    const result = calculateHistoryAverage([]);
    expect(result).toBeNull();
  });
});

// ============================================================
// Property 10: Anomaly detection
// ============================================================

// Feature: menstrual-cycle-tracker, Property 10: Anomaly detection
// For any array of completed cycles and their calculated average, detectAnomalies
// must identify as anomalies exactly those cycles whose duration deviates more
// than 7 days from the average (|duration - average| > 7).

// **Validates: Requirements 7.4**

describe('Property 10: Anomaly detection', () => {
  it('identifies exactly those cycles with |duration - average| > 7', () => {
    fc.assert(
      fc.property(
        durationsArb(1, 15),
        fc.integer({ min: 20, max: 45 }),
        (durations, averageLength) => {
          const cycles = buildCompletedCycles(durations);
          const anomalies = detectAnomalies(cycles, averageLength);

          // Manually determine expected anomalies
          const expectedAnomalies = cycles.filter((cycle) => {
            const start = parseISO(cycle.startDate);
            const end = parseISO(cycle.endDate!);
            const duration = differenceInDays(end, start);
            return Math.abs(duration - averageLength) > 7;
          });

          expect(anomalies.length).toBe(expectedAnomalies.length);

          // Verify each anomaly is correctly identified
          for (const anomaly of anomalies) {
            const start = parseISO(anomaly.startDate);
            const end = parseISO(anomaly.endDate!);
            const duration = differenceInDays(end, start);
            expect(Math.abs(duration - averageLength)).toBeGreaterThan(7);
          }

          // Verify no false negatives: non-anomaly cycles have |duration - avg| <= 7
          const nonAnomalyIds = new Set(anomalies.map((a) => a.id));
          const nonAnomalies = cycles.filter((c) => !nonAnomalyIds.has(c.id));
          for (const cycle of nonAnomalies) {
            const start = parseISO(cycle.startDate);
            const end = parseISO(cycle.endDate!);
            const duration = differenceInDays(end, start);
            expect(Math.abs(duration - averageLength)).toBeLessThanOrEqual(7);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns empty array when no cycles deviate more than 7 days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 25, max: 35 }),
        (baseDuration) => {
          // All durations within 7 days of baseDuration
          const durations = [baseDuration, baseDuration + 3, baseDuration - 2, baseDuration + 5];
          const cycles = buildCompletedCycles(durations);
          const anomalies = detectAnomalies(cycles, baseDuration);

          expect(anomalies.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 11: Variation between consecutive cycles
// ============================================================

// Feature: menstrual-cycle-tracker, Property 11: Variation calculation between consecutive cycles
// For any sequence of 2+ completed cycles, variation must be the signed difference
// (duration[i+1] - duration[i]) for each adjacent pair.

// **Validates: Requirements 7.5**

describe('Property 11: Variation between consecutive cycles', () => {
  it('returns signed differences for each adjacent pair', () => {
    fc.assert(
      fc.property(durationsArb(2, 15), (durations) => {
        const cycles = buildCompletedCycles(durations);
        const variations = calculateVariation(cycles);

        // Should have N-1 variations for N cycles
        expect(variations.length).toBe(durations.length - 1);

        // Each variation should be duration[i+1] - duration[i]
        for (let i = 0; i < variations.length; i++) {
          expect(variations[i]).toBe(durations[i + 1] - durations[i]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('returns empty array for fewer than 2 cycles', () => {
    fc.assert(
      fc.property(durationsArb(0, 1), (durations) => {
        const cycles = buildCompletedCycles(durations);
        const variations = calculateVariation(cycles);
        expect(variations.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('sum of variations equals last duration minus first duration', () => {
    fc.assert(
      fc.property(durationsArb(2, 15), (durations) => {
        const cycles = buildCompletedCycles(durations);
        const variations = calculateVariation(cycles);

        const sumVariations = variations.reduce((a, b) => a + b, 0);
        const expectedDiff = durations[durations.length - 1] - durations[0];

        expect(sumVariations).toBe(expectedDiff);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 12: Trend classification
// ============================================================

// Feature: menstrual-cycle-tracker, Property 12: Cycle trend classification
// For any sequence of 6+ completed cycles, calculateTrend must classify:
// 'shortening' if avg last 3 is at least 2 days less than avg previous 3,
// 'lengthening' if at least 2 days more,
// 'stable' if absolute difference < 2 days.

// **Validates: Requirements 7.6**

describe('Property 12: Trend classification', () => {
  it('correctly classifies trend based on last 3 vs previous 3 averages', () => {
    fc.assert(
      fc.property(durationsArb(6, 15), (durations) => {
        const cycles = buildCompletedCycles(durations);
        const trend = calculateTrend(cycles);

        // Manual calculation
        const last6Durations = durations.slice(-6);
        const previous3 = last6Durations.slice(0, 3);
        const last3 = last6Durations.slice(3, 6);

        const avgPrevious = previous3.reduce((a, b) => a + b, 0) / 3;
        const avgLast = last3.reduce((a, b) => a + b, 0) / 3;
        const difference = avgLast - avgPrevious;

        if (difference >= 2) {
          expect(trend).toBe('lengthening');
        } else if (difference <= -2) {
          expect(trend).toBe('shortening');
        } else {
          expect(trend).toBe('stable');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('returns stable for fewer than 6 cycles', () => {
    fc.assert(
      fc.property(durationsArb(1, 5), (durations) => {
        const cycles = buildCompletedCycles(durations);
        const trend = calculateTrend(cycles);
        expect(trend).toBe('stable');
      }),
      { numRuns: 100 }
    );
  });

  it('shortening: when last 3 average is at least 2 less than previous 3', () => {
    // Force a shortening scenario: previous 3 are long, last 3 are short
    fc.assert(
      fc.property(
        fc.integer({ min: 30, max: 40 }),
        fc.integer({ min: 20, max: 26 }),
        (longDuration, shortDuration) => {
          // Ensure the difference is at least 2
          fc.pre(longDuration - shortDuration >= 2);

          const durations = [
            longDuration, longDuration, longDuration,
            shortDuration, shortDuration, shortDuration,
          ];
          const cycles = buildCompletedCycles(durations);
          const trend = calculateTrend(cycles);
          expect(trend).toBe('shortening');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('lengthening: when last 3 average is at least 2 more than previous 3', () => {
    // Force a lengthening scenario: previous 3 are short, last 3 are long
    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 26 }),
        fc.integer({ min: 30, max: 40 }),
        (shortDuration, longDuration) => {
          fc.pre(longDuration - shortDuration >= 2);

          const durations = [
            shortDuration, shortDuration, shortDuration,
            longDuration, longDuration, longDuration,
          ];
          const cycles = buildCompletedCycles(durations);
          const trend = calculateTrend(cycles);
          expect(trend).toBe('lengthening');
        }
      ),
      { numRuns: 100 }
    );
  });
});
