import { useTranslation } from '../../i18n';
import { getPhaseColor } from '../../lib/storage';
import type { CyclePhases } from '../../types';

const PHASE_KEYS: (keyof CyclePhases)[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];

export function Legend() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-4 justify-center py-3" role="list" aria-label="Phase color legend">
      {PHASE_KEYS.map((phase) => (
        <div key={phase} className="flex items-center gap-2" role="listitem">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: getPhaseColor(phase) }}
            aria-hidden="true"
          />
          <span className="text-body-sm text-text-secondary">
            {t(`phases.${phase}`)}
          </span>
        </div>
      ))}
    </div>
  );
}
