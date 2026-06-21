import { differenceInDays, parseISO } from 'date-fns';
import type { Cycle } from '../types';

/**
 * Calculates pregnancy probability for a given day in the cycle.
 *
 * Algorithm:
 * 1. ovulationDay = cycleLength - lutealPhaseDays
 * 2. currentDayInCycle = differenceInDays(targetDate, cycleStartDate) + 1
 * 3. distance = currentDayInCycle - ovulationDay
 *
 * Levels:
 * - High: |distance| <= 2 (fertile window: 5 total days)
 * - Medium: distance between -5 and -3 (3-5 days before ovulation)
 * - Low: any other day
 */
export function calculatePregnancyProbability(
  targetDate: string,
  cycleStartDate: string,
  cycleLength: number,
  lutealPhaseDays: number
): 'high' | 'medium' | 'low' {
  const ovulationDay = cycleLength - lutealPhaseDays;
  const currentDayInCycle =
    differenceInDays(parseISO(targetDate), parseISO(cycleStartDate)) + 1;
  const distance = currentDayInCycle - ovulationDay;

  if (Math.abs(distance) <= 2) {
    return 'high';
  }

  if (distance >= -5 && distance <= -3) {
    return 'medium';
  }

  return 'low';
}

/**
 * Determines if there is enough data to show the pregnancy probability.
 * Returns true only if there is an active cycle with a startDate.
 */
export function canShowPregnancyProbability(
  activeCycle: Cycle | null
): boolean {
  return activeCycle !== null && !!activeCycle.startDate;
}
