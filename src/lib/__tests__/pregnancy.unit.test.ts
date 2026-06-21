import { describe, it, expect } from 'vitest';
import {
  calculatePregnancyProbability,
  canShowPregnancyProbability,
} from '../pregnancy';
import type { Cycle } from '../../types';

describe('calculatePregnancyProbability', () => {
  // With cycleLength=28, lutealPhaseDays=14 → ovulationDay=14
  const cycleStart = '2024-01-01';
  const cycleLength = 28;
  const lutealPhaseDays = 14;

  it('returns "high" on ovulation day (day 14)', () => {
    // Day 14 → distance = 14 - 14 = 0
    const result = calculatePregnancyProbability(
      '2024-01-14',
      cycleStart,
      cycleLength,
      lutealPhaseDays
    );
    expect(result).toBe('high');
  });

  it('returns "high" 2 days before ovulation (day 12)', () => {
    // Day 12 → distance = 12 - 14 = -2, |distance| = 2
    const result = calculatePregnancyProbability(
      '2024-01-12',
      cycleStart,
      cycleLength,
      lutealPhaseDays
    );
    expect(result).toBe('high');
  });

  it('returns "high" 2 days after ovulation (day 16)', () => {
    // Day 16 → distance = 16 - 14 = 2, |distance| = 2
    const result = calculatePregnancyProbability(
      '2024-01-16',
      cycleStart,
      cycleLength,
      lutealPhaseDays
    );
    expect(result).toBe('high');
  });

  it('returns "medium" 3 days before ovulation (day 11)', () => {
    // Day 11 → distance = 11 - 14 = -3
    const result = calculatePregnancyProbability(
      '2024-01-11',
      cycleStart,
      cycleLength,
      lutealPhaseDays
    );
    expect(result).toBe('medium');
  });

  it('returns "medium" 5 days before ovulation (day 9)', () => {
    // Day 9 → distance = 9 - 14 = -5
    const result = calculatePregnancyProbability(
      '2024-01-09',
      cycleStart,
      cycleLength,
      lutealPhaseDays
    );
    expect(result).toBe('medium');
  });

  it('returns "low" 6 days before ovulation (day 8)', () => {
    // Day 8 → distance = 8 - 14 = -6
    const result = calculatePregnancyProbability(
      '2024-01-08',
      cycleStart,
      cycleLength,
      lutealPhaseDays
    );
    expect(result).toBe('low');
  });

  it('returns "low" 3 days after ovulation (day 17)', () => {
    // Day 17 → distance = 17 - 14 = 3
    const result = calculatePregnancyProbability(
      '2024-01-17',
      cycleStart,
      cycleLength,
      lutealPhaseDays
    );
    expect(result).toBe('low');
  });

  it('returns "low" on the first day of the cycle', () => {
    // Day 1 → distance = 1 - 14 = -13
    const result = calculatePregnancyProbability(
      '2024-01-01',
      cycleStart,
      cycleLength,
      lutealPhaseDays
    );
    expect(result).toBe('low');
  });

  it('returns "low" on the last day of the cycle (day 28)', () => {
    // Day 28 → distance = 28 - 14 = 14
    const result = calculatePregnancyProbability(
      '2024-01-28',
      cycleStart,
      cycleLength,
      lutealPhaseDays
    );
    expect(result).toBe('low');
  });

  it('works with cycleLength=26', () => {
    // ovulationDay = 26 - 14 = 12
    // Day 12 → distance = 0 → high
    const result = calculatePregnancyProbability(
      '2024-01-12',
      cycleStart,
      26,
      lutealPhaseDays
    );
    expect(result).toBe('high');
  });

  it('works with cycleLength=30', () => {
    // ovulationDay = 30 - 14 = 16
    // Day 16 → distance = 0 → high
    const result = calculatePregnancyProbability(
      '2024-01-16',
      cycleStart,
      30,
      lutealPhaseDays
    );
    expect(result).toBe('high');
  });
});

describe('canShowPregnancyProbability', () => {
  it('returns false when activeCycle is null', () => {
    expect(canShowPregnancyProbability(null)).toBe(false);
  });

  it('returns true when activeCycle has a startDate', () => {
    const cycle: Cycle = {
      id: 'test-id',
      startDate: '2024-01-01',
      endDate: null,
      periodDays: ['2024-01-01'],
      phases: {
        menstrual: { start: '2024-01-01', end: '2024-01-05' },
        follicular: { start: '2024-01-06', end: '2024-01-12' },
        ovulation: { start: '2024-01-13', end: '2024-01-15' },
        luteal: { start: '2024-01-16', end: '2024-01-28' },
      },
      averageCycleLength: 28,
      periodDuration: 5,
    };
    expect(canShowPregnancyProbability(cycle)).toBe(true);
  });

  it('returns false when activeCycle has an empty startDate', () => {
    const cycle: Cycle = {
      id: 'test-id',
      startDate: '',
      endDate: null,
      periodDays: [],
      phases: {
        menstrual: { start: '', end: '' },
        follicular: { start: '', end: '' },
        ovulation: { start: '', end: '' },
        luteal: { start: '', end: '' },
      },
      averageCycleLength: 28,
      periodDuration: 5,
    };
    expect(canShowPregnancyProbability(cycle)).toBe(false);
  });
});
