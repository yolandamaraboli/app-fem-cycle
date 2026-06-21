import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { usePregnancyProbability } from '../../hooks/usePregnancyProbability';
import { useTranslation } from '../../i18n';

const PREGNANCY_COLORS: Record<string, string> = {
  high: '#4ECDC4',
  medium: '#FFB04C',
  low: '#6B7280',
};

/**
 * Displays pregnancy probability as a colored badge with a
 * non-dismissible medical disclaimer.
 */
export function PregnancyBadge() {
  const { level, canShow } = usePregnancyProbability();
  const { t } = useTranslation();

  if (!canShow || !level) {
    return null;
  }

  const color = PREGNANCY_COLORS[level];

  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-label text-text-secondary">
          {t('dashboard.pregnancyProbability')}
        </p>
        <Badge
          color={color}
          className="rounded-full"
          aria-label={`${t('dashboard.pregnancyProbability')}: ${t(`pregnancy.${level}`)}`}
        >
          {t(`pregnancy.${level}`)}
        </Badge>
      </div>

      {/* Non-dismissible medical disclaimer */}
      <p
        className="text-body-sm text-text-secondary"
        role="note"
        aria-label={t('dashboard.disclaimerLabel')}
      >
        {t('pregnancy.disclaimer')}
      </p>
    </Card>
  );
}
