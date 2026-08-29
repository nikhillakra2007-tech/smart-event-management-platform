import React from 'react';
import clsx from 'clsx';

export type BadgeVariant = 
  | 'default' 
  | 'success' 
  | 'warning' 
  | 'critical' 
  | 'info' 
  | 'purple' 
  | 'cyan'
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-surface-lighter text-slate-300 border-surface-border',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-800/50',
    critical: 'bg-rose-950/60 text-rose-400 border-rose-800/50',
    info: 'bg-sky-950/60 text-sky-400 border-sky-800/50',
    purple: 'bg-violet-950/60 text-violet-400 border-violet-800/50',
    cyan: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/50',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-slate-400',
    success: 'bg-emerald-400 animate-pulse',
    warning: 'bg-amber-400',
    critical: 'bg-rose-400 animate-ping',
    info: 'bg-sky-400',
    purple: 'bg-violet-400',
    cyan: 'bg-cyan-400',
    neutral: 'bg-slate-500',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
