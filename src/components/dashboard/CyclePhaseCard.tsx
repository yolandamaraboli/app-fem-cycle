import { Card } from '../shared/Card';
import { useCurrentPhase } from '../../hooks/useCurrentPhase';
import { useTranslation } from '../../i18n';

/**
 * Shows the current cycle phase, cycle day, and remaining days
 * with the corresponding phase color accent.
 */
export function CyclePhaseCard() {
  const { phase, dayInCycle, daysUntilNextPhase, phaseColor } = useCurrentPhase();
  const { t } = useTranslation();

  if (!phase) {
    return (
      <Card>
        <p className="text-body text-text-secondary">
          {t('emptyStates.noCycles')}
        </p>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Phase color accent bar */}
      <div
        className="absolute top-0 left-0 h-1 w-full rounded-t-card"
        style={{ backgroundColor: phaseColor }}
        aria-hidden="true"
      />

      <div className="pt-2">
        <p className="text-label text-text-secondary mb-1">
          {t('dashboard.currentPhase')}
        </p>
        <h2
          className="text-h2 font-bold"
          style={{ color: phaseColor }}
        >
          {t(`phases.${phase}`)}
        </h2>

        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-label text-text-secondary">
              {t('dashboard.cycleDay')}
            </p>
            <p className="text-h3 font-semibold text-text-primary">
              {dayInCycle}
            </p>
          </div>
          <div>
            <p className="text-label text-text-secondary">
              {t('dashboard.daysRemaining')}
            </p>
            <p className="text-h3 font-semibold text-text-primary">
              {daysUntilNextPhase}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
