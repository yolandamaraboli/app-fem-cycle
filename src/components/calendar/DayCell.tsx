import { format, isToday } from 'date-fns';

interface DayCellProps {
  date: Date;
  phaseColor: string | null;
  hasSymptoms: boolean;
  onClick: (date: Date) => void;
}

export function DayCell({ date, phaseColor, hasSymptoms, onClick }: DayCellProps) {
  const today = isToday(date);
  const dayNumber = format(date, 'd');

  return (
    <button
      type="button"
      onClick={() => onClick(date)}
      aria-label={`${format(date, 'yyyy-MM-dd')}${hasSymptoms ? ' (has logged symptoms)' : ''}`}
      className={[
        'relative flex flex-col items-center justify-center',
        'w-full aspect-square rounded-lg',
        'text-body-sm font-medium',
        'transition-fast cursor-pointer',
        'hover:opacity-80 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
        'min-h-[44px]',
      ].join(' ')}
      style={{
        backgroundColor: phaseColor ? `${phaseColor}25` : undefined,
        border: today ? '2px solid #EE6B8A' : '1px solid transparent',
      }}
    >
      <span className="text-text-primary">{dayNumber}</span>
      {hasSymptoms && (
        <span
          className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
