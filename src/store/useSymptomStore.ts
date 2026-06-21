import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SymptomLog } from '../types';

interface SymptomStoreState {
  logs: SymptomLog[];
}

interface SymptomStoreActions {
  saveLog: (log: SymptomLog) => void;
  getLogByDate: (date: string) => SymptomLog | undefined;
  getLogsByDateRange: (start: string, end: string) => SymptomLog[];
  deleteLog: (date: string) => void;
}

export const useSymptomStore = create<SymptomStoreState & SymptomStoreActions>()(
  persist(
    (set, get) => ({
      logs: [],

      saveLog: (log: SymptomLog) => {
        set((state) => {
          const existingIndex = state.logs.findIndex((l) => l.date === log.date);
          if (existingIndex >= 0) {
            // Upsert: replace existing log for the same date
            const updatedLogs = [...state.logs];
            updatedLogs[existingIndex] = log;
            return { logs: updatedLogs };
          }
          // Add new log
          return { logs: [...state.logs, log] };
        });
      },

      getLogByDate: (date: string) => {
        return get().logs.find((log) => log.date === date);
      },

      getLogsByDateRange: (start: string, end: string) => {
        return get().logs.filter((log) => log.date >= start && log.date <= end);
      },

      deleteLog: (date: string) => {
        set((state) => ({
          logs: state.logs.filter((log) => log.date !== date),
        }));
      },
    }),
    {
      name: 'app-symptoms',
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            // Handle QuotaExceededError and other write errors gracefully.
            // Data remains in the in-memory Zustand state even if persistence fails.
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
              console.error('[useSymptomStore] localStorage quota exceeded. Data retained in memory.');
            } else {
              console.error('[useSymptomStore] Failed to persist data to localStorage:', error);
            }
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // Silently handle removal errors
          }
        },
      },
    }
  )
);
