import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  addMonths,
  subMonths,
  differenceInMonths,
  startOfMonth,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { useResponsive } from '../hooks/useResponsive';
import { useCycleStore } from '../store/useCycleStore';
import { useSymptomStore } from '../store/useSymptomStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../i18n';
import { getCurrentPhase } from '../lib/cycle';
import { getPhaseColor } from '../lib/storage';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { Legend } from '../components/calendar/Legend';

const DAY_LABELS_EN_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_EN_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS_ES_SUN = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_LABELS_ES_MON = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function Calendar() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { t, locale } = useTranslation();
  const firstDayOfWeek = useSettingsStore((s) => s.settings.firstDayOfWeek);
  const getActiveCycle = useCycleStore((s) => s.getActiveCycle);
  const cycles = useCycleStore((s) => s.cycles);
  const logs = useSymptomStore((s) => s.logs);

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today));
  const [weekAnchor, setWeekAnchor] = useState(() => today);

  // Navigation limits: ±12 months from current month
  const minMonth = useMemo(() => addMonths(startOfMonth(today), -12), [today]);
  const maxMonth = useMemo(() => addMonths(startOfMonth(today), 12), [today]);

  const canGoBack = differenceInMonths(currentMonth, minMonth) > 0;
  const canGoForward = differenceInMonths(maxMonth, currentMonth) > 0;

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const next = subMonths(prev, 1);
      return differenceInMonths(next, minMonth) >= 0 ? next : prev;
    });
  }, [minMonth]);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const next = addMonths(prev, 1);
      return differenceInMonths(maxMonth, next) >= 0 ? next : prev;
    });
  }, [maxMonth]);

  const handlePrevWeek = useCallback(() => {
    setWeekAnchor((prev) => {
      const next = subWeeks(prev, 1);
      const nextMonth = startOfMonth(next);
      if (differenceInMonths(nextMonth, minMonth) >= 0) {
        setCurrentMonth(nextMonth);
        return next;
      }
      return prev;
    });
  }, [minMonth]);

  const handleNextWeek = useCallback(() => {
    setWeekAnchor((prev) => {
      const next = addWeeks(prev, 1);
      const nextMonth = startOfMonth(next);
      if (differenceInMonths(maxMonth, nextMonth) >= 0) {
        setCurrentMonth(nextMonth);
        return next;
      }
      return prev;
    });
  }, [maxMonth]);

  // Determine day labels based on locale and firstDayOfWeek
  const dayLabels = useMemo(() => {
    if (locale === 'es') {
      return firstDayOfWeek === 1 ? DAY_LABELS_ES_MON : DAY_LABELS_ES_SUN;
    }
    return firstDayOfWeek === 1 ? DAY_LABELS_EN_MON : DAY_LABELS_EN_SUN;
  }, [locale, firstDayOfWeek]);

  // Get phase color for a specific date
  const getPhaseColorForDate = useCallback(
    (date: Date): string | null => {
      const dateStr = format(date, 'yyyy-MM-dd');

      // Check against all cycles (active and historical)
      for (const cycle of cycles) {
        const phase = getCurrentPhase(dateStr, cycle);
        if (phase) {
          return getPhaseColor(phase);
        }
      }
      return null;
    },
    [cycles]
  );

  // Check if a date has symptom logs
  const logDatesSet = useMemo(() => {
    return new Set(logs.map((l) => l.date));
  }, [logs]);

  const hasSymptoms = useCallback(
    (date: Date): boolean => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return logDatesSet.has(dateStr);
    },
    [logDatesSet]
  );

  // Click handler: navigate to log page or show detail
  const handleDayClick = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      navigate(`/log?date=${dateStr}`);
    },
    [navigate]
  );

  const activeCycle = getActiveCycle();
  const hasCycleData = cycles.length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-h1 font-bold text-text-primary">{t('nav.calendar')}</h1>

      <Card>
        {/* Month navigation header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={isMobile ? handlePrevWeek : handlePrevMonth}
            disabled={!canGoBack}
            aria-label="Previous"
          >
            ←
          </Button>
          <h2 className="text-h3 font-semibold text-text-primary capitalize">
            {format(currentMonth, locale === 'es' ? 'MMMM yyyy' : 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={isMobile ? handleNextWeek : handleNextMonth}
            disabled={!canGoForward}
            aria-label="Next"
          >
            →
          </Button>
        </div>

        {/* Calendar view */}
        {isMobile ? (
          <WeekView
            currentDate={weekAnchor}
            currentMonth={currentMonth}
            firstDayOfWeek={firstDayOfWeek}
            getPhaseColorForDate={getPhaseColorForDate}
            hasSymptoms={hasSymptoms}
            onDayClick={handleDayClick}
            dayLabels={dayLabels}
          />
        ) : (
          <MonthView
            currentMonth={currentMonth}
            firstDayOfWeek={firstDayOfWeek}
            getPhaseColorForDate={getPhaseColorForDate}
            hasSymptoms={hasSymptoms}
            onDayClick={handleDayClick}
            dayLabels={dayLabels}
          />
        )}

        {/* Legend */}
        <div className="mt-4 border-t border-border pt-3">
          <Legend />
        </div>
      </Card>

      {/* Empty state message when no cycle data exists */}
      {!hasCycleData && (
        <Card className="text-center">
          <p className="text-body text-text-secondary">
            {t('emptyStates.noCycles')}
          </p>
        </Card>
      )}
    </div>
  );
}
