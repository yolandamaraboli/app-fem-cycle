import { useTranslation } from '../i18n';
import { CyclePhaseCard } from '../components/dashboard/CyclePhaseCard';
import { PregnancyBadge } from '../components/dashboard/PregnancyBadge';
import { RecommendationCards } from '../components/dashboard/RecommendationCards';
import { QuickStats } from '../components/dashboard/QuickStats';

/**
 * Dashboard page — main view that composes cycle phase card,
 * pregnancy probability badge, recommendations, and quick stats.
 */
export function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold text-text-primary">
        {t('nav.dashboard')}
      </h1>

      {/* Cycle phase and pregnancy in a responsive grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <CyclePhaseCard />
        <PregnancyBadge />
      </div>

      {/* Quick statistics */}
      <QuickStats />

      {/* Recommendations section */}
      <RecommendationCards />
    </div>
  );
}
