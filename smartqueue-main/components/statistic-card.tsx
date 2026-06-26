'use client';

interface StatisticCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'border-border bg-card',
  success: 'border-success/30 bg-success/5',
  warning: 'border-warning/30 bg-warning/5',
  danger: 'border-danger/30 bg-danger/5',
};

const variantIconStyles = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export function StatisticCard({
  title,
  value,
  icon,
  description,
  variant = 'default',
}: StatisticCardProps) {
  return (
    <div className={`rounded-lg border p-6 transition-colors ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground/60">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {description && <p className="mt-1 text-xs text-foreground/50">{description}</p>}
        </div>
        {icon && <div className={`flex-shrink-0 text-2xl ${variantIconStyles[variant]}`}>{icon}</div>}
      </div>
    </div>
  );
}
