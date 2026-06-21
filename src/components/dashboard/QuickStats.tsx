import { Card } from '../shared/Card';
import { useCycleStore } from '../../store/useCycleStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTranslation } from '../../i18n';

/**
 * Shows quick statistics for the current cycle:
 * configured cycle length, period duration, and luteal phase days.
 */
export function QuickStats() {
  const { t } = useTranslation();
  const activeCycle = useCycleStore((state) => state.getActiveCycle());
  const settings = useSettingsStore((state) => state.settings);

  if (!activeCycle) {
    return null;
  }

  const stats = [
    {
      label: t('dashboard.statCycleLength'),
      value: `${settings.cycleLengthAvg}`,
      unit: t('dashboard.days'),
    },
    {
      label: t('dashboard.statPeriodDuration'),
      value: `${settings.periodDurationAvg}`,
      unit: t('dashboard.days'),
    },
    {
      label: t('dashboard.statLutealPhase'),
      value: `${settings.lutealPhaseDays}`,
      unit: t('dashboard.days'),
    },
  ];

  return (
    <section aria-labelledby="quick-stats-heading">
      <h3
        id="quick-stats-heading"
        className="text-h3 font-semibold text-text-primary mb-3"
      >
        {t('dashboard.quickStats')}
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <p className="text-h2 font-bold text-primary">{stat.value}</p>
            <p className="text-label text-text-secondary">
              {stat.unit}
            </p>
            <p className="text-body-sm text-text-secondary mt-1">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
