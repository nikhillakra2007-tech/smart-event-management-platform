import React from 'react';
import clsx from 'clsx';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'indigo',
  className,
}) => {
  const accentBorders = {
    indigo: 'border-l-4 border-l-indigo-500',
    cyan: 'border-l-4 border-l-cyan-500',
    emerald: 'border-l-4 border-l-emerald-500',
    amber: 'border-l-4 border-l-amber-500',
    rose: 'border-l-4 border-l-rose-500',
    violet: 'border-l-4 border-l-violet-500',
  };

  const iconColors = {
    indigo: 'text-indigo-400 bg-indigo-950/50 border-indigo-800/40',
    cyan: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/40',
    emerald: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40',
    amber: 'text-amber-400 bg-amber-950/50 border-amber-800/40',
    rose: 'text-rose-400 bg-rose-950/50 border-rose-800/40',
    violet: 'text-violet-400 bg-violet-950/50 border-violet-800/40',
  };

  return (
    <Card className={clsx('relative overflow-hidden transition-all duration-200 hover:translate-y-[-2px]', accentBorders[accentColor], className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <p
              className={clsx(
                'mt-2 inline-flex items-center text-xs font-semibold',
                trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-lg border shadow-inner', iconColors[accentColor])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
