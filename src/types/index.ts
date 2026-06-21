// === CYCLE ===

export interface Cycle {
  id: string;                    // UUID generated with crypto.randomUUID()
  startDate: string;             // ISO date (YYYY-MM-DD)
  endDate: string | null;        // null if active cycle
  periodDays: string[];          // Days with bleeding (ISO dates)
  phases: CyclePhases;
  averageCycleLength: number;    // Average at creation time
  periodDuration: number;        // Actual menstruation days
}

export interface CyclePhases {
  menstrual:   DateRange;
  follicular:  DateRange;
  ovulation:   DateRange;
  luteal:      DateRange;
}

export interface DateRange {
  start: string;  // ISO date
  end: string;    // ISO date
}

// === SYMPTOM LOG ===

export interface SymptomLog {
  date: string;                  // ISO date (YYYY-MM-DD) - primary key
  physical: PhysicalSymptoms;
  emotional: EmotionalSymptoms;
  hormonal: HormonalSymptoms;
  libido: number;                // 0-5
  appetite: number;              // 0-5
  sleep: number;                 // 0-24, increments of 0.5
  weight: number | null;         // 30.0-300.0, optional
  temperature: number | null;    // 35.0-42.0, BBT, optional
  notes: string;                 // Max 500 characters
  tags: string[];                // Max 10 tags, each max 30 chars
}

export interface PhysicalSymptoms {
  cramps: number;                // 0-5
  backPain: number;              // 0-5
  headache: number;              // 0-5
  bloating: number;              // 0-5
  breastTenderness: number;      // 0-5
  fatigue: number;               // 0-5
  nausea: number;                // 0-5
  acne: number;                  // 0-5
}

export interface EmotionalSymptoms {
  moodSwings: number;            // 0-5
  anxiety: number;               // 0-5
  sadness: number;               // 0-5
  irritability: number;          // 0-5
  energy: number;                // 0-5
}

export interface HormonalSymptoms {
  flow: FlowLevel;
  cervicalMucus: MucusType;
}

export type FlowLevel = 'none' | 'light' | 'medium' | 'heavy' | 'spotting';
export type MucusType = 'dry' | 'sticky' | 'creamy' | 'eggWhite' | 'watery';

// === SETTINGS ===

export interface AppSettings {
  cycleLengthAvg: number;        // 26-30, default 28
  periodDurationAvg: number;     // 3-7, default 5
  lutealPhaseDays: number;       // 14 (fixed per requirements)
  theme: 'light' | 'dark';
  firstDayOfWeek: 0 | 1;        // 0=Sunday, 1=Monday
  exportFormat: 'json' | 'csv';
  locale: 'en' | 'es';          // 'es' by default, detected from browser
}

// === RECOMMENDATIONS ===

export interface Recommendation {
  id: string;
  symptom: PhysicalSymptomKey;
  category: 'physical' | 'natural' | 'pharmaceutical';
  text: string;
  icon?: string;
}

export type PhysicalSymptomKey = keyof PhysicalSymptoms;

// === PHASE SUMMARY ===

export interface PhaseSummary {
  menstrual: PhaseData | null;
  follicular: PhaseData | null;
  ovulation: PhaseData | null;
  luteal: PhaseData | null;
}

export interface PhaseData {
  daysWithData: number;
  physicalAvg: Record<keyof PhysicalSymptoms, number>;
  emotionalAvg: Record<keyof EmotionalSymptoms, number>;
}

// === VALIDATION AND IMPORT ===

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  error?: string;
  cyclesImported?: number;
  logsImported?: number;
}
