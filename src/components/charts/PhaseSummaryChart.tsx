import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PhaseSummary, PhysicalSymptoms, EmotionalSymptoms } from '../../types';
import { useTranslation } from '../../i18n';

interface PhaseSummaryChartProps {
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

export function PhaseSummaryChart({ summary, category }: PhaseSummaryChartProps) {
  const { t } = useTranslation();

  const phases = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;
  const keys = category === 'physical' ? PHYSICAL_KEYS : EMOTIONAL_KEYS;

  // Each bar group is a phase, bars are symptom categories averaged
  const data = phases.map((phase) => {
    const phaseData = summary[phase];
    const entry: Record<string, string | number> = {
      phase: t(`phases.${phase}`),
    };

    if (phaseData) {
      for (const key of keys) {
        const avg = category === 'physical'
          ? phaseData.physicalAvg[key as keyof PhysicalSymptoms]
          : phaseData.emotionalAvg[key as keyof EmotionalSymptoms];
        entry[key] = Math.round(avg * 10) / 10;
      }
    } else {
      for (const key of keys) {
        entry[key] = 0;
      }
    }

    return entry;
  });

  // Generate unique colors for each symptom bar
  const symptomColors = keys.map((_, i) => {
    const phaseIdx = i % 4;
    const phaseKeys = Object.keys(PHASE_COLORS) as (keyof typeof PHASE_COLORS)[];
    return PHASE_COLORS[phaseKeys[phaseIdx]];
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="phase" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 5]} tickCount={6} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            name={t(`symptoms.${category}.${key}`)}
            fill={symptomColors[i]}
            fillOpacity={0.8}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
