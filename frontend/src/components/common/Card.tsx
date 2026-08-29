import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'highlight' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-surface border border-surface-border text-slate-100 shadow-card',
    glass: 'glass-panel text-slate-100 shadow-card',
    highlight: 'bg-gradient-to-br from-surface to-surface-lighter border border-indigo-500/30 text-slate-100 shadow-card',
    interactive: 'bg-surface border border-surface-border text-slate-100 shadow-card hover:border-indigo-500/50 hover:shadow-card-hover transition-all duration-200 cursor-pointer',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={clsx(
        'rounded-xl backdrop-blur-sm',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
