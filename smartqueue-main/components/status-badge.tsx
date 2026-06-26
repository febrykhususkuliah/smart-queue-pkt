'use client';

import { QueueStatus } from '@/lib/types';
import { QUEUE_STATUS_LABELS, QUEUE_STATUS_COLORS } from '@/lib/constants';

interface StatusBadgeProps {
  status: QueueStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = QUEUE_STATUS_COLORS[status];
  const label = QUEUE_STATUS_LABELS[status];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
    >
      {label}
    </span>
  );
}
