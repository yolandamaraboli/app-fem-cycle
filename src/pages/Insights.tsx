import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useCycleStore } from '../store/useCycleStore';
import { useSymptomStore } from '../store/useSymptomStore';
import { useTranslation } from '../i18n';
import { generatePhaseSummary, hasEnoughDataForSummary } from '../lib/symptoms';
import { Card } from '../components/shared/Card';
import { Badge } from '../components/shared/Badge';
import { Button } from '../components/shared/Button';
import { SymptomRadarChart } from '../components/charts/SymptomRadarChart';
import { PhaseSummaryChart } from '../components/charts/PhaseSummaryChart';
import type { PhaseSummary } from '../types';

const LABELS = {
  en: {
    physicalByPhase: 'Physical Symptoms by Phase',
    emotionalByPhase: 'Emotional Symptoms by Phase',
    physicalIntensity: 'Physical Intensity Comparison',
    emotionalIntensity: 'Emotional Intensity Comparison',
    physical: 'Physical',
    emotional: 'Emotional',
    daysWithData: (n: number) => `${n} day${n !== 1 ? 's' : ''} with data`,
    noData: 'No data for this phase',
  },
  es: {
    physicalByPhase: 'Síntomas Físicos por Fase',
    emotionalByPhase: 'Síntomas Emocionales por Fase',
    physicalIntensity: 'Comparación de Intensidad Física',
    emotionalIntensity: 'Comparación de Intensidad Emocional',
    physical: 'Físicos',
    emotional: 'Emocionales',
    daysWithData: (n: number) => `${n} día${n !== 1 ? 's' : ''} con datos`,
    noData: 'Sin datos para esta fase',
  },
} as const;

const PHASE_COLORS = {
  menstrual: '#FA6364',
  follicular: '#FFB04C',
  ovulation: '#4ECDC4',
  luteal: '#9B7ED8',
} as const;

export function Insights() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const labels = LABELS[locale];

  const cycles = useCycleStore((s) => s.cycles);
  const getLogsByDateRange = useSymptomStore((s) => s.getLogsByDateRange);

  // Get completed cycles only
  const completedCycles = useMemo(
    () => cycles.filter((c) => c.endDate !== null),
    [cycles]
  );

  // Find current cycle
  const currentCycle = useMemo(
    () => completedCycles.find((c) => c.id === cycleId) ?? null,
    [completedCycles, cycleId]
  );

  // Find cycle index for navigation
  const currentIndex = useMemo(
    () => completedCycles.findIndex((c) => c.id === cycleId),
    [completedCycles, cycleId]
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < completedCycles.length - 1 && currentIndex >= 0;

  // Get logs for current cycle
  const logs = useMemo(() => {
    if (!currentCycle || !currentCycle.endDate) return [];
    return getLogsByDateRange(currentCycle.startDate, currentCycle.endDate);
  }, [currentCycle, getLogsByDateRange]);

  // Check if there's enough data
  const enoughData = useMemo(() => {
    if (!currentCycle) return false;
    return hasEnoughDataForSummary(logs, currentCycle);
  }, [logs, currentCycle]);

  // Generate phase summary
  const phaseSummary: PhaseSummary | null = useMemo(() => {
    if (!currentCycle || !enoughData) return null;
    return generatePhaseSummary(logs, currentCycle.phases);
  }, [logs, currentCycle, enoughData]);

  // Navigation handlers
  const goToPrev = () => {
    if (hasPrev) {
      navigate(`/insights/${completedCycles[currentIndex - 1].id}`);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      navigate(`/insights/${completedCycles[currentIndex + 1].id}`);
    }
  };

  // No cycle found
  if (!currentCycle) {
    return (
      <div className="space-y-6">
        <h1 className="text-h1 font-bold text-text-primary">
          {t('nav.history')}
        </h1>
        <Card>
          <p className="text-text-secondary text-body text-center py-8">
            {t('emptyStates.noHistory')}
          </p>
        </Card>
      </div>
    );
  }

  const phases = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-h1 font-bold text-text-primary">
          Insights
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={goToPrev}
            disabled={!hasPrev}
            aria-label="Previous cycle"
          >
            ←
          </Button>
          <span className="text-body text-text-secondary px-2">
            {format(parseISO(currentCycle.startDate), 'MMM d, yyyy')}
            {' – '}
            {currentCycle.endDate
              ? format(parseISO(currentCycle.endDate), 'MMM d, yyyy')
              : ''}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={goToNext}
            disabled={!hasNext}
            aria-label="Next cycle"
          >
            →
          </Button>
        </div>
      </div>

      {/* Insufficient data warning */}
      {!enoughData && (
        <Card className="border-amber-300 bg-amber-50">
          <div className="flex items-center gap-3">
            <span className="text-amber-600 text-xl" aria-hidden="true">⚠️</span>
            <p className="text-text-secondary text-body">
              {t('emptyStates.insufficientData')}
            </p>
          </div>
        </Card>
      )}

      {/* Phase legend */}
      <div className="flex flex-wrap gap-3">
        {phases.map((phase) => (
          <Badge key={phase} color={PHASE_COLORS[phase]} variant="solid">
            {t(`phases.${phase}`)}
          </Badge>
        ))}
      </div>

      {/* Summary content */}
      {phaseSummary && (
        <>
          {/* Phase details cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phases.map((phase) => {
              const phaseData = phaseSummary[phase];
              return (
                <Card key={phase}>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: PHASE_COLORS[phase] }}
                      aria-hidden="true"
                    />
                    <h3 className="text-body font-semibold text-text-primary">
                      {t(`phases.${phase}`)}
                    </h3>
                  </div>

                  {phaseData ? (
                    <div className="space-y-2">
                      <p className="text-label text-text-secondary">
                        {labels.daysWithData(phaseData.daysWithData)}
                      </p>
                      <div className="space-y-1">
                        <p className="text-label font-medium text-text-primary">
                          {labels.physical}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(phaseData.physicalAvg).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-label text-text-secondary bg-background rounded px-1.5 py-0.5"
                            >
                              {t(`symptoms.physical.${key}`)}: {(val as number).toFixed(1)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-label font-medium text-text-primary">
                          {labels.emotional}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(phaseData.emotionalAvg).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-label text-text-secondary bg-background rounded px-1.5 py-0.5"
                            >
                              {t(`symptoms.emotional.${key}`)}: {(val as number).toFixed(1)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-body text-text-secondary italic py-4 text-center">
                      {labels.noData}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Radar Chart - Physical */}
          <Card>
            <h2 className="text-h3 font-semibold text-text-primary mb-4">
              {labels.physicalByPhase}
            </h2>
            <SymptomRadarChart summary={phaseSummary} category="physical" />
          </Card>

          {/* Radar Chart - Emotional */}
          <Card>
            <h2 className="text-h3 font-semibold text-text-primary mb-4">
              {labels.emotionalByPhase}
            </h2>
            <SymptomRadarChart summary={phaseSummary} category="emotional" />
          </Card>

          {/* Bar Chart - Physical by Phase */}
          <Card>
            <h2 className="text-h3 font-semibold text-text-primary mb-4">
              {labels.physicalIntensity}
            </h2>
            <PhaseSummaryChart summary={phaseSummary} category="physical" />
          </Card>

          {/* Bar Chart - Emotional by Phase */}
          <Card>
            <h2 className="text-h3 font-semibold text-text-primary mb-4">
              {labels.emotionalIntensity}
            </h2>
            <PhaseSummaryChart summary={phaseSummary} category="emotional" />
          </Card>
        </>
      )}
    </div>
  );
}
