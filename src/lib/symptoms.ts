import { parseISO, isWithinInterval, isSameDay } from 'date-fns';
import type {
  SymptomLog,
  Cycle,
  CyclePhases,
  PhaseSummary,
  PhaseData,
  PhysicalSymptoms,
  EmotionalSymptoms,
} from '../types';

const PHYSICAL_KEYS: (keyof PhysicalSymptoms)[] = [
  'cramps',
  'backPain',
  'headache',
  'bloating',
  'breastTenderness',
  'fatigue',
  'nausea',
  'acne',
];

const EMOTIONAL_KEYS: (keyof EmotionalSymptoms)[] = [
  'moodSwings',
  'anxiety',
  'sadness',
  'irritability',
  'energy',
];

/**
 * Checks if a log date falls within a given date range (inclusive).
 */
function isDateInRange(date: string, start: string, end: string): boolean {
  const d = parseISO(date);
  const s = parseISO(start);
  const e = parseISO(end);
  return isWithinInterval(d, { start: s, end: e }) || isSameDay(d, s) || isSameDay(d, e);
}

/**
 * Calculates averages for physical and emotional symptoms from a set of logs.
 * Returns null if the logs array is empty.
 */
function computeAverages(
  logs: SymptomLog[]
): { physicalAvg: Record<keyof PhysicalSymptoms, number>; emotionalAvg: Record<keyof EmotionalSymptoms, number> } | null {
  if (logs.length === 0) return null;

  const physicalAvg = {} as Record<keyof PhysicalSymptoms, number>;
  const emotionalAvg = {} as Record<keyof EmotionalSymptoms, number>;

  for (const key of PHYSICAL_KEYS) {
    const sum = logs.reduce((acc, log) => acc + log.physical[key], 0);
    physicalAvg[key] = sum / logs.length;
  }

  for (const key of EMOTIONAL_KEYS) {
    const sum = logs.reduce((acc, log) => acc + log.emotional[key], 0);
    emotionalAvg[key] = sum / logs.length;
  }

  return { physicalAvg, emotionalAvg };
}

/**
 * Groups symptoms by cycle phase, calculates the arithmetic mean
 * of intensity per category (physical and emotional).
 * Excludes days without records from the calculation.
 * Returns null for phases with no recorded days.
 */
export function generatePhaseSummary(
  logs: SymptomLog[],
  phases: CyclePhases
): PhaseSummary {
  const phaseNames = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;

  const summary = {} as PhaseSummary;

  for (const phase of phaseNames) {
    const range = phases[phase];
    const phaseLogs = logs.filter((log) => isDateInRange(log.date, range.start, range.end));

    if (phaseLogs.length === 0) {
      summary[phase] = null;
    } else {
      const averages = computeAverages(phaseLogs)!;
      summary[phase] = {
        daysWithData: phaseLogs.length,
        physicalAvg: averages.physicalAvg,
        emotionalAvg: averages.emotionalAvg,
      } as PhaseData;
    }
  }

  return summary;
}

/**
 * Requires a minimum of 7 days with records within the cycle date range.
 * A log counts if its date falls within the cycle's startDate to endDate range.
 */
export function hasEnoughDataForSummary(
  logs: SymptomLog[],
  cycle: Cycle
): boolean {
  if (!cycle.endDate) return false;

  const logsInCycle = logs.filter((log) =>
    isDateInRange(log.date, cycle.startDate, cycle.endDate!)
  );

  return logsInCycle.length >= 7;
}

/**
 * Calculates physical and emotional symptom averages for a given date range.
 * Returns null if no logs exist within the date range.
 * Average is the arithmetic mean of each symptom field across all logs in range.
 */
export function calculateAverageSymptoms(
  logs: SymptomLog[],
  startDate: string,
  endDate: string
): { physical: Record<keyof PhysicalSymptoms, number>; emotional: Record<keyof EmotionalSymptoms, number> } | null {
  const filteredLogs = logs.filter((log) => isDateInRange(log.date, startDate, endDate));

  if (filteredLogs.length === 0) return null;

  const averages = computeAverages(filteredLogs)!;

  return {
    physical: averages.physicalAvg,
    emotional: averages.emotionalAvg,
  };
}
