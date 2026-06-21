/**
 * Integration Tests
 * Validates: Requirements 8.2, 8.3, 9.4, 9.5
 *
 * Tests:
 * 1. Full flow: log symptoms → retrieve by date → retrieve by date range → generate summary
 * 2. Export/import data round-trip
 * 3. PWA: valid manifest config and service worker setup
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { useSymptomStore } from '../store/useSymptomStore';
import { useCycleStore } from '../store/useCycleStore';
import { generatePhaseSummary } from '../lib/symptoms';
import { importData } from '../lib/storage';
import { seedDatabase } from '../lib/seed';
import type { SymptomLog } from '../types';

// =============================================
// Full Flow Test: log → calendar → summary
// Validates: Requirements 9.4, 9.5
// =============================================
describe('Integration: Full flow (log → calendar → summary)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset stores to initial state
    useSymptomStore.setState({ logs: [] });
    useCycleStore.setState({ cycles: [], activeCycleId: null });
  });

  it('should save a symptom log and retrieve it by date', () => {
    const log: SymptomLog = {
      date: '2024-03-05',
      physical: {
        cramps: 3, backPain: 2, headache: 1, bloating: 2,
        breastTenderness: 1, fatigue: 3, nausea: 0, acne: 1,
      },
      emotional: {
        moodSwings: 2, anxiety: 1, sadness: 1, irritability: 2, energy: 3,
      },
      hormonal: { flow: 'medium', cervicalMucus: 'dry' },
      libido: 2,
      appetite: 3,
      sleep: 7.5,
      weight: 60.5,
      temperature: 36.4,
      notes: 'Feeling okay today',
      tags: ['exercise', 'hydrated'],
    };

    // Save log via store action
    useSymptomStore.getState().saveLog(log);

    // Retrieve by date (simulates calendar click)
    const retrieved = useSymptomStore.getState().getLogByDate('2024-03-05');
    expect(retrieved).toBeDefined();
    expect(retrieved).toEqual(log);
  });

  it('should retrieve logs by date range (calendar view)', () => {
    const logs: SymptomLog[] = [
      createLog('2024-03-01', 'heavy', 4),
      createLog('2024-03-02', 'medium', 3),
      createLog('2024-03-05', 'light', 2),
      createLog('2024-03-10', 'none', 0),
      createLog('2024-03-15', 'none', 1),
    ];

    for (const log of logs) {
      useSymptomStore.getState().saveLog(log);
    }

    // Query range simulating a calendar week view
    const rangeLogs = useSymptomStore.getState().getLogsByDateRange('2024-03-01', '2024-03-07');
    expect(rangeLogs).toHaveLength(3);
    expect(rangeLogs.map(l => l.date)).toEqual(['2024-03-01', '2024-03-02', '2024-03-05']);
  });

  it('should start a cycle and have phases calculated', () => {
    useCycleStore.getState().startNewCycle('2024-03-01');

    const activeCycle = useCycleStore.getState().getActiveCycle();
    expect(activeCycle).not.toBeNull();
    expect(activeCycle!.phases).toBeDefined();
    expect(activeCycle!.phases.menstrual.start).toBe('2024-03-01');
    expect(activeCycle!.phases.ovulation).toBeDefined();
    expect(activeCycle!.phases.luteal).toBeDefined();
    expect(activeCycle!.phases.follicular).toBeDefined();
  });

  it('should generate a phase summary from logged symptoms', () => {
    // Start a cycle
    useCycleStore.getState().startNewCycle('2024-03-01');
    const cycle = useCycleStore.getState().getActiveCycle()!;

    // Log symptoms covering multiple phases (at least 7 days)
    const logsForSummary: SymptomLog[] = [
      // Menstrual phase days (Mar 1-5 for default 5-day period)
      createLog('2024-03-01', 'heavy', 4),
      createLog('2024-03-02', 'heavy', 3),
      createLog('2024-03-03', 'medium', 3),
      createLog('2024-03-04', 'light', 2),
      createLog('2024-03-05', 'spotting', 1),
      // Follicular phase
      createLog('2024-03-08', 'none', 0),
      createLog('2024-03-09', 'none', 0),
      createLog('2024-03-10', 'none', 1),
      // Ovulation phase (around day 14 from start = Mar 14)
      createLog('2024-03-13', 'none', 1),
      createLog('2024-03-14', 'none', 2),
      // Luteal phase
      createLog('2024-03-20', 'none', 2),
      createLog('2024-03-22', 'none', 3),
    ];

    for (const log of logsForSummary) {
      useSymptomStore.getState().saveLog(log);
    }

    // Generate summary using the cycle's phases
    const allLogs = useSymptomStore.getState().logs;
    const summary = generatePhaseSummary(allLogs, cycle.phases);

    // Menstrual phase should have data
    expect(summary.menstrual).not.toBeNull();
    expect(summary.menstrual!.daysWithData).toBeGreaterThan(0);
    expect(summary.menstrual!.physicalAvg.cramps).toBeGreaterThan(0);
  });
});

// =============================================
// Export/Import Data Test
// Validates: Requirements 9.4, 9.5
// =============================================
describe('Integration: Export/Import data', () => {
  beforeEach(() => {
    localStorage.clear();
    useSymptomStore.setState({ logs: [] });
    useCycleStore.setState({ cycles: [], activeCycleId: null });
  });

  it('should import valid JSON data successfully', () => {
    const validData = JSON.stringify({
      cycles: [
        {
          id: 'test-cycle-1',
          startDate: '2024-01-01',
          endDate: '2024-01-28',
          periodDays: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
          phases: {
            menstrual: { start: '2024-01-01', end: '2024-01-05' },
            follicular: { start: '2024-01-06', end: '2024-01-12' },
            ovulation: { start: '2024-01-13', end: '2024-01-15' },
            luteal: { start: '2024-01-16', end: '2024-01-28' },
          },
          averageCycleLength: 28,
          periodDuration: 5,
        },
      ],
      symptoms: [
        {
          date: '2024-01-01',
          physical: {
            cramps: 3, backPain: 2, headache: 1, bloating: 2,
            breastTenderness: 1, fatigue: 2, nausea: 0, acne: 0,
          },
          emotional: {
            moodSwings: 2, anxiety: 1, sadness: 1, irritability: 2, energy: 3,
          },
          hormonal: { flow: 'heavy', cervicalMucus: 'dry' },
          libido: 1,
          appetite: 3,
          sleep: 7.0,
          weight: null,
          temperature: null,
          notes: '',
          tags: [],
        },
      ],
    });

    const result = importData(validData);
    expect(result.success).toBe(true);
    expect(result.cyclesImported).toBe(1);
    expect(result.logsImported).toBe(1);

    // Verify data was written to localStorage
    const storedCycles = JSON.parse(localStorage.getItem('app-cycles')!);
    expect(storedCycles).toHaveLength(1);
    expect(storedCycles[0].id).toBe('test-cycle-1');
  });

  it('should reject invalid JSON and not modify existing data', () => {
    // Pre-populate localStorage with some data
    localStorage.setItem('app-cycles', JSON.stringify([{
      id: 'existing-cycle',
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      periodDays: [],
      phases: {
        menstrual: { start: '2024-02-01', end: '2024-02-05' },
        follicular: { start: '2024-02-06', end: '2024-02-12' },
        ovulation: { start: '2024-02-13', end: '2024-02-15' },
        luteal: { start: '2024-02-16', end: '2024-02-28' },
      },
      averageCycleLength: 28,
      periodDuration: 5,
    }]));

    // Attempt to import invalid JSON
    const result = importData('{ this is not valid json }');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    // Existing data should remain untouched
    const storedCycles = JSON.parse(localStorage.getItem('app-cycles')!);
    expect(storedCycles).toHaveLength(1);
    expect(storedCycles[0].id).toBe('existing-cycle');
  });

  it('should reject data with invalid structure and not modify existing data', () => {
    localStorage.setItem('app-symptoms', JSON.stringify([
      {
        date: '2024-01-15',
        physical: {
          cramps: 1, backPain: 0, headache: 0, bloating: 0,
          breastTenderness: 0, fatigue: 0, nausea: 0, acne: 0,
        },
        emotional: {
          moodSwings: 0, anxiety: 0, sadness: 0, irritability: 0, energy: 4,
        },
        hormonal: { flow: 'none', cervicalMucus: 'creamy' },
        libido: 3, appetite: 3, sleep: 8.0,
        weight: null, temperature: null, notes: '', tags: [],
      },
    ]));

    // Missing required fields
    const invalidStructure = JSON.stringify({
      cycles: 'not-an-array',
      symptoms: [],
    });

    const result = importData(invalidStructure);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    // Existing symptom data untouched
    const storedSymptoms = JSON.parse(localStorage.getItem('app-symptoms')!);
    expect(storedSymptoms).toHaveLength(1);
    expect(storedSymptoms[0].date).toBe('2024-01-15');
  });

  it('should seed database and then export produces valid data for re-import', () => {
    // Seed populates localStorage with realistic data
    seedDatabase();

    // Read back the seeded data from localStorage
    const cycleData = JSON.parse(localStorage.getItem('app-cycles')!);
    const symptomData = JSON.parse(localStorage.getItem('app-symptoms')!);

    // The seeded data uses Zustand persist format: { state: {...}, version: 0 }
    expect(cycleData.state.cycles.length).toBeGreaterThan(0);
    expect(symptomData.state.logs.length).toBeGreaterThan(0);

    // Create a JSON string as if exported (raw cycles/symptoms arrays)
    const exportJson = JSON.stringify({
      cycles: cycleData.state.cycles,
      symptoms: symptomData.state.logs,
    });

    // Clear and re-import
    localStorage.clear();
    const result = importData(exportJson);
    expect(result.success).toBe(true);
    expect(result.cyclesImported).toBe(cycleData.state.cycles.length);
    expect(result.logsImported).toBe(symptomData.state.logs.length);
  });
});

// =============================================
// PWA Test: manifest and service worker config
// Validates: Requirements 8.2, 8.3
// =============================================

const __testDir = dirname(fileURLToPath(import.meta.url));

describe('Integration: PWA configuration', () => {
  it('should have VitePWA plugin configured in vite.config.ts with required manifest fields', () => {
    const configContent = readFileSync(
      resolve(__testDir, '../../vite.config.ts'),
      'utf-8'
    );

    // Verify VitePWA plugin is imported and used
    expect(configContent).toContain("import { VitePWA } from 'vite-plugin-pwa'");
    expect(configContent).toContain('VitePWA(');

    // Verify required manifest fields are present in config
    expect(configContent).toContain("name: 'Cycle Tracker'");
    expect(configContent).toContain("short_name: 'CycleTrack'");
    expect(configContent).toContain("start_url: '.'");
    expect(configContent).toContain("display: 'standalone'");
    expect(configContent).toContain("orientation: 'any'");
    expect(configContent).toContain("theme_color: '#EE6B8A'");
    expect(configContent).toContain("background_color: '#F8F9FC'");
    // Icon sizes
    expect(configContent).toContain("sizes: '192x192'");
    expect(configContent).toContain("sizes: '512x512'");
    expect(configContent).toContain("purpose: 'maskable'");
  });

  it('should have VitePWA configured with NetworkFirst strategy for service worker', () => {
    const configContent = readFileSync(
      resolve(__testDir, '../../vite.config.ts'),
      'utf-8'
    );

    // Verify service worker caching strategy
    expect(configContent).toContain("handler: 'NetworkFirst'");
    expect(configContent).toContain('workbox');
    expect(configContent).toContain('globPatterns');
  });

  it('should have required PWA icon files in public directory', () => {
    const publicDir = resolve(__testDir, '../../public');

    // Check required icon files exist
    expect(existsSync(join(publicDir, 'icon.svg'))).toBe(true);
    expect(existsSync(join(publicDir, 'pwa-192x192.svg'))).toBe(true);
    expect(existsSync(join(publicDir, 'pwa-512x512.svg'))).toBe(true);
  });

  it('should have icon.svg as valid SVG content', () => {
    const iconPath = join(resolve(__testDir, '../../public'), 'icon.svg');
    const content = readFileSync(iconPath, 'utf-8');

    // Valid SVG starts with <svg or has XML declaration followed by <svg
    expect(content).toMatch(/<svg[\s>]/);
  });
});

// =============================================
// Helper function
// =============================================
function createLog(date: string, flow: string, cramps: number): SymptomLog {
  return {
    date,
    physical: {
      cramps,
      backPain: Math.max(0, cramps - 1),
      headache: 0,
      bloating: Math.min(5, cramps),
      breastTenderness: 0,
      fatigue: Math.min(5, cramps + 1),
      nausea: 0,
      acne: 0,
    },
    emotional: {
      moodSwings: Math.min(5, cramps),
      anxiety: 0,
      sadness: 0,
      irritability: Math.max(0, cramps - 1),
      energy: Math.max(0, 5 - cramps),
    },
    hormonal: {
      flow: flow as SymptomLog['hormonal']['flow'],
      cervicalMucus: 'dry',
    },
    libido: 2,
    appetite: 3,
    sleep: 7.5,
    weight: null,
    temperature: null,
    notes: '',
    tags: [],
  };
}
