'use client';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'table-row' | 'text';
}

export function LoadingSkeleton({ count = 1, type = 'card' }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'card') {
    return (
      <div className="space-y-4">
        {items.map((i) => (
          <div key={i} className="h-32 rounded-lg bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (type === 'table-row') {
    return (
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-10 flex-1 rounded bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse"></div>
            <div className="h-10 w-20 rounded bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i} className="h-4 rounded bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse"></div>
      ))}
    </div>
  );
}
