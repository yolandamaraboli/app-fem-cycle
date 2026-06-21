import type { PhysicalSymptomKey, Recommendation, SymptomLog } from '../types';

/**
 * Recommendations map by symptom.
 * Minimum 3 recommendations per physical symptom type,
 * covering at least 2 categories (physical, natural, pharmaceutical).
 */
export const RECOMMENDATIONS_MAP: Record<PhysicalSymptomKey, Recommendation[]> = {
  cramps: [
    { id: 'cramps-1', symptom: 'cramps', category: 'physical', text: 'Apply a heating pad to your lower abdomen for 15-20 minutes', icon: '🔥' },
    { id: 'cramps-2', symptom: 'cramps', category: 'physical', text: 'Try gentle yoga poses like child\'s pose or reclined butterfly', icon: '🧘' },
    { id: 'cramps-3', symptom: 'cramps', category: 'natural', text: 'Drink ginger or chamomile tea to help ease muscle tension', icon: '🍵' },
    { id: 'cramps-4', symptom: 'cramps', category: 'pharmaceutical', text: 'Consider ibuprofen or naproxen for pain relief (follow dosage instructions)', icon: '💊' },
  ],
  backPain: [
    { id: 'backPain-1', symptom: 'backPain', category: 'physical', text: 'Do gentle lower back stretches or cat-cow poses', icon: '🧘' },
    { id: 'backPain-2', symptom: 'backPain', category: 'physical', text: 'Apply a warm compress to the lower back area', icon: '🔥' },
    { id: 'backPain-3', symptom: 'backPain', category: 'natural', text: 'Try magnesium-rich foods like dark chocolate, nuts, or bananas', icon: '🍌' },
    { id: 'backPain-4', symptom: 'backPain', category: 'pharmaceutical', text: 'Consider acetaminophen or a topical pain relief cream', icon: '💊' },
  ],
  headache: [
    { id: 'headache-1', symptom: 'headache', category: 'physical', text: 'Rest in a dark, quiet room and apply a cold compress to your forehead', icon: '🧊' },
    { id: 'headache-2', symptom: 'headache', category: 'natural', text: 'Stay hydrated and try peppermint or lavender essential oil on temples', icon: '💧' },
    { id: 'headache-3', symptom: 'headache', category: 'natural', text: 'Drink caffeine in moderation — a small coffee can help relieve tension', icon: '☕' },
    { id: 'headache-4', symptom: 'headache', category: 'pharmaceutical', text: 'Consider ibuprofen or acetaminophen for headache relief', icon: '💊' },
  ],
  bloating: [
    { id: 'bloating-1', symptom: 'bloating', category: 'physical', text: 'Take a gentle walk to stimulate digestion and reduce discomfort', icon: '🚶' },
    { id: 'bloating-2', symptom: 'bloating', category: 'natural', text: 'Drink peppermint or fennel tea to soothe digestive discomfort', icon: '🍵' },
    { id: 'bloating-3', symptom: 'bloating', category: 'natural', text: 'Reduce sodium intake and increase potassium-rich foods like bananas', icon: '🍌' },
    { id: 'bloating-4', symptom: 'bloating', category: 'pharmaceutical', text: 'Consider an over-the-counter anti-gas or digestive enzyme supplement', icon: '💊' },
  ],
  breastTenderness: [
    { id: 'breastTenderness-1', symptom: 'breastTenderness', category: 'physical', text: 'Wear a supportive, well-fitted bra to reduce movement and discomfort', icon: '👙' },
    { id: 'breastTenderness-2', symptom: 'breastTenderness', category: 'natural', text: 'Apply a cold compress to ease swelling and tenderness', icon: '🧊' },
    { id: 'breastTenderness-3', symptom: 'breastTenderness', category: 'natural', text: 'Reduce caffeine and salt intake which can worsen fluid retention', icon: '🥗' },
    { id: 'breastTenderness-4', symptom: 'breastTenderness', category: 'pharmaceutical', text: 'Consider ibuprofen for inflammation and pain relief', icon: '💊' },
  ],
  fatigue: [
    { id: 'fatigue-1', symptom: 'fatigue', category: 'physical', text: 'Take short rest breaks and prioritize 7-9 hours of sleep tonight', icon: '😴' },
    { id: 'fatigue-2', symptom: 'fatigue', category: 'physical', text: 'Try light exercise like a 15-minute walk to boost energy naturally', icon: '🚶' },
    { id: 'fatigue-3', symptom: 'fatigue', category: 'natural', text: 'Eat iron-rich foods like spinach, lentils, or red meat to support energy', icon: '🥬' },
    { id: 'fatigue-4', symptom: 'fatigue', category: 'pharmaceutical', text: 'Consider an iron or B-vitamin supplement if fatigue persists', icon: '💊' },
  ],
  nausea: [
    { id: 'nausea-1', symptom: 'nausea', category: 'physical', text: 'Rest in a comfortable position and take slow, deep breaths', icon: '🌬️' },
    { id: 'nausea-2', symptom: 'nausea', category: 'natural', text: 'Sip on ginger tea or chew on a small piece of fresh ginger', icon: '🍵' },
    { id: 'nausea-3', symptom: 'nausea', category: 'natural', text: 'Eat small, bland meals frequently — crackers or dry toast can help', icon: '🍞' },
    { id: 'nausea-4', symptom: 'nausea', category: 'pharmaceutical', text: 'Consider an over-the-counter antacid or anti-nausea medication', icon: '💊' },
  ],
  acne: [
    { id: 'acne-1', symptom: 'acne', category: 'physical', text: 'Keep your face clean with a gentle, non-comedogenic cleanser twice daily', icon: '🧴' },
    { id: 'acne-2', symptom: 'acne', category: 'natural', text: 'Apply tea tree oil diluted in a carrier oil as a natural antibacterial', icon: '🌿' },
    { id: 'acne-3', symptom: 'acne', category: 'natural', text: 'Increase zinc-rich foods like pumpkin seeds and chickpeas in your diet', icon: '🥜' },
    { id: 'acne-4', symptom: 'acne', category: 'pharmaceutical', text: 'Consider benzoyl peroxide or salicylic acid spot treatments', icon: '💊' },
  ],
};

/**
 * Generates recommendations based on recorded symptoms.
 * Only for symptoms with intensity >= 3.
 * Maximum 5 recommendations, ordered by symptom intensity (descending).
 */
export function getRecommendations(log: SymptomLog): Recommendation[] {
  // Collect physical symptoms with intensity >= 3
  const qualifyingSymptoms: { key: PhysicalSymptomKey; intensity: number }[] = [];

  for (const [key, intensity] of Object.entries(log.physical)) {
    if (intensity >= 3) {
      qualifyingSymptoms.push({ key: key as PhysicalSymptomKey, intensity });
    }
  }

  // Sort by descending intensity
  qualifyingSymptoms.sort((a, b) => b.intensity - a.intensity);

  // Collect recommendations grouped by symptom, ordered by descending intensity
  const recommendations: Recommendation[] = [];

  for (const { key } of qualifyingSymptoms) {
    const symptomRecs = RECOMMENDATIONS_MAP[key];
    for (const rec of symptomRecs) {
      recommendations.push(rec);
      if (recommendations.length >= 5) {
        return recommendations;
      }
    }
  }

  return recommendations;
}

/**
 * Gets preventive recommendations for the menstrual phase.
 * Maximum 3 general recommendations.
 */
export function getMenstrualPhaseRecommendations(): Recommendation[] {
  return [
    {
      id: 'menstrual-phase-1',
      symptom: 'cramps',
      category: 'physical',
      text: 'Stay warm and rest — your body is working hard during menstruation',
      icon: '🛋️',
    },
    {
      id: 'menstrual-phase-2',
      symptom: 'fatigue',
      category: 'natural',
      text: 'Increase iron intake through leafy greens, legumes, or fortified cereals',
      icon: '🥗',
    },
    {
      id: 'menstrual-phase-3',
      symptom: 'cramps',
      category: 'physical',
      text: 'Try light movement like walking or gentle stretching to improve circulation',
      icon: '🚶',
    },
  ];
}
