import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={[
        'bg-card rounded-card p-5 shadow-card border border-border-card',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
