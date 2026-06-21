import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { PhaseSummary, PhysicalSymptoms, EmotionalSymptoms } from '../../types';
import { useTranslation } from '../../i18n';

interface SymptomRadarChartProps {
  summary: PhaseSummary;
  category: 'physical' | 'emotional';
}

const PHASE_COLORS = {
  menstrual: '#FA6364',
  follicular: '#FFB04C',
  ovulation: '#4ECDC4',
  luteal: '#9B7ED8',
} as const;

const PHYSICAL_KEYS: (keyof PhysicalSymptoms)[] = [
  'cramps', 'backPain', 'headache', 'bloating',
  'breastTenderness', 'fatigue', 'nausea', 'acne',
];

const EMOTIONAL_KEYS: (keyof EmotionalSymptoms)[] = [
  'moodSwings', 'anxiety', 'sadness', 'irritability', 'energy',
];

export function SymptomRadarChart({ summary, category }: SymptomRadarChartProps) {
  const { t } = useTranslation();

  const keys = category === 'physical' ? PHYSICAL_KEYS : EMOTIONAL_KEYS;
  const phases = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;

  const data = keys.map((key) => {
    const entry: Record<string, string | number> = {
      symptom: t(`symptoms.${category}.${key}`),
    };
    for (const phase of phases) {
      const phaseData = summary[phase];
      if (phaseData) {
        const avg = category === 'physical'
          ? phaseData.physicalAvg[key as keyof PhysicalSymptoms]
          : phaseData.emotionalAvg[key as keyof EmotionalSymptoms];
        entry[phase] = Math.round(avg * 10) / 10;
      } else {
        entry[phase] = 0;
      }
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="symptom" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 5]} tickCount={6} />
        <Tooltip />
        {phases.map((phase) => (
          <Radar
            key={phase}
            name={t(`phases.${phase}`)}
            dataKey={phase}
            stroke={PHASE_COLORS[phase]}
            fill={PHASE_COLORS[phase]}
            fillOpacity={0.15}
          />
        ))}
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
