import { describe, it, expect } from 'vitest';
import {
  predictPhases,
  calculateAverageCycleLength,
  getCurrentPhase,
  detectAnomalies,
  calculateTrend,
} from '../cycle';
import type { Cycle } from '../../types';

// Helper to create a minimal Cycle object for testing
function makeCycle(
  startDate: string,
  endDate: string | null,
  overrides?: Partial<Cycle>
): Cycle {
  return {
    id: crypto.randomUUID(),
    startDate,
    endDate,
    periodDays: [],
    phases: predictPhases(startDate, 28, 5, 14),
    averageCycleLength: 28,
    periodDuration: 5,
    ...overrides,
  };
}

describe('predictPhases', () => {
  it('calculates phases for a standard 28-day cycle with 5-day period and 14-day luteal', () => {
    const phases = predictPhases('2024-01-01', 28, 5, 14);

    // Menstrual: Jan 1 → Jan 5 (5 days)
    expect(phases.menstrual).toEqual({ start: '2024-01-01', end: '2024-01-05' });

    // Ovulation day: Jan 1 + 28 - 14 - 1 = day index 13 = Jan 14
    // Ovulation phase: Jan 13 → Jan 15
    expect(phases.ovulation).toEqual({ start: '2024-01-13', end: '2024-01-15' });

    // Follicular: Jan 6 → Jan 12
    expect(phases.follicular).toEqual({ start: '2024-01-06', end: '2024-01-12' });

    // Luteal: Jan 16 → Jan 28
    expect(phases.luteal).toEqual({ start: '2024-01-16', end: '2024-01-28' });
  });

  it('handles a 26-day cycle with 3-day period', () => {
    const phases = predictPhases('2024-03-01', 26, 3, 14);

    // Menstrual: Mar 1 → Mar 3
    expect(phases.menstrual).toEqual({ start: '2024-03-01', end: '2024-03-03' });

    // Ovulation day: Mar 1 + 26 - 14 - 1 = day 11 = Mar 12
    // Ovulation: Mar 11 → Mar 13
    expect(phases.ovulation).toEqual({ start: '2024-03-11', end: '2024-03-13' });

    // Follicular: Mar 4 → Mar 10
    expect(phases.follicular).toEqual({ start: '2024-03-04', end: '2024-03-10' });

    // Luteal: Mar 14 → Mar 26
    expect(phases.luteal).toEqual({ start: '2024-03-14', end: '2024-03-26' });
  });

  it('handles a 30-day cycle with 7-day period', () => {
    const phases = predictPhases('2024-02-01', 30, 7, 14);

    // Menstrual: Feb 1 → Feb 7
    expect(phases.menstrual).toEqual({ start: '2024-02-01', end: '2024-02-07' });

    // Ovulation day: Feb 1 + 30 - 14 - 1 = day 15 = Feb 16
    // Ovulation: Feb 15 → Feb 17
    expect(phases.ovulation).toEqual({ start: '2024-02-15', end: '2024-02-17' });

    // Follicular: Feb 8 → Feb 14
    expect(phases.follicular).toEqual({ start: '2024-02-08', end: '2024-02-14' });

    // Luteal: Feb 18 → Mar 1
    expect(phases.luteal).toEqual({ start: '2024-02-18', end: '2024-03-01' });
  });
});

describe('calculateAverageCycleLength', () => {
  it('returns 28 when no completed cycles exist', () => {
    const cycles = [makeCycle('2024-01-01', null)];
    expect(calculateAverageCycleLength(cycles, 3)).toBe(28);
  });

  it('calculates average of last N completed cycles', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-28'), // 27 days
      makeCycle('2024-01-29', '2024-02-26'), // 28 days
      makeCycle('2024-02-27', '2024-03-27'), // 29 days
    ];
    // Average: (27 + 28 + 29) / 3 = 28
    expect(calculateAverageCycleLength(cycles, 3)).toBe(28);
  });

  it('clamps to minimum of 26', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-21'), // 20 days
      makeCycle('2024-01-22', '2024-02-11'), // 20 days
    ];
    // Average: 20, clamped to 26
    expect(calculateAverageCycleLength(cycles, 3)).toBe(26);
  });

  it('clamps to maximum of 30', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-02-05'), // 35 days
      makeCycle('2024-02-06', '2024-03-12'), // 35 days
    ];
    // Average: 35, clamped to 30
    expect(calculateAverageCycleLength(cycles, 3)).toBe(30);
  });

  it('uses only the last N cycles when more are available', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-28'), // 27 days (ignored)
      makeCycle('2024-01-29', '2024-02-26'), // 28 days
      makeCycle('2024-02-27', '2024-03-27'), // 29 days
      makeCycle('2024-03-28', '2024-04-25'), // 28 days
    ];
    // Last 3: 28 + 29 + 28 = 85 / 3 ≈ 28
    expect(calculateAverageCycleLength(cycles, 3)).toBe(28);
  });
});

describe('getCurrentPhase', () => {
  const cycle = makeCycle('2024-01-01', '2024-01-28');

  it('returns menstrual for a date in the menstrual phase', () => {
    expect(getCurrentPhase('2024-01-03', cycle)).toBe('menstrual');
  });

  it('returns follicular for a date in the follicular phase', () => {
    expect(getCurrentPhase('2024-01-08', cycle)).toBe('follicular');
  });

  it('returns ovulation for a date in the ovulation phase', () => {
    expect(getCurrentPhase('2024-01-14', cycle)).toBe('ovulation');
  });

  it('returns luteal for a date in the luteal phase', () => {
    expect(getCurrentPhase('2024-01-20', cycle)).toBe('luteal');
  });

  it('returns null for a date outside the cycle', () => {
    expect(getCurrentPhase('2024-02-15', cycle)).toBeNull();
  });
});

describe('detectAnomalies', () => {
  it('returns cycles that deviate more than 7 days from average', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-28'), // 27 days
      makeCycle('2024-01-29', '2024-03-08'), // 39 days — anomaly (39 - 28 = 11 > 7)
      makeCycle('2024-03-09', '2024-04-06'), // 28 days
    ];

    const anomalies = detectAnomalies(cycles, 28);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].startDate).toBe('2024-01-29');
  });

  it('returns empty array when no anomalies', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-28'), // 27
      makeCycle('2024-01-29', '2024-02-26'), // 28
      makeCycle('2024-02-27', '2024-03-27'), // 29
    ];

    expect(detectAnomalies(cycles, 28)).toHaveLength(0);
  });

  it('ignores cycles without endDate', () => {
    const cycles = [
      makeCycle('2024-01-01', null), // active — no endDate
    ];

    expect(detectAnomalies(cycles, 28)).toHaveLength(0);
  });

  it('detects cycles shorter than average by more than 7 days', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-19'), // 18 days — anomaly (28 - 18 = 10 > 7)
    ];

    expect(detectAnomalies(cycles, 28)).toHaveLength(1);
  });
});

describe('calculateTrend', () => {
  it('returns stable when fewer than 6 completed cycles', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-28'),
      makeCycle('2024-01-29', '2024-02-26'),
    ];
    expect(calculateTrend(cycles)).toBe('stable');
  });

  it('returns stable when difference is less than 2 days', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-29'), // 28
      makeCycle('2024-01-30', '2024-02-27'), // 28
      makeCycle('2024-02-28', '2024-03-27'), // 28
      makeCycle('2024-03-28', '2024-04-25'), // 28
      makeCycle('2024-04-26', '2024-05-24'), // 28
      makeCycle('2024-05-25', '2024-06-22'), // 28
    ];
    expect(calculateTrend(cycles)).toBe('stable');
  });

  it('returns lengthening when last 3 average is >= 2 days more than previous 3', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-27'), // 26
      makeCycle('2024-01-28', '2024-02-23'), // 26
      makeCycle('2024-02-24', '2024-03-21'), // 26
      makeCycle('2024-03-22', '2024-04-21'), // 30
      makeCycle('2024-04-22', '2024-05-22'), // 30
      makeCycle('2024-05-23', '2024-06-22'), // 30
    ];
    // Previous 3 avg: 26, Last 3 avg: 30, diff: +4 >= 2
    expect(calculateTrend(cycles)).toBe('lengthening');
  });

  it('returns shortening when last 3 average is >= 2 days less than previous 3', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-31'), // 30
      makeCycle('2024-02-01', '2024-03-02'), // 30
      makeCycle('2024-03-03', '2024-04-02'), // 30
      makeCycle('2024-04-03', '2024-04-29'), // 26
      makeCycle('2024-04-30', '2024-05-26'), // 26
      makeCycle('2024-05-27', '2024-06-22'), // 26
    ];
    // Previous 3 avg: 30, Last 3 avg: 26, diff: -4 <= -2
    expect(calculateTrend(cycles)).toBe('shortening');
  });

  it('ignores active cycles (no endDate) when calculating trend', () => {
    const cycles = [
      makeCycle('2024-01-01', '2024-01-28'),
      makeCycle('2024-01-29', '2024-02-26'),
      makeCycle('2024-02-27', '2024-03-27'),
      makeCycle('2024-03-28', '2024-04-25'),
      makeCycle('2024-04-26', '2024-05-24'),
      makeCycle('2024-05-25', null), // active — ignored
    ];
    // Only 5 completed cycles < 6 → stable
    expect(calculateTrend(cycles)).toBe('stable');
  });
});
