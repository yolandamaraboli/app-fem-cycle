import { format } from 'date-fns';
import { useCycleStore } from '../store/useCycleStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  calculatePregnancyProbability,
  canShowPregnancyProbability,
} from '../lib/pregnancy';

/**
 * Hook that returns the current pregnancy probability.
 * Uses the active cycle and user settings to determine the level.
 */
export function usePregnancyProbability(): {
  level: 'high' | 'medium' | 'low' | null;
  canShow: boolean;
} {
  const activeCycle = useCycleStore((state) => state.getActiveCycle());
  const settings = useSettingsStore((state) => state.settings);

  if (!canShowPregnancyProbability(activeCycle)) {
    return { level: null, canShow: false };
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const level = calculatePregnancyProbability(
    today,
    activeCycle!.startDate,
    settings.cycleLengthAvg,
    settings.lutealPhaseDays
  );

  return { level, canShow: true };
}
