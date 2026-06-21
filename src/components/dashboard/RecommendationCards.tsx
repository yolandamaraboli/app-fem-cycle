import { format } from 'date-fns';
import { Card } from '../shared/Card';
import { useCurrentPhase } from '../../hooks/useCurrentPhase';
import { useSymptomStore } from '../../store/useSymptomStore';
import { useTranslation } from '../../i18n';
import {
  getRecommendations,
  getMenstrualPhaseRecommendations,
} from '../../lib/recommendations';
import type { Recommendation } from '../../types';

/**
 * Displays contextual wellness recommendations based on today's symptoms
 * and preventive recommendations during the menstrual phase.
 */
export function RecommendationCards() {
  const { phase } = useCurrentPhase();
  const { t } = useTranslation();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLog = useSymptomStore((state) => state.getLogByDate(today));

  // Contextual recommendations from today's symptoms (max 5)
  const contextualRecs: Recommendation[] = todayLog
    ? getRecommendations(todayLog)
    : [];

  // Preventive recommendations during menstrual phase (max 3)
  const preventiveRecs: Recommendation[] =
    phase === 'menstrual' ? getMenstrualPhaseRecommendations() : [];

  const hasAny = contextualRecs.length > 0 || preventiveRecs.length > 0;

  if (!hasAny) {
    return null;
  }

  return (
    <section aria-labelledby="recommendations-heading">
      <h3
        id="recommendations-heading"
        className="text-h3 font-semibold text-text-primary mb-3"
      >
        {t('dashboard.recommendations')}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Preventive recommendations for menstrual phase */}
        {preventiveRecs.map((rec) => (
          <RecommendationCard key={rec.id} recommendation={rec} variant="preventive" />
        ))}

        {/* Contextual recommendations from today's symptoms */}
        {contextualRecs.map((rec) => (
          <RecommendationCard key={rec.id} recommendation={rec} variant="contextual" />
        ))}
      </div>
    </section>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  variant: 'contextual' | 'preventive';
}

function RecommendationCard({ recommendation, variant }: RecommendationCardProps) {
  const { t } = useTranslation();
  const categoryLabel = t(`dashboard.recCategory.${recommendation.category}`);

  return (
    <Card className="flex gap-3 items-start">
      {recommendation.icon && (
        <span className="text-h2 flex-shrink-0" aria-hidden="true">
          {recommendation.icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-body text-text-primary">{recommendation.text}</p>
        <p className="text-label text-text-secondary mt-1">
          {categoryLabel}
          {variant === 'preventive' && (
            <span className="ml-2 text-label text-text-secondary italic">
              ({t('dashboard.preventive')})
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}
