import { useMemo } from 'react';
import { parseISO, differenceInDays, format } from 'date-fns';
import { useCycleStore } from '../store/useCycleStore';
import { useTranslation } from '../i18n/index';
import {
  calculateHistoryAverage,
  calculateVariation,
  calculateTrend,
  detectAnomalies,
} from '../lib/cycle';
import { Card } from '../components/shared/Card';
import { Badge } from '../components/shared/Badge';
import { CycleDurationChart } from '../components/charts/CycleDurationChart';
import { VariationBarChart } from '../components/charts/VariationBarChart';
import type { Cycle } from '../types';

function getCycleDuration(cycle: Cycle): number {
  const start = parseISO(cycle.startDate);
  const end = parseISO(cycle.endDate!);
  return differenceInDays(end, start);
}

function getPeriodDays(cycle: Cycle): number {
  if (cycle.periodDays.length > 0) {
    return cycle.periodDays.length;
  }
  return cycle.periodDuration;
}

export function History() {
  const { t, locale } = useTranslation();
  const cycles = useCycleStore((state) => state.cycles);

  const completedCycles = useMemo(
    () => cycles.filter((c) => c.endDate !== null),
    [cycles]
  );

  const average = useMemo(
    () => calculateHistoryAverage(completedCycles),
    [completedCycles]
  );

  const variations = useMemo(
    () => calculateVariation(completedCycles),
    [completedCycles]
  );

  const trend = useMemo(
    () => calculateTrend(completedCycles),
    [completedCycles]
  );

  const anomalies = useMemo(() => {
    if (average === null) return new Set<string>();
    const anomalyCycles = detectAnomalies(completedCycles, average);
    return new Set(anomalyCycles.map((c) => c.id));
  }, [completedCycles, average]);

  // Last 12 durations for the line chart
  const last12Durations = useMemo(() => {
    const last12 = completedCycles.slice(-12);
    return last12.map(getCycleDuration);
  }, [completedCycles]);

  // Anomaly indices relative to the last 12 cycles
  const anomalyIndicesInChart = useMemo(() => {
    const last12 = completedCycles.slice(-12);
    const indices = new Set<number>();
    last12.forEach((cycle, idx) => {
      if (anomalies.has(cycle.id)) {
        indices.add(idx);
      }
    });
    return indices;
  }, [completedCycles, anomalies]);

  // Average of menstruation days (last min(6, N))
  const avgPeriodDays = useMemo(() => {
    if (completedCycles.length === 0) return null;
    const count = Math.min(6, completedCycles.length);
    const lastN = completedCycles.slice(-count);
    const total = lastN.reduce((sum, c) => sum + getPeriodDays(c), 0);
    return total / count;
  }, [completedCycles]);

  // Labels
  const trendLabels: Record<string, string> = locale === 'es'
    ? { shortening: 'Acortándose', lengthening: 'Alargándose', stable: 'Estable' }
    : { shortening: 'Shortening', lengthening: 'Lengthening', stable: 'Stable' };

  const trendColors: Record<string, string> = {
    shortening: '#4ECDC4',
    lengthening: '#FFB04C',
    stable: '#9B7ED8',
  };

  const historyLabels = locale === 'es'
    ? {
        title: 'Historial de Ciclos',
        avgDuration: 'Duración promedio',
        avgPeriod: 'Días de menstruación promedio',
        days: 'días',
        trend: 'Tendencia',
        startDate: 'Inicio',
        endDate: 'Fin',
        duration: 'Duración',
        periodDays: 'Días de menstruación',
        anomaly: 'Anomalía',
        durationChart: 'Evolución de Duración',
        variationChart: 'Variación entre Ciclos',
        cycle: 'Ciclo',
        pair: 'Par',
        variation: 'Variación',
        average: 'Promedio',
        yes: 'Sí',
        no: 'No',
      }
    : {
        title: 'Cycle History',
        avgDuration: 'Average duration',
        avgPeriod: 'Average period days',
        days: 'days',
        trend: 'Trend',
        startDate: 'Start',
        endDate: 'End',
        duration: 'Duration',
        periodDays: 'Period days',
        anomaly: 'Anomaly',
        durationChart: 'Duration Evolution',
        variationChart: 'Variation Between Cycles',
        cycle: 'Cycle',
        pair: 'Pair',
        variation: 'Variation',
        average: 'Average',
        yes: 'Yes',
        no: 'No',
      };

  // Not enough data
  if (completedCycles.length < 2) {
    return (
      <div className="space-y-6">
        <h1 className="text-h1 font-bold text-text-primary">
          {t('nav.history')}
        </h1>
        <Card className="text-center py-12">
          <p className="text-text-secondary text-body">
            {t('emptyStates.noHistory')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold text-text-primary">
        {historyLabels.title}
      </h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-label text-text-secondary mb-1">
            {historyLabels.avgDuration}
          </p>
          <p className="text-h2 font-semibold text-text-primary">
            {average !== null ? `${average.toFixed(1)} ${historyLabels.days}` : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-label text-text-secondary mb-1">
            {historyLabels.avgPeriod}
          </p>
          <p className="text-h2 font-semibold text-text-primary">
            {avgPeriodDays !== null ? `${avgPeriodDays.toFixed(1)} ${historyLabels.days}` : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-label text-text-secondary mb-1">
            {historyLabels.trend}
          </p>
          <div className="flex items-center gap-2">
            <Badge color={trendColors[trend]}>
              {trendLabels[trend]}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Duration evolution chart */}
      <Card>
        <h2 className="text-h3 font-semibold text-text-primary mb-4">
          {historyLabels.durationChart}
        </h2>
        <CycleDurationChart
          durations={last12Durations}
          average={average}
          anomalyIndices={anomalyIndicesInChart}
          labels={{
            cycle: historyLabels.cycle,
            days: historyLabels.days,
            average: historyLabels.average,
          }}
        />
      </Card>

      {/* Variation bar chart */}
      <Card>
        <h2 className="text-h3 font-semibold text-text-primary mb-4">
          {historyLabels.variationChart}
        </h2>
        <VariationBarChart
          variations={variations}
          labels={{
            variation: historyLabels.variation,
            days: historyLabels.days,
            pair: historyLabels.pair,
          }}
        />
      </Card>

      {/* Cycle history table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body">
            <thead>
              <tr className="border-b border-border-card text-text-secondary text-label">
                <th className="pb-3 pr-4">{historyLabels.startDate}</th>
                <th className="pb-3 pr-4">{historyLabels.endDate}</th>
                <th className="pb-3 pr-4">{historyLabels.duration}</th>
                <th className="pb-3 pr-4">{historyLabels.periodDays}</th>
                <th className="pb-3">{historyLabels.anomaly}</th>
              </tr>
            </thead>
            <tbody>
              {completedCycles
                .slice()
                .reverse()
                .map((cycle) => {
                  const duration = getCycleDuration(cycle);
                  const period = getPeriodDays(cycle);
                  const isAnomaly = anomalies.has(cycle.id);

                  return (
                    <tr
                      key={cycle.id}
                      className="border-b border-border-card last:border-b-0"
                    >
                      <td className="py-3 pr-4 text-text-primary">
                        {format(parseISO(cycle.startDate), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 pr-4 text-text-primary">
                        {format(parseISO(cycle.endDate!), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 pr-4 text-text-primary">
                        {duration} {historyLabels.days}
                      </td>
                      <td className="py-3 pr-4 text-text-primary">
                        {period} {historyLabels.days}
                      </td>
                      <td className="py-3">
                        {isAnomaly ? (
                          <Badge color="#FA6364">{historyLabels.yes}</Badge>
                        ) : (
                          <span className="text-text-secondary">
                            {historyLabels.no}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
