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
  'Toyota',
  'Honda',
  'Daihatsu',
  'Suzuki',
  'Mitsubishi',
  'Isuzu',
  'Hyundai',
  'Kia',
  'Ford',
  'Chevrolet',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Volkswagen',
  'Lainnya',
];

export const VEHICLE_TYPES = [
  'Mobil Penumpang',
  'Mobil Keluarga',
  'MPV',
  'SUV',
  'Pickup Truck',
  'Bus',
  'Truk',
  'Lainnya',
];

export const NAVIGATION_ITEMS_USER = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Kendaraan Saya', href: '/vehicles', icon: 'Car' },
  { label: 'Buat Antrian', href: '/queue/create', icon: 'Plus' },
  { label: 'Riwayat Service', href: '/service-history', icon: 'History' },
  { label: 'Profile', href: '/profile', icon: 'User' },
  { label: 'Pengaturan', href: '/settings', icon: 'Settings' },
];

export const NAVIGATION_ITEMS_ADMIN = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Data User', href: '/admin/users', icon: 'Users' },
  { label: 'Data Kendaraan', href: '/admin/vehicles', icon: 'Car' },
  { label: 'Data Antrian', href: '/admin/queues', icon: 'ListTodo' },
  { label: 'Riwayat Service', href: '/admin/service-history', icon: 'History' },
  { label: 'Queue Logs', href: '/admin/queue-logs', icon: 'Logs' },
];
