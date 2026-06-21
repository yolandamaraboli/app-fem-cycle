import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, Cycle } from '../types';
import {
  predictPhases,
  calculateAverageCycleLength,
  detectAnomalies,
  calculateTrend,
} from '../lib/cycle';

interface CycleStoreState {
  cycles: Cycle[];
  activeCycleId: string | null;
}

interface CycleStoreActions {
  startNewCycle: (startDate: string) => void;
  endCurrentCycle: (endDate: string) => void;
  recalculatePhases: (cycleId: string, settings: AppSettings) => void;
  getActiveCycle: () => Cycle | null;
  getCycleHistory: () => Cycle[];
  getAverageCycleLength: (count?: number) => number;
  getAnomalies: () => Cycle[];
  getTrend: () => 'shortening' | 'lengthening' | 'stable';
}

const DEFAULT_PERIOD_DURATION = 5;
const DEFAULT_LUTEAL_PHASE_DAYS = 14;

export const useCycleStore = create<CycleStoreState & CycleStoreActions>()(
  persist(
    (set, get) => ({
      cycles: [],
      activeCycleId: null,

      startNewCycle: (startDate: string) => {
        const state = get();

        // End the current active cycle if one exists
        let updatedCycles = [...state.cycles];
        if (state.activeCycleId) {
          updatedCycles = updatedCycles.map((cycle) =>
            cycle.id === state.activeCycleId
              ? { ...cycle, endDate: startDate }
              : cycle
          );
        }

        // Calculate average cycle length from existing completed cycles
        const avgCycleLength = calculateAverageCycleLength(
          updatedCycles,
          3
        );

        const cycleLength = avgCycleLength;
        const periodDuration = DEFAULT_PERIOD_DURATION;
        const lutealPhaseDays = DEFAULT_LUTEAL_PHASE_DAYS;

        // Predict phases for the new cycle
        const phases = predictPhases(
          startDate,
          cycleLength,
          periodDuration,
          lutealPhaseDays
        );

        const newCycle: Cycle = {
          id: crypto.randomUUID(),
          startDate,
          endDate: null,
          periodDays: [],
          phases,
          averageCycleLength: cycleLength,
          periodDuration,
        };

        set({
          cycles: [...updatedCycles, newCycle],
          activeCycleId: newCycle.id,
        });
      },

      endCurrentCycle: (endDate: string) => {
        const state = get();
        if (!state.activeCycleId) return;

        const updatedCycles = state.cycles.map((cycle) =>
          cycle.id === state.activeCycleId
            ? { ...cycle, endDate }
            : cycle
        );

        set({
          cycles: updatedCycles,
          activeCycleId: null,
        });
      },

      recalculatePhases: (cycleId: string, settings: AppSettings) => {
        const state = get();
        const updatedCycles = state.cycles.map((cycle) => {
          if (cycle.id !== cycleId) return cycle;

          const phases = predictPhases(
            cycle.startDate,
            settings.cycleLengthAvg,
            settings.periodDurationAvg,
            settings.lutealPhaseDays
          );

          return {
            ...cycle,
            phases,
            averageCycleLength: settings.cycleLengthAvg,
            periodDuration: settings.periodDurationAvg,
          };
        });

        set({ cycles: updatedCycles });
      },

      getActiveCycle: () => {
        const state = get();
        if (!state.activeCycleId) return null;
        return state.cycles.find((c) => c.id === state.activeCycleId) ?? null;
      },

      getCycleHistory: () => {
        const state = get();
        return state.cycles.filter((c) => c.endDate !== null);
      },

      getAverageCycleLength: (count = 6) => {
        const state = get();
        return calculateAverageCycleLength(state.cycles, count);
      },

      getAnomalies: () => {
        const state = get();
        const completedCycles = state.cycles.filter((c) => c.endDate !== null);
        const avgLength = calculateAverageCycleLength(state.cycles, 6);
        return detectAnomalies(completedCycles, avgLength);
      },

      getTrend: () => {
        const state = get();
        return calculateTrend(state.cycles);
      },
    }),
    {
      name: 'app-cycles',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            if (
              error instanceof DOMException &&
              error.name === 'QuotaExceededError'
            ) {
              console.error(
                '[useCycleStore] QuotaExceededError: localStorage is full. Data was not persisted but remains in memory.'
              );
            } else {
              console.error(
                '[useCycleStore] Failed to persist data to localStorage:',
                error
              );
            }
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
