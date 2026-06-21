import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { addDays, parseISO } from 'date-fns';
import { calculatePregnancyProbability } from '../pregnancy';

// Feature: menstrual-cycle-tracker, Property 8: Pregnancy probability classification
// For any day of the cycle, correctly classify: 'high' if |distance| ≤ 2,
// 'medium' if distance between -5 and -3, 'low' for the rest.

// **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

// Generators
const isoDateArb = fc
  .date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
  .map((d) => d.toISOString().split('T')[0]);

const cycleLengthArb = fc.integer({ min: 26, max: 30 });
const lutealPhaseDaysArb = fc.constant(14);

describe('Property 8: Pregnancy probability classification', () => {
  it('returns "high" when |distance to ovulation| ≤ 2', () => {
    fc.assert(
      fc.property(
        isoDateArb,
        cycleLengthArb,
        lutealPhaseDaysArb,
        (startDate, cycleLength, lutealPhaseDays) => {
          const ovulationDay = cycleLength - lutealPhaseDays;

          // Generate days where |distance| <= 2, i.e., days ovulationDay-2 to ovulationDay+2
          for (let offset = -2; offset <= 2; offset++) {
            const dayInCycle = ovulationDay + offset;
            if (dayInCycle < 1 || dayInCycle > cycleLength) continue;

            const targetDate = addDays(parseISO(startDate), dayInCycle - 1)
              .toISOString()
              .split('T')[0];

            const result = calculatePregnancyProbability(
              targetDate,
              startDate,
              cycleLength,
              lutealPhaseDays
            );
            expect(result).toBe('high');
          }
        }
      )
    );
  });

  it('returns "medium" when distance is between -5 and -3 (inclusive)', () => {
    fc.assert(
      fc.property(
        isoDateArb,
        cycleLengthArb,
        lutealPhaseDaysArb,
        (startDate, cycleLength, lutealPhaseDays) => {
          const ovulationDay = cycleLength - lutealPhaseDays;

          // Generate days where distance is in [-5, -3]
          for (let distance = -5; distance <= -3; distance++) {
            const dayInCycle = ovulationDay + distance;
            if (dayInCycle < 1 || dayInCycle > cycleLength) continue;

            const targetDate = addDays(parseISO(startDate), dayInCycle - 1)
              .toISOString()
              .split('T')[0];

            const result = calculatePregnancyProbability(
              targetDate,
              startDate,
              cycleLength,
              lutealPhaseDays
            );
            expect(result).toBe('medium');
          }
        }
      )
    );
  });

  it('returns "low" for all other days outside high and medium zones', () => {
    fc.assert(
      fc.property(
        isoDateArb,
        cycleLengthArb,
        lutealPhaseDaysArb,
        fc.integer({ min: 1, max: 30 }),
        (startDate, cycleLength, lutealPhaseDays, rawDay) => {
          // Constrain dayInCycle to valid range
          const dayInCycle = ((rawDay - 1) % cycleLength) + 1;
          const ovulationDay = cycleLength - lutealPhaseDays;
          const distance = dayInCycle - ovulationDay;

          // Skip days that are in the high or medium zones
          if (Math.abs(distance) <= 2) return;
          if (distance >= -5 && distance <= -3) return;

          const targetDate = addDays(parseISO(startDate), dayInCycle - 1)
            .toISOString()
            .split('T')[0];

          const result = calculatePregnancyProbability(
            targetDate,
            startDate,
            cycleLength,
            lutealPhaseDays
          );
          expect(result).toBe('low');
        }
      )
    );
  });

  it('result is always one of the three valid levels', () => {
    fc.assert(
      fc.property(
        isoDateArb,
        cycleLengthArb,
        lutealPhaseDaysArb,
        fc.integer({ min: 1, max: 30 }),
        (startDate, cycleLength, lutealPhaseDays, rawDay) => {
          const dayInCycle = ((rawDay - 1) % cycleLength) + 1;

          const targetDate = addDays(parseISO(startDate), dayInCycle - 1)
            .toISOString()
            .split('T')[0];

          const result = calculatePregnancyProbability(
            targetDate,
            startDate,
            cycleLength,
            lutealPhaseDays
          );
          expect(['high', 'medium', 'low']).toContain(result);
        }
      )
    );
  });

  it('the fertile window (high probability) always spans exactly 5 days', () => {
    fc.assert(
      fc.property(
        isoDateArb,
        cycleLengthArb,
        lutealPhaseDaysArb,
        (startDate, cycleLength, lutealPhaseDays) => {
          let highCount = 0;

          for (let day = 1; day <= cycleLength; day++) {
            const targetDate = addDays(parseISO(startDate), day - 1)
              .toISOString()
              .split('T')[0];

            const result = calculatePregnancyProbability(
              targetDate,
              startDate,
              cycleLength,
              lutealPhaseDays
            );
            if (result === 'high') {
              highCount++;
            }
          }

          expect(highCount).toBe(5);
        }
      )
    );
  });
});
