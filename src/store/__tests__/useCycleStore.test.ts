import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCycleStore } from '../useCycleStore';
import type { AppSettings } from '../../types';

describe('useCycleStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useCycleStore.setState({
      cycles: [],
      activeCycleId: null,
    });
  });

  describe('default state', () => {
    it('should initialize with empty cycles array', () => {
      const state = useCycleStore.getState();
      expect(state.cycles).toEqual([]);
    });

    it('should initialize with null activeCycleId', () => {
      const state = useCycleStore.getState();
      expect(state.activeCycleId).toBeNull();
    });
  });

  describe('startNewCycle', () => {
    it('should create a new cycle with correct phases', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');

      const state = useCycleStore.getState();
      expect(state.cycles).toHaveLength(1);
      expect(state.activeCycleId).not.toBeNull();

      const cycle = state.cycles[0];
      expect(cycle.startDate).toBe('2024-03-01');
      expect(cycle.endDate).toBeNull();
      expect(cycle.periodDays).toEqual([]);
      expect(cycle.phases).toBeDefined();
      expect(cycle.phases.menstrual).toBeDefined();
      expect(cycle.phases.follicular).toBeDefined();
      expect(cycle.phases.ovulation).toBeDefined();
      expect(cycle.phases.luteal).toBeDefined();
    });

    it('should set activeCycleId to the new cycle id', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');

      const state = useCycleStore.getState();
      expect(state.activeCycleId).toBe(state.cycles[0].id);
    });

    it('should end the previous active cycle when starting a new one', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');
      useCycleStore.getState().startNewCycle('2024-03-28');

      const state = useCycleStore.getState();
      expect(state.cycles).toHaveLength(2);

      // The first cycle should now have an endDate
      const firstCycle = state.cycles[0];
      expect(firstCycle.endDate).toBe('2024-03-28');

      // The second cycle should be active
      const secondCycle = state.cycles[1];
      expect(secondCycle.endDate).toBeNull();
      expect(state.activeCycleId).toBe(secondCycle.id);
    });

    it('should use default cycle length of 28 when no completed cycles exist', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');

      const cycle = useCycleStore.getState().cycles[0];
      expect(cycle.averageCycleLength).toBe(28);
    });

    it('should use default period duration of 5', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');

      const cycle = useCycleStore.getState().cycles[0];
      expect(cycle.periodDuration).toBe(5);
    });
  });

  describe('endCurrentCycle', () => {
    it('should mark the active cycle as complete with endDate', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');
      useCycleStore.getState().endCurrentCycle('2024-03-28');

      const state = useCycleStore.getState();
      expect(state.activeCycleId).toBeNull();
      expect(state.cycles[0].endDate).toBe('2024-03-28');
    });

    it('should do nothing if there is no active cycle', () => {
      useCycleStore.getState().endCurrentCycle('2024-03-28');

      const state = useCycleStore.getState();
      expect(state.cycles).toHaveLength(0);
      expect(state.activeCycleId).toBeNull();
    });
  });

  describe('recalculatePhases', () => {
    it('should update phases with new settings', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');
      const cycleId = useCycleStore.getState().cycles[0].id;
      const originalPhases = { ...useCycleStore.getState().cycles[0].phases };

      const newSettings: AppSettings = {
        cycleLengthAvg: 30,
        periodDurationAvg: 7,
        lutealPhaseDays: 14,
        theme: 'light',
        firstDayOfWeek: 1,
        exportFormat: 'json',
        locale: 'es',
      };

      useCycleStore.getState().recalculatePhases(cycleId, newSettings);

      const updatedCycle = useCycleStore.getState().cycles[0];
      expect(updatedCycle.phases).not.toEqual(originalPhases);
      expect(updatedCycle.averageCycleLength).toBe(30);
      expect(updatedCycle.periodDuration).toBe(7);
    });

    it('should only update the specified cycle', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');
      useCycleStore.getState().startNewCycle('2024-03-28');

      const firstCycleId = useCycleStore.getState().cycles[0].id;
      const secondCycleOriginalPhases = { ...useCycleStore.getState().cycles[1].phases };

      const newSettings: AppSettings = {
        cycleLengthAvg: 26,
        periodDurationAvg: 3,
        lutealPhaseDays: 14,
        theme: 'light',
        firstDayOfWeek: 1,
        exportFormat: 'json',
        locale: 'es',
      };

      useCycleStore.getState().recalculatePhases(firstCycleId, newSettings);

      const state = useCycleStore.getState();
      expect(state.cycles[0].averageCycleLength).toBe(26);
      expect(state.cycles[1].phases).toEqual(secondCycleOriginalPhases);
    });
  });

  describe('getActiveCycle', () => {
    it('should return the active cycle when one exists', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');

      const activeCycle = useCycleStore.getState().getActiveCycle();
      expect(activeCycle).not.toBeNull();
      expect(activeCycle!.startDate).toBe('2024-03-01');
      expect(activeCycle!.endDate).toBeNull();
    });

    it('should return null when no active cycle exists', () => {
      const activeCycle = useCycleStore.getState().getActiveCycle();
      expect(activeCycle).toBeNull();
    });

    it('should return null after ending the cycle', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');
      useCycleStore.getState().endCurrentCycle('2024-03-28');

      const activeCycle = useCycleStore.getState().getActiveCycle();
      expect(activeCycle).toBeNull();
    });
  });

  describe('getCycleHistory', () => {
    it('should return only completed cycles', () => {
      useCycleStore.getState().startNewCycle('2024-01-01');
      useCycleStore.getState().endCurrentCycle('2024-01-28');
      useCycleStore.getState().startNewCycle('2024-02-01');
      useCycleStore.getState().endCurrentCycle('2024-02-28');
      useCycleStore.getState().startNewCycle('2024-03-01');

      const history = useCycleStore.getState().getCycleHistory();
      expect(history).toHaveLength(2);
      history.forEach((cycle) => {
        expect(cycle.endDate).not.toBeNull();
      });
    });

    it('should return empty array when no cycles are completed', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');

      const history = useCycleStore.getState().getCycleHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('persistence round-trip', () => {
    it('should persist cycles to localStorage and restore them', () => {
      useCycleStore.getState().startNewCycle('2024-03-01');
      useCycleStore.getState().endCurrentCycle('2024-03-28');
      useCycleStore.getState().startNewCycle('2024-04-01');

      // Verify data was stored in localStorage
      const stored = localStorage.getItem('app-cycles');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.cycles).toHaveLength(2);
      expect(parsed.state.activeCycleId).not.toBeNull();

      // Verify the cycles data is correct
      expect(parsed.state.cycles[0].startDate).toBe('2024-03-01');
      expect(parsed.state.cycles[0].endDate).toBe('2024-03-28');
      expect(parsed.state.cycles[1].startDate).toBe('2024-04-01');
      expect(parsed.state.cycles[1].endDate).toBeNull();
    });

    it('should handle localStorage getItem returning null gracefully', () => {
      // Clear any stored data
      localStorage.removeItem('app-cycles');

      // The store should work with default empty state
      const state = useCycleStore.getState();
      expect(state.cycles).toEqual([]);
      expect(state.activeCycleId).toBeNull();
    });
  });

  describe('localStorage error handling', () => {
    it('should handle QuotaExceededError without crashing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => {
        if (key === 'app-cycles') {
          const error = new DOMException('Quota exceeded', 'QuotaExceededError');
          throw error;
        }
        originalSetItem(key, value);
      });

      // Should not throw - data remains in memory
      expect(() => {
        useCycleStore.getState().startNewCycle('2024-03-01');
      }).not.toThrow();

      // Data is still in memory even if persistence failed
      const state = useCycleStore.getState();
      expect(state.cycles).toHaveLength(1);

      consoleSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('should handle generic localStorage write errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      // Should not throw
      expect(() => {
        useCycleStore.getState().startNewCycle('2024-03-01');
      }).not.toThrow();

      consoleSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });
});
