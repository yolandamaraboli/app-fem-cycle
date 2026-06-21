import { describe, it, expect } from 'vitest';
import {
  generatePhaseSummary,
  hasEnoughDataForSummary,
  calculateAverageSymptoms,
} from '../symptoms';
import type {
  SymptomLog,
  Cycle,
  CyclePhases,
  PhysicalSymptoms,
  EmotionalSymptoms,
} from '../../types';

function makeLog(date: string, physical?: Partial<PhysicalSymptoms>, emotional?: Partial<EmotionalSymptoms>): SymptomLog {
  return {
    date,
    physical: {
      cramps: 0,
      backPain: 0,
      headache: 0,
      bloating: 0,
      breastTenderness: 0,
      fatigue: 0,
      nausea: 0,
      acne: 0,
      ...physical,
    },
    emotional: {
      moodSwings: 0,
      anxiety: 0,
      sadness: 0,
      irritability: 0,
      energy: 0,
      ...emotional,
    },
    hormonal: { flow: 'none', cervicalMucus: 'dry' },
    libido: 0,
    appetite: 0,
    sleep: 8,
    weight: null,
    temperature: null,
    notes: '',
    tags: [],
  };
}

function makePhases(): CyclePhases {
  return {
    menstrual: { start: '2024-01-01', end: '2024-01-05' },
    follicular: { start: '2024-01-06', end: '2024-01-12' },
    ovulation: { start: '2024-01-13', end: '2024-01-15' },
    luteal: { start: '2024-01-16', end: '2024-01-28' },
  };
}

function makeCycle(endDate: string | null = '2024-01-28'): Cycle {
  return {
    id: 'cycle-1',
    startDate: '2024-01-01',
    endDate,
    periodDays: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
    phases: makePhases(),
    averageCycleLength: 28,
    periodDuration: 5,
  };
}

describe('generatePhaseSummary', () => {
  it('returns null for phases with no logs', () => {
    const phases = makePhases();
    const logs: SymptomLog[] = [];

    const result = generatePhaseSummary(logs, phases);

    expect(result.menstrual).toBeNull();
    expect(result.follicular).toBeNull();
    expect(result.ovulation).toBeNull();
    expect(result.luteal).toBeNull();
  });

  it('groups logs by phase and calculates averages', () => {
    const phases = makePhases();
    const logs: SymptomLog[] = [
      makeLog('2024-01-01', { cramps: 4, fatigue: 2 }, { moodSwings: 3 }),
      makeLog('2024-01-03', { cramps: 2, fatigue: 4 }, { moodSwings: 1 }),
      makeLog('2024-01-07', { headache: 3 }, { anxiety: 2 }),
    ];

    const result = generatePhaseSummary(logs, phases);

    expect(result.menstrual).not.toBeNull();
    expect(result.menstrual!.daysWithData).toBe(2);
    expect(result.menstrual!.physicalAvg.cramps).toBe(3); // (4+2)/2
    expect(result.menstrual!.physicalAvg.fatigue).toBe(3); // (2+4)/2
    expect(result.menstrual!.emotionalAvg.moodSwings).toBe(2); // (3+1)/2

    expect(result.follicular).not.toBeNull();
    expect(result.follicular!.daysWithData).toBe(1);
    expect(result.follicular!.physicalAvg.headache).toBe(3);
    expect(result.follicular!.emotionalAvg.anxiety).toBe(2);

    expect(result.ovulation).toBeNull();
    expect(result.luteal).toBeNull();
  });

  it('includes logs on boundary dates', () => {
    const phases = makePhases();
    const logs: SymptomLog[] = [
      makeLog('2024-01-05', { bloating: 2 }), // last day of menstrual
      makeLog('2024-01-06', { bloating: 4 }), // first day of follicular
    ];

    const result = generatePhaseSummary(logs, phases);

    expect(result.menstrual).not.toBeNull();
    expect(result.menstrual!.daysWithData).toBe(1);
    expect(result.menstrual!.physicalAvg.bloating).toBe(2);

    expect(result.follicular).not.toBeNull();
    expect(result.follicular!.daysWithData).toBe(1);
    expect(result.follicular!.physicalAvg.bloating).toBe(4);
  });
});

describe('hasEnoughDataForSummary', () => {
  it('returns false if cycle has no endDate', () => {
    const cycle = makeCycle(null);
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeLog(`2024-01-${String(i + 1).padStart(2, '0')}`)
    );

    expect(hasEnoughDataForSummary(logs, cycle)).toBe(false);
  });

  it('returns false with fewer than 7 logs in cycle range', () => {
    const cycle = makeCycle('2024-01-28');
    const logs = Array.from({ length: 6 }, (_, i) =>
      makeLog(`2024-01-${String(i + 1).padStart(2, '0')}`)
    );

    expect(hasEnoughDataForSummary(logs, cycle)).toBe(false);
  });

  it('returns true with exactly 7 logs in cycle range', () => {
    const cycle = makeCycle('2024-01-28');
    const logs = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2024-01-${String(i + 1).padStart(2, '0')}`)
    );

    expect(hasEnoughDataForSummary(logs, cycle)).toBe(true);
  });

  it('returns true with more than 7 logs in cycle range', () => {
    const cycle = makeCycle('2024-01-28');
    const logs = Array.from({ length: 15 }, (_, i) =>
      makeLog(`2024-01-${String(i + 1).padStart(2, '0')}`)
    );

    expect(hasEnoughDataForSummary(logs, cycle)).toBe(true);
  });

  it('only counts logs within cycle date range', () => {
    const cycle = makeCycle('2024-01-28');
    // 5 logs in range, 5 outside
    const logsInRange = Array.from({ length: 5 }, (_, i) =>
      makeLog(`2024-01-${String(i + 1).padStart(2, '0')}`)
    );
    const logsOutside = Array.from({ length: 5 }, (_, i) =>
      makeLog(`2024-02-${String(i + 1).padStart(2, '0')}`)
    );

    expect(hasEnoughDataForSummary([...logsInRange, ...logsOutside], cycle)).toBe(false);
  });
});

describe('calculateAverageSymptoms', () => {
  it('returns null when no logs in range', () => {
    const logs = [makeLog('2024-02-01', { cramps: 3 })];
    const result = calculateAverageSymptoms(logs, '2024-01-01', '2024-01-31');

    expect(result).toBeNull();
  });

  it('calculates averages for logs in date range', () => {
    const logs = [
      makeLog('2024-01-05', { cramps: 4, headache: 2 }, { anxiety: 3 }),
      makeLog('2024-01-10', { cramps: 2, headache: 4 }, { anxiety: 1 }),
      makeLog('2024-01-15', { cramps: 3, headache: 3 }, { anxiety: 2 }),
    ];

    const result = calculateAverageSymptoms(logs, '2024-01-01', '2024-01-31');

    expect(result).not.toBeNull();
    expect(result!.physical.cramps).toBe(3); // (4+2+3)/3
    expect(result!.physical.headache).toBe(3); // (2+4+3)/3
    expect(result!.emotional.anxiety).toBe(2); // (3+1+2)/3
  });

  it('includes boundary dates in range', () => {
    const logs = [
      makeLog('2024-01-01', { cramps: 2 }),
      makeLog('2024-01-31', { cramps: 4 }),
    ];

    const result = calculateAverageSymptoms(logs, '2024-01-01', '2024-01-31');

    expect(result).not.toBeNull();
    expect(result!.physical.cramps).toBe(3); // (2+4)/2
  });

  it('excludes logs outside the date range', () => {
    const logs = [
      makeLog('2023-12-31', { cramps: 5 }), // before range
      makeLog('2024-01-15', { cramps: 2 }), // in range
      makeLog('2024-02-01', { cramps: 5 }), // after range
    ];

    const result = calculateAverageSymptoms(logs, '2024-01-01', '2024-01-31');

    expect(result).not.toBeNull();
    expect(result!.physical.cramps).toBe(2);
  });
});
