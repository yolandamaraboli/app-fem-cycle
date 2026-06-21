import { differenceInDays, parseISO, format } from 'date-fns';
import { useCycleStore } from '../store/useCycleStore';
import { getCurrentPhase } from '../lib/cycle';
import { getPhaseColor } from '../lib/storage';

interface UseCurrentPhaseResult {
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | null;
  dayInCycle: number;
  daysUntilNextPhase: number;
  phaseColor: string;
}

export function useCurrentPhase(): UseCurrentPhaseResult {
  const getActiveCycle = useCycleStore((state) => state.getActiveCycle);
  const activeCycle = getActiveCycle();

  if (!activeCycle) {
    return {
      phase: null,
      dayInCycle: 0,
      daysUntilNextPhase: 0,
      phaseColor: '',
    };
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const phase = getCurrentPhase(today, activeCycle);

  if (!phase) {
    return {
      phase: null,
      dayInCycle: 0,
      daysUntilNextPhase: 0,
      phaseColor: '',
    };
  }

  const dayInCycle = differenceInDays(parseISO(today), parseISO(activeCycle.startDate)) + 1;

  // Calculate days until next phase based on current phase's end date
  const currentPhaseRange = activeCycle.phases[phase];
  const phaseEndDate = parseISO(currentPhaseRange.end);
  const todayDate = parseISO(today);
  const daysUntilNextPhase = differenceInDays(phaseEndDate, todayDate);

  const phaseColor = getPhaseColor(phase);

  return {
    phase,
    dayInCycle,
    daysUntilNextPhase,
    phaseColor,
  };
}
