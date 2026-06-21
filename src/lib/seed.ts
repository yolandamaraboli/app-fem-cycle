import { addDays, format, subDays } from 'date-fns';
import { predictPhases } from './cycle';
import type {
  Cycle,
  SymptomLog,
  FlowLevel,
  MucusType,
  PhysicalSymptoms,
  EmotionalSymptoms,
  HormonalSymptoms,
} from '../types';

/**
 * Generates a simple pseudo-random number based on a seed string.
 * Used for deterministic but varied symptom values.
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash % 100) / 100;
}

/**
 * Generates a random integer between min and max (inclusive) based on a seed.
 */
function seededInt(seed: string, min: number, max: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

/**
 * Picks a random item from an array based on a seed.
 */
function seededPick<T>(seed: string, items: T[]): T {
  const index = Math.floor(seededRandom(seed) * items.length);
  return items[index];
}

/**
 * Determines the cycle phase for a given day index within a cycle.
 */
function getPhaseForDay(
  dayIndex: number,
  periodDuration: number,
  cycleLength: number,
  lutealPhaseDays: number
): 'menstrual' | 'follicular' | 'ovulation' | 'luteal' {
  if (dayIndex < periodDuration) return 'menstrual';
  const ovulationDay = cycleLength - lutealPhaseDays - 1;
  if (dayIndex >= ovulationDay - 1 && dayIndex <= ovulationDay + 1) return 'ovulation';
  if (dayIndex < ovulationDay - 1) return 'follicular';
  return 'luteal';
}

/**
 * Generates realistic physical symptoms based on cycle phase.
 */
function generatePhysicalSymptoms(phase: string, daySeed: string): PhysicalSymptoms {
  switch (phase) {
    case 'menstrual':
      return {
        cramps: seededInt(daySeed + 'cramps', 2, 5),
        backPain: seededInt(daySeed + 'back', 1, 4),
        headache: seededInt(daySeed + 'head', 0, 3),
        bloating: seededInt(daySeed + 'bloat', 2, 4),
        breastTenderness: seededInt(daySeed + 'breast', 1, 3),
        fatigue: seededInt(daySeed + 'fatigue', 2, 5),
        nausea: seededInt(daySeed + 'nausea', 0, 2),
        acne: seededInt(daySeed + 'acne', 0, 2),
      };
    case 'follicular':
      return {
        cramps: seededInt(daySeed + 'cramps', 0, 1),
        backPain: seededInt(daySeed + 'back', 0, 1),
        headache: seededInt(daySeed + 'head', 0, 1),
        bloating: seededInt(daySeed + 'bloat', 0, 1),
        breastTenderness: seededInt(daySeed + 'breast', 0, 1),
        fatigue: seededInt(daySeed + 'fatigue', 0, 2),
        nausea: seededInt(daySeed + 'nausea', 0, 0),
        acne: seededInt(daySeed + 'acne', 0, 1),
      };
    case 'ovulation':
      return {
        cramps: seededInt(daySeed + 'cramps', 0, 2),
        backPain: seededInt(daySeed + 'back', 0, 1),
        headache: seededInt(daySeed + 'head', 0, 1),
        bloating: seededInt(daySeed + 'bloat', 1, 2),
        breastTenderness: seededInt(daySeed + 'breast', 1, 3),
        fatigue: seededInt(daySeed + 'fatigue', 0, 1),
        nausea: seededInt(daySeed + 'nausea', 0, 1),
        acne: seededInt(daySeed + 'acne', 0, 1),
      };
    case 'luteal':
      return {
        cramps: seededInt(daySeed + 'cramps', 0, 3),
        backPain: seededInt(daySeed + 'back', 0, 2),
        headache: seededInt(daySeed + 'head', 1, 3),
        bloating: seededInt(daySeed + 'bloat', 2, 4),
        breastTenderness: seededInt(daySeed + 'breast', 2, 4),
        fatigue: seededInt(daySeed + 'fatigue', 1, 3),
        nausea: seededInt(daySeed + 'nausea', 0, 2),
        acne: seededInt(daySeed + 'acne', 1, 3),
      };
    default:
      return {
        cramps: 0, backPain: 0, headache: 0, bloating: 0,
        breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0,
      };
  }
}

/**
 * Generates realistic emotional symptoms based on cycle phase.
 */
function generateEmotionalSymptoms(phase: string, daySeed: string): EmotionalSymptoms {
  switch (phase) {
    case 'menstrual':
      return {
        moodSwings: seededInt(daySeed + 'mood', 2, 4),
        anxiety: seededInt(daySeed + 'anx', 1, 3),
        sadness: seededInt(daySeed + 'sad', 1, 4),
        irritability: seededInt(daySeed + 'irr', 2, 4),
        energy: seededInt(daySeed + 'energy', 1, 2),
      };
    case 'follicular':
      return {
        moodSwings: seededInt(daySeed + 'mood', 0, 1),
        anxiety: seededInt(daySeed + 'anx', 0, 1),
        sadness: seededInt(daySeed + 'sad', 0, 1),
        irritability: seededInt(daySeed + 'irr', 0, 1),
        energy: seededInt(daySeed + 'energy', 3, 5),
      };
    case 'ovulation':
      return {
        moodSwings: seededInt(daySeed + 'mood', 0, 2),
        anxiety: seededInt(daySeed + 'anx', 0, 1),
        sadness: seededInt(daySeed + 'sad', 0, 1),
        irritability: seededInt(daySeed + 'irr', 0, 1),
        energy: seededInt(daySeed + 'energy', 3, 5),
      };
    case 'luteal':
      return {
        moodSwings: seededInt(daySeed + 'mood', 2, 4),
        anxiety: seededInt(daySeed + 'anx', 1, 3),
        sadness: seededInt(daySeed + 'sad', 1, 3),
        irritability: seededInt(daySeed + 'irr', 2, 4),
        energy: seededInt(daySeed + 'energy', 1, 3),
      };
    default:
      return { moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 3 };
  }
}

/**
 * Generates realistic hormonal symptoms based on cycle phase and day.
 */
function generateHormonalSymptoms(
  phase: string,
  dayInPhase: number,
  _periodDuration: number,
  daySeed: string
): HormonalSymptoms {
  let flow: FlowLevel;
  let cervicalMucus: MucusType;

  if (phase === 'menstrual') {
    const flowPatterns: FlowLevel[][] = [
      ['medium', 'heavy', 'heavy', 'medium', 'light', 'spotting', 'spotting'],
      ['light', 'medium', 'heavy', 'medium', 'light', 'spotting', 'none'],
      ['medium', 'heavy', 'medium', 'light', 'spotting', 'none', 'none'],
    ];
    const pattern = flowPatterns[seededInt(daySeed + 'fp', 0, flowPatterns.length - 1)];
    flow = dayInPhase < pattern.length ? pattern[dayInPhase] : 'none';
    cervicalMucus = 'dry';
  } else if (phase === 'follicular') {
    flow = 'none';
    cervicalMucus = seededPick(daySeed + 'mucus', ['dry', 'sticky', 'creamy'] as MucusType[]);
  } else if (phase === 'ovulation') {
    flow = 'none';
    cervicalMucus = seededPick(daySeed + 'mucus', ['eggWhite', 'watery'] as MucusType[]);
  } else {
    flow = 'none';
    cervicalMucus = seededPick(daySeed + 'mucus', ['sticky', 'creamy', 'dry'] as MucusType[]);
  }

  return { flow, cervicalMucus };
}

/**
 * Generates 6 simulated completed cycles with realistic data.
 */
function generateCycles(): Cycle[] {
  const cycleLengths = [28, 27, 29, 28, 26, 30];
  const periodDurations = [5, 4, 5, 6, 4, 5];
  const lutealPhaseDays = 14;

  const today = new Date();
  const cycles: Cycle[] = [];

  // Calculate total days needed for 6 cycles going backwards from today
  const totalDays = cycleLengths.reduce((sum, len) => sum + len, 0);
  let currentStart = subDays(today, totalDays + 5); // Start a few days earlier

  for (let i = 0; i < 6; i++) {
    const cycleLength = cycleLengths[i];
    const periodDuration = periodDurations[i];
    const startDate = format(currentStart, 'yyyy-MM-dd');
    const endDate = format(addDays(currentStart, cycleLength - 1), 'yyyy-MM-dd');

    const phases = predictPhases(startDate, cycleLength, periodDuration, lutealPhaseDays);

    // Generate period days
    const periodDays: string[] = [];
    for (let d = 0; d < periodDuration; d++) {
      periodDays.push(format(addDays(currentStart, d), 'yyyy-MM-dd'));
    }

    const cycle: Cycle = {
      id: crypto.randomUUID(),
      startDate,
      endDate,
      periodDays,
      phases,
      averageCycleLength: 28,
      periodDuration,
    };

    cycles.push(cycle);
    currentStart = addDays(currentStart, cycleLength);
  }

  return cycles;
}

/**
 * Generates varied symptom logs for all cycles.
 * Creates logs for at least 10 days per cycle to ensure enough data for summaries.
 */
function generateSymptomLogs(cycles: Cycle[]): SymptomLog[] {
  const logs: SymptomLog[] = [];
  const lutealPhaseDays = 14;

  for (let cycleIdx = 0; cycleIdx < cycles.length; cycleIdx++) {
    const cycle = cycles[cycleIdx];
    const cycleLength = cycle.endDate
      ? Math.round(
          (new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 28;

    const startDate = new Date(cycle.startDate);

    // Log symptoms for most days in the cycle (skip a few for realism)
    for (let dayIdx = 0; dayIdx < cycleLength; dayIdx++) {
      // Skip some days randomly for realism (about 20% skip rate)
      const skipSeed = `skip-${cycleIdx}-${dayIdx}`;
      if (seededRandom(skipSeed) < 0.15 && dayIdx > 0) continue;

      const currentDate = addDays(startDate, dayIdx);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const daySeed = `cycle${cycleIdx}-day${dayIdx}`;

      const phase = getPhaseForDay(dayIdx, cycle.periodDuration, cycleLength, lutealPhaseDays);
      const dayInPhase = phase === 'menstrual' ? dayIdx : dayIdx % 5;

      const physical = generatePhysicalSymptoms(phase, daySeed);
      const emotional = generateEmotionalSymptoms(phase, daySeed);
      const hormonal = generateHormonalSymptoms(phase, dayInPhase, cycle.periodDuration, daySeed);

      const log: SymptomLog = {
        date: dateStr,
        physical,
        emotional,
        hormonal,
        libido: phase === 'ovulation'
          ? seededInt(daySeed + 'libido', 3, 5)
          : phase === 'menstrual'
            ? seededInt(daySeed + 'libido', 0, 2)
            : seededInt(daySeed + 'libido', 1, 4),
        appetite: phase === 'luteal'
          ? seededInt(daySeed + 'appetite', 3, 5)
          : seededInt(daySeed + 'appetite', 2, 4),
        sleep: phase === 'menstrual'
          ? seededInt(daySeed + 'sleep', 12, 18) * 0.5  // 6-9 hours
          : seededInt(daySeed + 'sleep', 13, 16) * 0.5, // 6.5-8 hours
        weight: seededRandom(daySeed + 'hasWeight') > 0.6
          ? Math.round((55 + seededRandom(daySeed + 'weight') * 5) * 10) / 10
          : null,
        temperature: seededRandom(daySeed + 'hasTemp') > 0.5
          ? Math.round(
              (phase === 'luteal' || phase === 'ovulation'
                ? 36.4 + seededRandom(daySeed + 'temp') * 0.8
                : 36.0 + seededRandom(daySeed + 'temp') * 0.5) * 10
            ) / 10
          : null,
        notes: '',
        tags: [],
      };

      logs.push(log);
    }
  }

  return logs;
}

/**
 * Populates localStorage with sample cycle and symptom data for development.
 * Data is stored in the Zustand persist middleware format.
 */
export function seedDatabase(): void {
  const cycles = generateCycles();
  const symptoms = generateSymptomLogs(cycles);

  // Store in Zustand persist middleware format
  const cycleData = {
    state: { cycles, activeCycleId: null },
    version: 0,
  };

  const symptomData = {
    state: { logs: symptoms },
    version: 0,
  };

  localStorage.setItem('app-cycles', JSON.stringify(cycleData));
  localStorage.setItem('app-symptoms', JSON.stringify(symptomData));

  console.log(`[Seed] Database populated successfully:`);
  console.log(`  - ${cycles.length} cycles generated`);
  console.log(`  - ${symptoms.length} symptom logs generated`);
  console.log(`  - Date range: ${cycles[0].startDate} to ${cycles[cycles.length - 1].endDate}`);
}

/**
 * Removes all app data from localStorage.
 */
export function clearDatabase(): void {
  localStorage.removeItem('app-cycles');
  localStorage.removeItem('app-symptoms');
  localStorage.removeItem('app-settings');
  localStorage.removeItem('app-onboarding');

  console.log('[Seed] Database cleared successfully.');
}
