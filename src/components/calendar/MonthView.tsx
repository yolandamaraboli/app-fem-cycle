import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format,
} from 'date-fns';
import { DayCell } from './DayCell';

interface MonthViewProps {
  currentMonth: Date;
  firstDayOfWeek: 0 | 1;
  getPhaseColorForDate: (date: Date) => string | null;
  hasSymptoms: (date: Date) => boolean;
  onDayClick: (date: Date) => void;
  dayLabels: string[];
}

export function MonthView({
  currentMonth,
  firstDayOfWeek,
  getPhaseColorForDate,
  hasSymptoms,
  onDayClick,
  dayLabels,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const weekOptions = { weekStartsOn: firstDayOfWeek } as const;
  const calendarStart = startOfWeek(monthStart, weekOptions);
  const calendarEnd = endOfWeek(monthEnd, weekOptions);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div role="grid" aria-label={format(currentMonth, 'MMMM yyyy')}>
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

      {/* Calendar grid */}
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
