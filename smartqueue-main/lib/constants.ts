export const QUEUE_STATUS_LABELS: Record<string, string> = {
  'Menunggu': 'Menunggu',
  'Diproses': 'Diproses',
  'Selesai': 'Selesai',
  'Dibatalkan': 'Dibatalkan',
  // Legacy keys for backward compatibility
  pending: 'Menunggu',
  processing: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const QUEUE_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Menunggu': {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
  },
  'Diproses': {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  'Selesai': {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
  },
  'Dibatalkan': {
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/30',
  },
  // Legacy keys for backward compatibility
  pending: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
  },
  processing: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  completed: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
  },
  cancelled: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/30',
  },
};

export const VEHICLE_BRANDS = [
  'Honda',
  'Yamaha',
  'Suzuki',
  'Kawasaki',
  'Vespa',
  'Piaggio',
  'KTM',
  'Ducati',
  'Triumph',
  'Lainnya',
];

export const VEHICLE_TYPES = [
  'Matic',
  'Bebek (Cub)',
  'Sport Fairing',
  'Sport Naked',
  'Maxi Scooter',
  'Trail / Off-Road',
  'Klasik / Custom',
  'Lainnya',
];

export const NAVIGATION_ITEMS_USER = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Kendaraan Saya', href: '/vehicles', icon: 'Car' }, 
  { label: 'Buat Antrean', href: '/queue/create', icon: 'Plus' },
  { label: 'Riwayat Servis', href: '/service-history', icon: 'History' },
  { label: 'Profil', href: '/profile', icon: 'User' },
  { label: 'Pengaturan', href: '/settings', icon: 'Settings' },
];

export const NAVIGATION_ITEMS_ADMIN = [
  { label: 'Dashboard Admin', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Data Pengguna', href: '/admin/users', icon: 'Users' },
  { label: 'Data Kendaraan', href: '/admin/vehicles', icon: 'Car' },
  { label: 'Data Antrean', href: '/admin/queues', icon: 'ListTodo' },
  { label: 'Riwayat Servis', href: '/admin/service-history', icon: 'History' },
  { label: 'Log Antrean', href: '/admin/queue-logs', icon: 'Logs' },
];