import {
  addDays,
  differenceInDays,
  parseISO,
  format,
  isWithinInterval,
} from 'date-fns';
import type { Cycle, CyclePhases, DateRange } from '../types';

/**
 * Predicts the four cycle phases based on the start date and configuration.
 *
 * Algorithm:
 * 1. Menstrual: startDate → startDate + periodDuration - 1
 * 2. Ovulation day: startDate + cycleLength - lutealPhaseDays - 1
 * 3. Ovulation phase: ovulationDay - 1 → ovulationDay + 1
 * 4. Follicular: end of menstruation + 1 → start of ovulation - 1
 * 5. Luteal: end of ovulation + 1 → startDate + cycleLength - 1
 */
export function predictPhases(
  startDate: string,
  cycleLength: number,
  periodDuration: number,
  lutealPhaseDays: number
): CyclePhases {
  const start = parseISO(startDate);

  // 1. Menstrual phase
  const menstrualStart = start;
  const menstrualEnd = addDays(start, periodDuration - 1);

  // 2. Ovulation day
  const ovulationDay = addDays(start, cycleLength - lutealPhaseDays - 1);

  // 3. Ovulation phase: ovulationDay ± 1
  const ovulationStart = addDays(ovulationDay, -1);
  const ovulationEnd = addDays(ovulationDay, 1);

  // 4. Follicular phase: day after menstruation ends → day before ovulation starts
  const follicularStart = addDays(menstrualEnd, 1);
  const follicularEnd = addDays(ovulationStart, -1);

  // 5. Luteal phase: day after ovulation ends → last day of cycle
  const lutealStart = addDays(ovulationEnd, 1);
  const lutealEnd = addDays(start, cycleLength - 1);

  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  return {
    menstrual: { start: fmt(menstrualStart), end: fmt(menstrualEnd) },
    follicular: { start: fmt(follicularStart), end: fmt(follicularEnd) },
    ovulation: { start: fmt(ovulationStart), end: fmt(ovulationEnd) },
    luteal: { start: fmt(lutealStart), end: fmt(lutealEnd) },
  };
}

/**
 * Calculates the average cycle length of the last `count` completed cycles.
 * Result is clamped to [26, 30].
 */
export function calculateAverageCycleLength(
  cycles: Cycle[],
  count: number
): number {
  const completedCycles = cycles.filter((c) => c.endDate !== null);

  if (completedCycles.length === 0) {
    return 28; // default
  }

  const lastN = completedCycles.slice(-count);

  const totalDays = lastN.reduce((sum, cycle) => {
    const start = parseISO(cycle.startDate);
    const end = parseISO(cycle.endDate!);
    return sum + differenceInDays(end, start);
  }, 0);

  const average = Math.round(totalDays / lastN.length);

  // Clamp to [26, 30]
  return Math.max(26, Math.min(30, average));
}

/**
 * Determines the current cycle phase for a given date.
 * Returns the phase name or null if the date doesn't fall into any phase.
 */
export function getCurrentPhase(
  date: string,
  cycle: Cycle
): keyof CyclePhases | null {
  const target = parseISO(date);
  const phases = cycle.phases;

  const phaseNames: (keyof CyclePhases)[] = [
    'menstrual',
    'follicular',
    'ovulation',
    'luteal',
  ];

  for (const phaseName of phaseNames) {
    const range: DateRange = phases[phaseName];
    const start = parseISO(range.start);
    const end = parseISO(range.end);

    if (isWithinInterval(target, { start, end })) {
      return phaseName;
    }
  }

  return null;
}

/**
 * Detects anomalous cycles: those with deviation > 7 days from the average length.
 */
export function detectAnomalies(
  cycles: Cycle[],
  averageLength: number
): Cycle[] {
  return cycles.filter((cycle) => {
    if (!cycle.endDate) return false;
    const start = parseISO(cycle.startDate);
    const end = parseISO(cycle.endDate);
    const duration = differenceInDays(end, start);
    return Math.abs(duration - averageLength) > 7;
  });
}

/**
 * Calculates the history average: arithmetic mean of the durations
 * of the last min(6, N) completed cycles (unclamped).
 * Returns the raw average or null if no completed cycles exist.
 */
export function calculateHistoryAverage(cycles: Cycle[]): number | null {
  const completedCycles = cycles.filter((c) => c.endDate !== null);

  if (completedCycles.length === 0) {
    return null;
  }

  const count = Math.min(6, completedCycles.length);
  const lastN = completedCycles.slice(-count);

  const totalDays = lastN.reduce((sum, cycle) => {
    const start = parseISO(cycle.startDate);
    const end = parseISO(cycle.endDate!);
    return sum + differenceInDays(end, start);
  }, 0);

  return totalDays / count;
}

/**
 * Calculates variation between consecutive completed cycles.
 * Returns an array of signed differences: duration[i+1] - duration[i]
 * for each adjacent pair.
 */
export function calculateVariation(cycles: Cycle[]): number[] {
  const completedCycles = cycles.filter((c) => c.endDate !== null);

  if (completedCycles.length < 2) {
    return [];
  }

  const getDuration = (cycle: Cycle) => {
    const start = parseISO(cycle.startDate);
    const end = parseISO(cycle.endDate!);
    return differenceInDays(end, start);
  };

  const variations: number[] = [];
  for (let i = 0; i < completedCycles.length - 1; i++) {
    variations.push(getDuration(completedCycles[i + 1]) - getDuration(completedCycles[i]));
  }

  return variations;
}

/**
 * Calculates cycle trend by comparing the average of the last 3 cycles
 * vs the previous 3 cycles.
 *
 * - Difference >= 2 days shorter → 'shortening'
 * - Difference >= 2 days longer → 'lengthening'
 * - Otherwise → 'stable'
 */
export function calculateTrend(
  cycles: Cycle[]
): 'shortening' | 'lengthening' | 'stable' {
  const completedCycles = cycles.filter((c) => c.endDate !== null);

  if (completedCycles.length < 6) {
    return 'stable';
  }

  const last6 = completedCycles.slice(-6);

  const getDuration = (cycle: Cycle) => {
    const start = parseISO(cycle.startDate);
    const end = parseISO(cycle.endDate!);
    return differenceInDays(end, start);
  };

  const previous3 = last6.slice(0, 3);
  const last3 = last6.slice(3, 6);

  const avgPrevious =
    previous3.reduce((sum, c) => sum + getDuration(c), 0) / 3;
  const avgLast = last3.reduce((sum, c) => sum + getDuration(c), 0) / 3;

  const difference = avgLast - avgPrevious;

  if (difference >= 2) {
    return 'lengthening';
  } else if (difference <= -2) {
    return 'shortening';
  }

  return 'stable';
}
