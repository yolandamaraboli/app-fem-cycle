interface ScaleInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  id: string;
}

export function ScaleInput({ label, value, onChange, min = 0, max = 5, id }: ScaleInputProps) {
  const levels = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm font-medium text-text-primary">
        {label}
      </label>
      <div id={id} role="radiogroup" aria-label={label} className="flex gap-1.5">
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={value === level}
            aria-label={`${label} ${level}`}
            onClick={() => onChange(level)}
            className={[
              'w-9 h-9 min-w-[36px] min-h-[36px] rounded-full',
              'flex items-center justify-center',
              'text-body-sm font-medium',
              'transition-fast cursor-pointer',
              'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
              value === level
                ? 'bg-primary text-text-on-primary shadow-button-primary'
                : 'bg-background border border-border text-text-secondary hover:bg-hover-row',
            ].join(' ')}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}
