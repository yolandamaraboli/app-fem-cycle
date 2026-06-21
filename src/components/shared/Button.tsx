import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-primary text-text-on-primary shadow-button-primary hover:bg-primary-hover hover:shadow-button-primary-hover',
  secondary:
    'bg-card text-text-primary border border-border hover:bg-hover-row',
  ghost:
    'bg-transparent text-text-primary hover:bg-hover-row',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-body-sm min-h-[36px]',
  md: 'px-4 py-2.5 text-body min-h-[44px]',
  lg: 'px-6 py-3 text-body min-h-[52px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'inline-flex items-center justify-center font-medium',
        'rounded-button cursor-pointer select-none',
        'transition-fast',
        'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
