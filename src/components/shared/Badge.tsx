import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  variant?: 'solid' | 'outline';
  className?: string;
}

export function Badge({
  children,
  color,
  variant = 'solid',
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-pill px-3 py-1 text-label font-medium';

  const dynamicStyles: React.CSSProperties =
    variant === 'solid'
      ? {
          backgroundColor: color ? `${color}20` : undefined,
          color: color ?? undefined,
        }
      : {
          backgroundColor: 'transparent',
          color: color ?? undefined,
          border: `1.5px solid ${color ?? 'currentColor'}`,
        };

  return (
    <span
      className={[baseStyles, className].join(' ')}
      style={dynamicStyles}
    >
      {children}
    </span>
  );
}
