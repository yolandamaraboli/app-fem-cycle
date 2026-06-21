import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateStorageData,
  exportAllData,
  importData,
  checkStorageAvailability,
  getPhaseColor,
} from '../storage';

// Helper to create a valid cycle object
function createValidCycle(overrides = {}) {
  return {
    id: 'cycle-1',
    startDate: '2024-01-01',
    endDate: '2024-01-28',
    periodDays: ['2024-01-01', '2024-01-02', '2024-01-03'],
    phases: {
      menstrual: { start: '2024-01-01', end: '2024-01-05' },
      follicular: { start: '2024-01-06', end: '2024-01-13' },
      ovulation: { start: '2024-01-14', end: '2024-01-16' },
      luteal: { start: '2024-01-17', end: '2024-01-28' },
    },
    averageCycleLength: 28,
    periodDuration: 5,
    ...overrides,
  };
}

// Helper to create a valid symptom log
function createValidSymptomLog(overrides = {}) {
  return {
    date: '2024-01-01',
    physical: {
      cramps: 2,
      backPain: 1,
      headache: 0,
      bloating: 3,
      breastTenderness: 0,
      fatigue: 2,
      nausea: 0,
      acne: 1,
    },
    emotional: {
      moodSwings: 2,
      anxiety: 1,
      sadness: 0,
      irritability: 3,
      energy: 2,
    },
    hormonal: {
      flow: 'medium',
      cervicalMucus: 'creamy',
    },
    libido: 3,
    appetite: 4,
    sleep: 7.5,
    weight: 60.5,
    temperature: 36.5,
    notes: 'Feeling okay',
    tags: ['exercise', 'hydrated'],
    ...overrides,
  };
}

// Helper for valid settings
function createValidSettings(overrides = {}) {
  return {
    cycleLengthAvg: 28,
    periodDurationAvg: 5,
    lutealPhaseDays: 14,
    theme: 'light',
    firstDayOfWeek: 1,
    exportFormat: 'json',
    locale: 'es',
    ...overrides,
  };
}

describe('validateStorageData', () => {
  it('returns valid for correct data with cycles, symptoms, and settings', () => {
    const data = {
      cycles: [createValidCycle()],
      symptoms: [createValidSymptomLog()],
      settings: createValidSettings(),
    };
    const result = validateStorageData(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid for non-object data', () => {
    const result = validateStorageData(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Data must be an object');
  });

  it('returns invalid when cycles is not an array', () => {
    const result = validateStorageData({ cycles: 'not-array' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('cycles must be an array');
  });

  it('returns invalid for cycle with missing id', () => {
    const result = validateStorageData({ cycles: [createValidCycle({ id: 123 })] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('id'))).toBe(true);
  });

  it('returns invalid for cycle with invalid phases', () => {
    const result = validateStorageData({ cycles: [createValidCycle({ phases: null })] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('phases'))).toBe(true);
  });

  it('returns invalid for symptom log with missing physical', () => {
    const result = validateStorageData({ symptoms: [createValidSymptomLog({ physical: null })] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('physical'))).toBe(true);
  });

  it('returns invalid for settings with invalid theme', () => {
    const result = validateStorageData({ settings: createValidSettings({ theme: 'blue' }) });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('theme'))).toBe(true);
  });

  it('returns valid for empty arrays', () => {
    const result = validateStorageData({ cycles: [], symptoms: [] });
    expect(result.valid).toBe(true);
  });
});

describe('importData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns error for invalid JSON', () => {
    const result = importData('not json at all');
    expect(result.success).toBe(false);
    expect(result.error).toBe('The file does not have a valid JSON format');
  });

  it('returns error for non-object JSON', () => {
    const result = importData('"just a string"');
    expect(result.success).toBe(false);
    expect(result.error).toBe('The file does not have a valid JSON format');
  });

  it('returns error when cycles field is missing', () => {
    const result = importData(JSON.stringify({ symptoms: [] }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('cycles');
  });

  it('returns error when symptoms field is missing', () => {
    const result = importData(JSON.stringify({ cycles: [] }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('symptoms');
  });

  it('successfully imports valid data', () => {
    const data = {
      cycles: [createValidCycle()],
      symptoms: [createValidSymptomLog()],
      settings: createValidSettings(),
    };
    const result = importData(JSON.stringify(data));
    expect(result.success).toBe(true);
    expect(result.cyclesImported).toBe(1);
    expect(result.logsImported).toBe(1);
  });

  it('overwrites localStorage on successful import', () => {
    const data = {
      cycles: [createValidCycle()],
      symptoms: [createValidSymptomLog(), createValidSymptomLog({ date: '2024-01-02' })],
    };
    importData(JSON.stringify(data));
    const stored = JSON.parse(localStorage.getItem('app-cycles') || '[]');
    expect(stored).toHaveLength(1);
    const storedSymptoms = JSON.parse(localStorage.getItem('app-symptoms') || '[]');
    expect(storedSymptoms).toHaveLength(2);
  });

  it('returns error for invalid cycle structure in import', () => {
    const data = {
      cycles: [{ id: 123 }], // invalid id type
      symptoms: [],
    };
    const result = importData(JSON.stringify(data));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid structure');
  });
});

describe('exportAllData', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock URL methods that don't exist in jsdom
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    // Mock document methods for download
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node);
  });

  it('exports JSON format without errors', () => {
    localStorage.setItem('app-cycles', JSON.stringify([createValidCycle()]));
    localStorage.setItem('app-symptoms', JSON.stringify([createValidSymptomLog()]));
    localStorage.setItem('app-settings', JSON.stringify(createValidSettings()));

    expect(() => exportAllData('json')).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('exports CSV format without errors', () => {
    localStorage.setItem('app-cycles', JSON.stringify([createValidCycle()]));
    localStorage.setItem('app-symptoms', JSON.stringify([createValidSymptomLog()]));

    expect(() => exportAllData('csv')).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});

describe('checkStorageAvailability', () => {
  it('returns true when localStorage is available', () => {
    expect(checkStorageAvailability()).toBe(true);
  });

  it('returns false when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(checkStorageAvailability()).toBe(false);
    vi.restoreAllMocks();
  });
});

describe('getPhaseColor', () => {
  it('returns correct color for menstrual', () => {
    expect(getPhaseColor('menstrual')).toBe('#FA6364');
  });

  it('returns correct color for follicular', () => {
    expect(getPhaseColor('follicular')).toBe('#FFB04C');
  });

  it('returns correct color for ovulation', () => {
    expect(getPhaseColor('ovulation')).toBe('#4ECDC4');
  });

  it('returns correct color for luteal', () => {
    expect(getPhaseColor('luteal')).toBe('#9B7ED8');
  });
});
