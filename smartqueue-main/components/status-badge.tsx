import { CheckCircle2, Clock, Wrench, XCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  // Kamus Warna dan Icon untuk setiap status
  const statusConfig: Record<string, { bg: string, text: string, border: string, icon: any, label: string }> = {
    'Menunggu': { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20', icon: Clock, label: 'Menunggu' },
    'Diproses': { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', icon: Wrench, label: 'Diproses' },
    'Kendala': { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20', icon: AlertTriangle, label: 'Tertunda' },
    'Selesai': { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20', icon: CheckCircle2, label: 'Selesai' },
    'Dibatalkan': { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', icon: XCircle, label: 'Dibatalkan' }
  };

  // Fallback (Warna Cadangan) jika status tidak dikenali agar tidak crash
  const config = statusConfig[status] || { 
    bg: 'bg-gray-500/10', 
    text: 'text-gray-600', 
    border: 'border-gray-500/20', 
    icon: Clock, 
    label: status || 'Unknown' 
  };
  
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-3 py-1.5 text-xs gap-1.5';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span className={`inline-flex items-center rounded-full font-bold border ${config.bg} ${config.text} ${config.border} ${sizeClasses} w-max`}>
      <Icon className={iconSize} /> {config.label}
    </span>
  );
}