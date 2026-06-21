import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, isAfter, startOfDay } from 'date-fns';
import { useTranslation } from '../i18n';
import { SymptomForm } from '../components/forms/SymptomForm';

function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function isValidDate(dateStr: string): boolean {
  const parsed = new Date(dateStr + 'T00:00:00');
  if (isNaN(parsed.getTime())) return false;
  // Only allow today or past dates
  const today = startOfDay(new Date());
  return !isAfter(startOfDay(parsed), today);
}

export function DailyLog() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (dateParam && isValidDate(dateParam)) {
      return dateParam;
    }
    return getTodayISO();
  });

  const handleDateChange = (newDate: string) => {
    if (isValidDate(newDate)) {
      setSelectedDate(newDate);
      setSearchParams({ date: newDate });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-h1 font-bold text-text-primary">
          {t('nav.dailyLog')}
        </h1>

        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <label htmlFor="log-date" className="text-body-sm font-medium text-text-secondary">
            Date:
          </label>
          <input
            id="log-date"
            type="date"
            value={selectedDate}
            max={getTodayISO()}
            onChange={(e) => handleDateChange(e.target.value)}
            className={[
              'px-3 py-2 min-h-[44px]',
              'rounded-button border border-border',
              'bg-card text-text-primary text-body-sm',
              'transition-fast',
              'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
            ].join(' ')}
          />
        </div>
      </div>

      {/* Form */}
      <SymptomForm date={selectedDate} />
    </div>
  );
}
