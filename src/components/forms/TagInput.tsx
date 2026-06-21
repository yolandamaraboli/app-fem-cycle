import { useState } from 'react';

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
  id: string;
}

export function TagInput({
  label,
  tags,
  onChange,
  maxTags = 10,
  maxTagLength = 30,
  id,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (tags.length >= maxTags) return;
    if (trimmed.length > maxTagLength) return;
    if (tags.includes(trimmed)) return;

    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm font-medium text-text-primary">
        {label} ({tags.length}/{maxTags})
      </label>
      <div className="flex flex-wrap gap-2 mb-1.5">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-body-sm rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              aria-label={`Remove tag ${tag}`}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/20 transition-fast focus-visible:outline-2 focus-visible:outline-primary"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.slice(0, maxTagLength))}
          onKeyDown={handleKeyDown}
          placeholder={tags.length >= maxTags ? '' : `Max ${maxTagLength} chars`}
          disabled={tags.length >= maxTags}
          maxLength={maxTagLength}
          className={[
            'flex-1 px-3 py-2 min-h-[44px]',
            'rounded-button border border-border',
            'bg-card text-text-primary text-body-sm',
            'placeholder:text-text-secondary',
            'transition-fast',
            'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={tags.length >= maxTags || !inputValue.trim()}
          aria-label="Add tag"
          className={[
            'px-3 py-2 min-h-[44px] min-w-[44px]',
            'rounded-button border border-border',
            'bg-primary text-text-on-primary text-body-sm font-medium',
            'transition-fast cursor-pointer',
            'hover:bg-primary-hover',
            'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          +
        </button>
      </div>
    </div>
  );
}
