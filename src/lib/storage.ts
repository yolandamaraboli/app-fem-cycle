import { format } from 'date-fns';
import type {
  Cycle,
  CyclePhases,
  SymptomLog,
  AppSettings,
  ValidationResult,
  ImportResult,
} from '../types';

const STORAGE_KEYS = {
  cycles: 'app-cycles',
  symptoms: 'app-symptoms',
  settings: 'app-settings',
} as const;

// === Validation Helpers ===

function isValidDateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateDateRange(range: unknown, path: string, errors: string[]): boolean {
  if (!range || typeof range !== 'object') {
    errors.push(`${path} must be an object with start and end`);
    return false;
  }
  const r = range as Record<string, unknown>;
  if (!isValidDateString(r.start)) {
    errors.push(`${path}.start must be a valid ISO date string`);
  }
  if (!isValidDateString(r.end)) {
    errors.push(`${path}.end must be a valid ISO date string`);
  }
  return errors.length === 0;
}

function validateCyclePhases(phases: unknown, path: string, errors: string[]): void {
  if (!phases || typeof phases !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  const p = phases as Record<string, unknown>;
  const requiredPhases: (keyof CyclePhases)[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];
  for (const phase of requiredPhases) {
    if (!(phase in p)) {
      errors.push(`${path}.${phase} is required`);
    } else {
      validateDateRange(p[phase], `${path}.${phase}`, errors);
    }
  }
}

function validateCycle(cycle: unknown, index: number, errors: string[]): void {
  const path = `cycles[${index}]`;
  if (!cycle || typeof cycle !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  const c = cycle as Record<string, unknown>;

  if (typeof c.id !== 'string' || c.id.length === 0) {
    errors.push(`${path}.id is required and must be a string`);
  }
  if (!isValidDateString(c.startDate)) {
    errors.push(`${path}.startDate must be a valid ISO date string`);
  }
  if (c.endDate !== null && !isValidDateString(c.endDate)) {
    errors.push(`${path}.endDate must be a valid ISO date string or null`);
  }
  if (!Array.isArray(c.periodDays)) {
    errors.push(`${path}.periodDays must be an array`);
  }
  if (!c.phases || typeof c.phases !== 'object') {
    errors.push(`${path}.phases is required`);
  } else {
    validateCyclePhases(c.phases, `${path}.phases`, errors);
  }
  if (typeof c.averageCycleLength !== 'number') {
    errors.push(`${path}.averageCycleLength must be a number`);
  }
  if (typeof c.periodDuration !== 'number') {
    errors.push(`${path}.periodDuration must be a number`);
  }
}

function validateScaleValue(value: unknown, path: string, min: number, max: number, errors: string[]): void {
  if (typeof value !== 'number') {
    errors.push(`${path} must be a number`);
    return;
  }
  if (!Number.isInteger(value) || value < min || value > max) {
    errors.push(`${path} must be an integer between ${min} and ${max}`);
  }
}

function validatePhysicalSymptoms(physical: unknown, path: string, errors: string[]): void {
  if (!physical || typeof physical !== 'object') {
    errors.push(`${path} is required and must be an object`);
    return;
  }
  const p = physical as Record<string, unknown>;
  const fields = ['cramps', 'backPain', 'headache', 'bloating', 'breastTenderness', 'fatigue', 'nausea', 'acne'];
  for (const field of fields) {
    validateScaleValue(p[field], `${path}.${field}`, 0, 5, errors);
  }
}

function validateEmotionalSymptoms(emotional: unknown, path: string, errors: string[]): void {
  if (!emotional || typeof emotional !== 'object') {
    errors.push(`${path} is required and must be an object`);
    return;
  }
  const e = emotional as Record<string, unknown>;
  const fields = ['moodSwings', 'anxiety', 'sadness', 'irritability', 'energy'];
  for (const field of fields) {
    validateScaleValue(e[field], `${path}.${field}`, 0, 5, errors);
  }
}

function validateHormonalSymptoms(hormonal: unknown, path: string, errors: string[]): void {
  if (!hormonal || typeof hormonal !== 'object') {
    errors.push(`${path} is required and must be an object`);
    return;
  }
  const h = hormonal as Record<string, unknown>;
  const validFlows = ['none', 'light', 'medium', 'heavy', 'spotting'];
  const validMucus = ['dry', 'sticky', 'creamy', 'eggWhite', 'watery'];
  if (!validFlows.includes(h.flow as string)) {
    errors.push(`${path}.flow must be one of: ${validFlows.join(', ')}`);
  }
  if (!validMucus.includes(h.cervicalMucus as string)) {
    errors.push(`${path}.cervicalMucus must be one of: ${validMucus.join(', ')}`);
  }
}

function validateSymptomLog(log: unknown, index: number, errors: string[]): void {
  const path = `symptoms[${index}]`;
  if (!log || typeof log !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  const l = log as Record<string, unknown>;

  if (!isValidDateString(l.date)) {
    errors.push(`${path}.date must be a valid ISO date string`);
  }

  validatePhysicalSymptoms(l.physical, `${path}.physical`, errors);
  validateEmotionalSymptoms(l.emotional, `${path}.emotional`, errors);
  validateHormonalSymptoms(l.hormonal, `${path}.hormonal`, errors);

  // Libido and appetite: 0-5 integer
  validateScaleValue(l.libido, `${path}.libido`, 0, 5, errors);
  validateScaleValue(l.appetite, `${path}.appetite`, 0, 5, errors);

  // Sleep: 0-24, increments of 0.5
  if (typeof l.sleep !== 'number') {
    errors.push(`${path}.sleep must be a number`);
  } else if (l.sleep < 0 || l.sleep > 24 || (l.sleep * 2) % 1 !== 0) {
    errors.push(`${path}.sleep must be between 0 and 24 in 0.5 increments`);
  }

  // Weight: null or 30.0-300.0
  if (l.weight !== null) {
    if (typeof l.weight !== 'number') {
      errors.push(`${path}.weight must be a number or null`);
    } else if (l.weight < 30.0 || l.weight > 300.0) {
      errors.push(`${path}.weight must be between 30.0 and 300.0`);
    }
  }

  // Temperature: null or 35.0-42.0
  if (l.temperature !== null) {
    if (typeof l.temperature !== 'number') {
      errors.push(`${path}.temperature must be a number or null`);
    } else if (l.temperature < 35.0 || l.temperature > 42.0) {
      errors.push(`${path}.temperature must be between 35.0 and 42.0`);
    }
  }

  // Notes: string, max 500 chars
  if (typeof l.notes !== 'string') {
    errors.push(`${path}.notes must be a string`);
  } else if ((l.notes as string).length > 500) {
    errors.push(`${path}.notes must be at most 500 characters`);
  }

  // Tags: array, max 10, each max 30 chars
  if (!Array.isArray(l.tags)) {
    errors.push(`${path}.tags must be an array`);
  } else {
    if ((l.tags as unknown[]).length > 10) {
      errors.push(`${path}.tags must have at most 10 elements`);
    }
    for (let i = 0; i < (l.tags as unknown[]).length; i++) {
      const tag = (l.tags as unknown[])[i];
      if (typeof tag !== 'string') {
        errors.push(`${path}.tags[${i}] must be a string`);
      } else if (tag.length > 30) {
        errors.push(`${path}.tags[${i}] must be at most 30 characters`);
      }
    }
  }
}

function validateSettings(settings: unknown, errors: string[]): void {
  if (!settings || typeof settings !== 'object') {
    errors.push('settings must be an object');
    return;
  }
  const s = settings as Record<string, unknown>;

  if (typeof s.cycleLengthAvg !== 'number') {
    errors.push('settings.cycleLengthAvg must be a number');
  }
  if (typeof s.periodDurationAvg !== 'number') {
    errors.push('settings.periodDurationAvg must be a number');
  }
  if (typeof s.lutealPhaseDays !== 'number') {
    errors.push('settings.lutealPhaseDays must be a number');
  }
  if (s.theme !== 'light' && s.theme !== 'dark') {
    errors.push('settings.theme must be "light" or "dark"');
  }
  if (s.firstDayOfWeek !== 0 && s.firstDayOfWeek !== 1) {
    errors.push('settings.firstDayOfWeek must be 0 or 1');
  }
  if (s.exportFormat !== 'json' && s.exportFormat !== 'csv') {
    errors.push('settings.exportFormat must be "json" or "csv"');
  }
  if (s.locale !== 'en' && s.locale !== 'es') {
    errors.push('settings.locale must be "en" or "es"');
  }
}

// === Public Functions ===

export function validateStorageData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const d = data as Record<string, unknown>;

  // Validate cycles
  if ('cycles' in d) {
    if (!Array.isArray(d.cycles)) {
      errors.push('cycles must be an array');
    } else {
      d.cycles.forEach((cycle, i) => validateCycle(cycle, i, errors));
    }
  }

  // Validate symptoms
  if ('symptoms' in d) {
    if (!Array.isArray(d.symptoms)) {
      errors.push('symptoms must be an array');
    } else {
      d.symptoms.forEach((log, i) => validateSymptomLog(log, i, errors));
    }
  }

  // Validate settings
  if ('settings' in d) {
    validateSettings(d.settings, errors);
  }

  return { valid: errors.length === 0, errors };
}

export function exportAllData(exportFormat: 'json' | 'csv'): void {
  const cycles = JSON.parse(localStorage.getItem(STORAGE_KEYS.cycles) || '[]') as Cycle[];
  const symptoms = JSON.parse(localStorage.getItem(STORAGE_KEYS.symptoms) || '[]') as SymptomLog[];
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}') as Partial<AppSettings>;

  const dateStr = format(new Date(), 'yyyy-MM-dd');
  let content: string;
  let filename: string;
  let mimeType: string;

  if (exportFormat === 'json') {
    content = JSON.stringify({ cycles, symptoms, settings }, null, 2);
    filename = `menstrual-tracker-export-${dateStr}.json`;
    mimeType = 'application/json';
  } else {
    // CSV format
    const lines: string[] = [];

    // Cycles section
    lines.push('# Cycles');
    lines.push('id,startDate,endDate,periodDays,averageCycleLength,periodDuration');
    for (const cycle of cycles) {
      lines.push([
        cycle.id,
        cycle.startDate,
        cycle.endDate || '',
        `"${cycle.periodDays.join(';')}"`,
        cycle.averageCycleLength,
        cycle.periodDuration,
      ].join(','));
    }

    lines.push('');

    // Symptoms section
    lines.push('# Symptoms');
    lines.push('date,cramps,backPain,headache,bloating,breastTenderness,fatigue,nausea,acne,moodSwings,anxiety,sadness,irritability,energy,flow,cervicalMucus,libido,appetite,sleep,weight,temperature,notes,tags');
    for (const log of symptoms) {
      lines.push([
        log.date,
        log.physical.cramps,
        log.physical.backPain,
        log.physical.headache,
        log.physical.bloating,
        log.physical.breastTenderness,
        log.physical.fatigue,
        log.physical.nausea,
        log.physical.acne,
        log.emotional.moodSwings,
        log.emotional.anxiety,
        log.emotional.sadness,
        log.emotional.irritability,
        log.emotional.energy,
        log.hormonal.flow,
        log.hormonal.cervicalMucus,
        log.libido,
        log.appetite,
        log.sleep,
        log.weight ?? '',
        log.temperature ?? '',
        `"${log.notes.replace(/"/g, '""')}"`,
        `"${log.tags.join(';')}"`,
      ].join(','));
    }

    content = lines.join('\n');
    filename = `menstrual-tracker-export-${dateStr}.csv`;
    mimeType = 'text/csv';
  }

  // Trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function importData(jsonString: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, error: 'The file does not have a valid JSON format' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { success: false, error: 'The file does not have a valid JSON format' };
  }

  const data = parsed as Record<string, unknown>;

  // Check required structure
  const missingFields: string[] = [];
  if (!('cycles' in data) || !Array.isArray(data.cycles)) {
    missingFields.push('cycles');
  }
  if (!('symptoms' in data) || !Array.isArray(data.symptoms)) {
    missingFields.push('symptoms');
  }

  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Invalid structure: missing fields: ${missingFields.join(', ')}`,
    };
  }

  // Validate data structure
  const validation = validateStorageData(data);
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid structure: ${validation.errors.join('; ')}`,
    };
  }

  // Overwrite localStorage
  const cycles = data.cycles as Cycle[];
  const symptoms = data.symptoms as SymptomLog[];

  localStorage.setItem(STORAGE_KEYS.cycles, JSON.stringify(cycles));
  localStorage.setItem(STORAGE_KEYS.symptoms, JSON.stringify(symptoms));

  if ('settings' in data && data.settings) {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(data.settings));
  }

  return {
    success: true,
    cyclesImported: cycles.length,
    logsImported: symptoms.length,
  };
}

export function checkStorageAvailability(): boolean {
  const testKey = '__storage_availability_test__';
  try {
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getPhaseColor(phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'): string {
  const colors: Record<string, string> = {
    menstrual: '#FA6364',
    follicular: '#FFB04C',
    ovulation: '#4ECDC4',
    luteal: '#9B7ED8',
  };
  return colors[phase];
}
