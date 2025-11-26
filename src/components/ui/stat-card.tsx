import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'yellow' | 'teal' | 'pink' | 'cyan';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border-border',
  yellow: 'bg-yellow-light border-yellow/20',
  teal: 'bg-teal-light border-teal/20',
  pink: 'bg-pink-light border-pink/20',
  cyan: 'bg-cyan-light border-cyan/20',
};

const titleStyles = {
  default: 'text-muted-foreground',
  yellow: 'text-yellow-dark',
  teal: 'text-teal-dark',
  pink: 'text-pink-dark',
  cyan: 'text-cyan-dark',
};

const valueStyles = {
  default: 'text-foreground',
  yellow: 'text-yellow-dark',
  teal: 'text-teal-dark',
  pink: 'text-pink-dark',
  cyan: 'text-cyan-dark',
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = 'default',
  className 
}: StatCardProps) {
  return (
    <div 
      className={cn(
        'rounded-xl border p-4 transition-all card-hover',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-sm font-medium', titleStyles[variant])}>
            {title}
          </p>
          <p className={cn('mt-1 text-2xl font-bold', valueStyles[variant])}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn('rounded-lg p-2', `bg-${variant}/10`)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
