interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id: string;
}

export function SelectInput({ label, value, onChange, options, id }: SelectInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm font-medium text-text-primary">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'px-3 py-2 min-h-[44px]',
          'rounded-button border border-border',
          'bg-card text-text-primary text-body-sm',
          'transition-fast',
          'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
          'cursor-pointer',
        ].join(' ')}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
