import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  RECOMMENDATIONS_MAP,
  getRecommendations,
  getMenstrualPhaseRecommendations,
} from '../recommendations';
import type { SymptomLog, PhysicalSymptomKey } from '../../types';

const ALL_PHYSICAL_SYMPTOMS: PhysicalSymptomKey[] = [
  'cramps', 'backPain', 'headache', 'bloating',
  'breastTenderness', 'fatigue', 'nausea', 'acne',
];

function createSymptomLog(physical: Partial<Record<PhysicalSymptomKey, number>> = {}): SymptomLog {
  return {
    date: '2024-01-15',
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
    },
    hormonal: {
      flow: 'none',
      cervicalMucus: 'dry',
    },
    libido: 0,
    appetite: 0,
    sleep: 7,
    weight: null,
    temperature: null,
    notes: '',
    tags: [],
  };
}

describe('RECOMMENDATIONS_MAP', () => {
  it('has at least 3 recommendations for each physical symptom', () => {
    for (const symptom of ALL_PHYSICAL_SYMPTOMS) {
      expect(RECOMMENDATIONS_MAP[symptom].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('covers at least 2 categories per symptom', () => {
    for (const symptom of ALL_PHYSICAL_SYMPTOMS) {
      const categories = new Set(RECOMMENDATIONS_MAP[symptom].map(r => r.category));
      expect(categories.size).toBeGreaterThanOrEqual(2);
    }
  });

  it('all recommendations have valid structure', () => {
    for (const symptom of ALL_PHYSICAL_SYMPTOMS) {
      for (const rec of RECOMMENDATIONS_MAP[symptom]) {
        expect(rec.id).toBeTruthy();
        expect(rec.symptom).toBe(symptom);
        expect(['physical', 'natural', 'pharmaceutical']).toContain(rec.category);
        expect(rec.text.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getRecommendations', () => {
  it('returns empty array when no symptoms >= 3', () => {
    const log = createSymptomLog({ cramps: 2, headache: 1 });
    expect(getRecommendations(log)).toEqual([]);
  });

  it('generates recommendations for symptoms with intensity >= 3', () => {
    const log = createSymptomLog({ cramps: 4 });
    const recs = getRecommendations(log);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every(r => r.symptom === 'cramps')).toBe(true);
  });

  it('returns maximum 5 recommendations', () => {
    const log = createSymptomLog({
      cramps: 5,
      backPain: 4,
      headache: 4,
      bloating: 3,
      fatigue: 3,
    });
    const recs = getRecommendations(log);
    expect(recs.length).toBeLessThanOrEqual(5);
  });

  it('orders groups by descending intensity', () => {
    const log = createSymptomLog({ headache: 3, cramps: 5 });
    const recs = getRecommendations(log);
    // First recommendation should be for cramps (intensity 5)
    expect(recs[0].symptom).toBe('cramps');
  });

  it('does not include recommendations for symptoms below 3', () => {
    const log = createSymptomLog({ cramps: 5, backPain: 2 });
    const recs = getRecommendations(log);
    expect(recs.every(r => r.symptom !== 'backPain')).toBe(true);
  });

  it('groups by symptom and takes recommendations in order from map', () => {
    const log = createSymptomLog({ nausea: 4 });
    const recs = getRecommendations(log);
    const expectedRecs = RECOMMENDATIONS_MAP['nausea'];
    // Should take recommendations in order from the map
    for (let i = 0; i < recs.length; i++) {
      expect(recs[i].id).toBe(expectedRecs[i].id);
    }
  });
});

describe('getMenstrualPhaseRecommendations', () => {
  it('returns maximum 3 recommendations', () => {
    const recs = getMenstrualPhaseRecommendations();
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it('returns at least 1 recommendation', () => {
    const recs = getMenstrualPhaseRecommendations();
    expect(recs.length).toBeGreaterThanOrEqual(1);
  });

  it('all recommendations have valid structure', () => {
    const recs = getMenstrualPhaseRecommendations();
    for (const rec of recs) {
      expect(rec.id).toBeTruthy();
      expect(rec.symptom).toBeTruthy();
      expect(['physical', 'natural', 'pharmaceutical']).toContain(rec.category);
      expect(rec.text.length).toBeGreaterThan(0);
    }
  });
});


// Feature: menstrual-cycle-tracker, Property 7: Recommendations map completeness
// For each physical symptom key (`cramps`, `backPain`, `headache`, `bloating`,
// `breastTenderness`, `fatigue`, `nausea`, `acne`), `RECOMMENDATIONS_MAP` must have
// ≥ 3 recommendations covering ≥ 2 categories (`physical`, `natural`, `pharmaceutical`).
// **Validates: Requirements 5.2, 5.3**

describe('Property 7: Recommendations map completeness', () => {
  const ALL_PHYSICAL_SYMPTOM_KEYS: PhysicalSymptomKey[] = [
    'cramps', 'backPain', 'headache', 'bloating',
    'breastTenderness', 'fatigue', 'nausea', 'acne',
  ];

  const VALID_CATEGORIES = ['physical', 'natural', 'pharmaceutical'] as const;

  it('for any physical symptom key, RECOMMENDATIONS_MAP has >= 3 recommendations covering >= 2 categories', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_PHYSICAL_SYMPTOM_KEYS),
        (symptomKey) => {
          const recommendations = RECOMMENDATIONS_MAP[symptomKey];

          // Must have at least 3 recommendations
          expect(recommendations.length).toBeGreaterThanOrEqual(3);

          // Must cover at least 2 distinct categories
          const categories = new Set(recommendations.map((r) => r.category));
          expect(categories.size).toBeGreaterThanOrEqual(2);

          // All categories must be valid
          for (const cat of categories) {
            expect(VALID_CATEGORIES).toContain(cat);
          }

          // Each recommendation must reference the correct symptom
          for (const rec of recommendations) {
            expect(rec.symptom).toBe(symptomKey);
          }

          // Each recommendation must have a non-empty id and text
          for (const rec of recommendations) {
            expect(rec.id).toBeTruthy();
            expect(rec.text.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('RECOMMENDATIONS_MAP contains entries for all 8 physical symptom keys', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_PHYSICAL_SYMPTOM_KEYS),
        (symptomKey) => {
          // The key must exist in the map
          expect(RECOMMENDATIONS_MAP).toHaveProperty(symptomKey);
          expect(Array.isArray(RECOMMENDATIONS_MAP[symptomKey])).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
