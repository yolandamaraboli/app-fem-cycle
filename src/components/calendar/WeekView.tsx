import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format,
} from 'date-fns';
import { DayCell } from './DayCell';

interface WeekViewProps {
  currentDate: Date;
  firstDayOfWeek: 0 | 1;
  getPhaseColorForDate: (date: Date) => string | null;
  hasSymptoms: (date: Date) => boolean;
  onDayClick: (date: Date) => void;
  dayLabels: string[];
  currentMonth: Date;
}

export function WeekView({
  currentDate,
  firstDayOfWeek,
  getPhaseColorForDate,
  hasSymptoms,
  onDayClick,
  dayLabels,
  currentMonth,
}: WeekViewProps) {
  const weekOptions = { weekStartsOn: firstDayOfWeek } as const;
  const weekStart = startOfWeek(currentDate, weekOptions);
  const weekEnd = endOfWeek(currentDate, weekOptions);

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div role="grid" aria-label={`Week of ${format(weekStart, 'MMM d')}`}>
      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1" role="row">
        {dayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-label text-text-secondary font-medium py-2"
            role="columnheader"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Week row */}
      <div className="grid grid-cols-7 gap-1" role="rowgroup">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          if (!inMonth) {
            return (
              <div
                key={day.toISOString()}
                className="w-full aspect-square"
                aria-hidden="true"
              />
            );
          }
          return (
            <DayCell
              key={day.toISOString()}
              date={day}
              phaseColor={getPhaseColorForDate(day)}
              hasSymptoms={hasSymptoms(day)}
              onClick={onDayClick}
            />
          );
        })}
      </div>
    </div>
  );
}
