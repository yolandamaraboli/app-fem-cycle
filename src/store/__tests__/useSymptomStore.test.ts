import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSymptomStore } from '../useSymptomStore';
import type { SymptomLog } from '../../types';

function createSymptomLog(overrides: Partial<SymptomLog> = {}): SymptomLog {
  return {
    date: '2024-03-15',
    physical: {
      cramps: 2,
      backPain: 1,
      headache: 0,
      bloating: 3,
      breastTenderness: 1,
      fatigue: 2,
      nausea: 0,
      acne: 1,
    },
    emotional: {
      moodSwings: 2,
      anxiety: 1,
      sadness: 0,
      irritability: 3,
      energy: 4,
    },
    hormonal: {
      flow: 'medium',
      cervicalMucus: 'creamy',
    },
    libido: 3,
    appetite: 4,
    sleep: 7.5,
    weight: 62.5,
    temperature: 36.6,
    notes: 'Felt slightly tired today',
    tags: ['exercise', 'hydrated'],
    ...overrides,
  };
}

describe('useSymptomStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSymptomStore.setState({ logs: [] });
  });

  describe('default state', () => {
    it('should initialize with empty logs array', () => {
      const state = useSymptomStore.getState();
      expect(state.logs).toEqual([]);
    });
  });

  describe('saveLog', () => {
    it('should add a new log', () => {
      const log = createSymptomLog();
      useSymptomStore.getState().saveLog(log);

      const state = useSymptomStore.getState();
      expect(state.logs).toHaveLength(1);
      expect(state.logs[0]).toEqual(log);
    });

    it('should upsert an existing log for the same date', () => {
      const log1 = createSymptomLog({ date: '2024-03-15', notes: 'Original' });
      const log2 = createSymptomLog({ date: '2024-03-15', notes: 'Updated' });

      useSymptomStore.getState().saveLog(log1);
      useSymptomStore.getState().saveLog(log2);

      const state = useSymptomStore.getState();
      expect(state.logs).toHaveLength(1);
      expect(state.logs[0].notes).toBe('Updated');
    });

    it('should add logs for different dates without overwriting', () => {
      const log1 = createSymptomLog({ date: '2024-03-15' });
      const log2 = createSymptomLog({ date: '2024-03-16' });
      const log3 = createSymptomLog({ date: '2024-03-17' });

      useSymptomStore.getState().saveLog(log1);
      useSymptomStore.getState().saveLog(log2);
      useSymptomStore.getState().saveLog(log3);

      const state = useSymptomStore.getState();
      expect(state.logs).toHaveLength(3);
    });
  });

  describe('getLogByDate', () => {
    it('should find the correct log by date', () => {
      const log = createSymptomLog({ date: '2024-03-15' });
      useSymptomStore.getState().saveLog(log);

      const found = useSymptomStore.getState().getLogByDate('2024-03-15');
      expect(found).toEqual(log);
    });

    it('should return undefined for a date without a log', () => {
      const log = createSymptomLog({ date: '2024-03-15' });
      useSymptomStore.getState().saveLog(log);

      const found = useSymptomStore.getState().getLogByDate('2024-03-20');
      expect(found).toBeUndefined();
    });

    it('should return undefined when store is empty', () => {
      const found = useSymptomStore.getState().getLogByDate('2024-03-15');
      expect(found).toBeUndefined();
    });
  });

  describe('getLogsByDateRange', () => {
    beforeEach(() => {
      // Add logs for several days
      for (let day = 10; day <= 20; day++) {
        const dateStr = `2024-03-${day.toString().padStart(2, '0')}`;
        useSymptomStore.getState().saveLog(createSymptomLog({ date: dateStr }));
      }
    });

    it('should return logs within the specified range (inclusive)', () => {
      const logs = useSymptomStore.getState().getLogsByDateRange('2024-03-12', '2024-03-15');
      expect(logs).toHaveLength(4); // 12, 13, 14, 15
    });

    it('should return empty array when no logs are in range', () => {
      const logs = useSymptomStore.getState().getLogsByDateRange('2024-04-01', '2024-04-10');
      expect(logs).toHaveLength(0);
    });

    it('should return all logs when range covers all dates', () => {
      const logs = useSymptomStore.getState().getLogsByDateRange('2024-03-01', '2024-03-31');
      expect(logs).toHaveLength(11); // days 10-20
    });

    it('should return a single log when start equals end and log exists', () => {
      const logs = useSymptomStore.getState().getLogsByDateRange('2024-03-15', '2024-03-15');
      expect(logs).toHaveLength(1);
      expect(logs[0].date).toBe('2024-03-15');
    });
  });

  describe('deleteLog', () => {
    it('should remove the log for the specified date', () => {
      const log = createSymptomLog({ date: '2024-03-15' });
      useSymptomStore.getState().saveLog(log);

      useSymptomStore.getState().deleteLog('2024-03-15');

      const state = useSymptomStore.getState();
      expect(state.logs).toHaveLength(0);
    });

    it('should not affect other logs when deleting', () => {
      useSymptomStore.getState().saveLog(createSymptomLog({ date: '2024-03-14' }));
      useSymptomStore.getState().saveLog(createSymptomLog({ date: '2024-03-15' }));
      useSymptomStore.getState().saveLog(createSymptomLog({ date: '2024-03-16' }));

      useSymptomStore.getState().deleteLog('2024-03-15');

      const state = useSymptomStore.getState();
      expect(state.logs).toHaveLength(2);
      expect(state.logs.find((l) => l.date === '2024-03-14')).toBeDefined();
      expect(state.logs.find((l) => l.date === '2024-03-16')).toBeDefined();
    });

    it('should do nothing if date does not exist', () => {
      useSymptomStore.getState().saveLog(createSymptomLog({ date: '2024-03-15' }));

      useSymptomStore.getState().deleteLog('2024-03-20');

      const state = useSymptomStore.getState();
      expect(state.logs).toHaveLength(1);
    });
  });

  describe('persistence round-trip', () => {
    it('should persist logs to localStorage and restore them', () => {
      const log1 = createSymptomLog({ date: '2024-03-15' });
      const log2 = createSymptomLog({ date: '2024-03-16', notes: 'Second day' });

      useSymptomStore.getState().saveLog(log1);
      useSymptomStore.getState().saveLog(log2);

      // Verify data was stored in localStorage
      const stored = localStorage.getItem('app-symptoms');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.logs).toHaveLength(2);
      expect(parsed.state.logs[0].date).toBe('2024-03-15');
      expect(parsed.state.logs[1].date).toBe('2024-03-16');
      expect(parsed.state.logs[1].notes).toBe('Second day');
    });

    it('should preserve all symptom fields through persistence', () => {
      const log = createSymptomLog({
        date: '2024-03-15',
        physical: {
          cramps: 5,
          backPain: 4,
          headache: 3,
          bloating: 2,
          breastTenderness: 1,
          fatigue: 0,
          nausea: 5,
          acne: 4,
        },
        emotional: {
          moodSwings: 5,
          anxiety: 4,
          sadness: 3,
          irritability: 2,
          energy: 1,
        },
        hormonal: {
          flow: 'heavy',
          cervicalMucus: 'eggWhite',
        },
        libido: 5,
        appetite: 0,
        sleep: 10.5,
        weight: 75.3,
        temperature: 37.2,
        notes: 'Detailed notes for testing',
        tags: ['tag1', 'tag2', 'tag3'],
      });

      useSymptomStore.getState().saveLog(log);

      const stored = localStorage.getItem('app-symptoms');
      const parsed = JSON.parse(stored!);
      const restoredLog = parsed.state.logs[0];

      expect(restoredLog).toEqual(log);
    });

    it('should handle localStorage getItem returning null', () => {
      localStorage.removeItem('app-symptoms');

      const state = useSymptomStore.getState();
      expect(state.logs).toEqual([]);
    });
  });

  describe('localStorage error handling', () => {
    it('should handle QuotaExceededError without crashing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const originalSetItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => {
        if (key === 'app-symptoms') {
          const error = new DOMException('Quota exceeded', 'QuotaExceededError');
          throw error;
        }
        originalSetItem(key, value);
      });

      // Should not throw - data remains in memory
      expect(() => {
        useSymptomStore.getState().saveLog(createSymptomLog());
      }).not.toThrow();

      // Data is still in memory even if persistence failed
      const state = useSymptomStore.getState();
      expect(state.logs).toHaveLength(1);

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
        useSymptomStore.getState().saveLog(createSymptomLog());
      }).not.toThrow();

      consoleSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });
});
