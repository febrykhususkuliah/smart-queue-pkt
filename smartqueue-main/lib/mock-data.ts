import { User, Vehicle, ServiceQueue, ServiceHistory, QueueLog } from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    role: 'user',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 123, Jakarta',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    email: 'siti@example.com',
    role: 'user',
    phone: '082345678901',
    address: 'Jl. Sudirman No. 456, Bandung',
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Andi Wijaya',
    email: 'admin@example.com',
    role: 'admin',
    phone: '083456789012',
    address: 'Jl. Gatot Subroto No. 789, Surabaya',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  },
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    user_id: '1',
    merk: 'Toyota',
    tipe: 'Mobil Keluarga',
    tahun: 2020,
    plat_nomor: 'B 1234 ABC',
    created_at: new Date('2024-01-15'),
    user_name: 'Budi Santoso',
  },
  {
    id: 'v2',
    user_id: '1',
    merk: 'Honda',
    tipe: 'SUV',
    tahun: 2022,
    plat_nomor: 'B 5678 XYZ',
    created_at: new Date('2024-02-01'),
    user_name: 'Budi Santoso',
  },
  {
    id: 'v3',
    user_id: '2',
    merk: 'Mitsubishi',
    tipe: 'Pickup Truck',
    tahun: 2019,
    plat_nomor: 'D 9012 DEF',
    created_at: new Date('2024-01-20'),
    user_name: 'Siti Nurhaliza',
  },
];

// Mock Service Queues
export const mockServiceQueues: ServiceQueue[] = [
  {
    id: 'q1',
    queue_number: 'SRV-0001',
    user_id: '1',
    vehicle_id: 'v1',
    complaint: 'Mesin berbunyi kasar',
    service_date: new Date('2024-06-13'),
    status: 'Diproses',
    created_at: new Date('2024-06-13T08:30:00'),
    merk: 'Toyota',
    tipe: 'Mobil Keluarga',
    tahun: 2020,
    plat_nomor: 'B 1234 ABC',
  },
  {
    id: 'q2',
    queue_number: 'SRV-0002',
    user_id: '1',
    vehicle_id: 'v2',
    complaint: 'Kampas rem tipis',
    service_date: new Date('2024-06-13'),
    status: 'Menunggu',
    created_at: new Date('2024-06-13T09:00:00'),
    merk: 'Honda',
    tipe: 'SUV',
    tahun: 2022,
    plat_nomor: 'B 5678 XYZ',
  },
  {
    id: 'q3',
    queue_number: 'SRV-0003',
    user_id: '2',
    vehicle_id: 'v3',
    complaint: 'Servis berkala',
    service_date: new Date('2024-06-13'),
    status: 'Selesai',
    created_at: new Date('2024-06-13T07:00:00'),
    merk: 'Mitsubishi',
    tipe: 'Pickup Truck',
    tahun: 2019,
    plat_nomor: 'D 9012 DEF',
  },
  {
    id: 'q4',
    queue_number: 'SRV-0004',
    user_id: '1',
    vehicle_id: 'v1',
    complaint: 'Penggantian oli',
    service_date: new Date('2024-06-14'),
    status: 'Menunggu',
    created_at: new Date('2024-06-13T11:00:00'),
    merk: 'Toyota',
    tipe: 'Mobil Keluarga',
    tahun: 2020,
    plat_nomor: 'B 1234 ABC',
  },
];

// Mock Service History
export const mockServiceHistory: ServiceHistory[] = [
  {
    id: 'sh1',
    queue_id: 'q3',
    service_notes: 'Ganti oli, filter, dan busi',
    completed_at: new Date('2024-06-13T12:30:00'),
    // removed created_at: ServiceHistory doesn't include created_at
  },
  {
    id: 'sh2',
    queue_id: 'q1',
    service_notes: 'Pembersihan karburator dan penggantian spark plug',
    completed_at: new Date('2024-06-12T15:00:00'),
  },
];

// Mock Queue Logs
export const mockQueueLogs: QueueLog[] = [
  {
    id: 'log1',
    queue_id: 'q1',
    old_status: 'Menunggu',
    new_status: 'Diproses',
    changed_by: null,
    changed_at: new Date('2024-06-13T10:15:00'),
    changed_by_name: 'Mekanik 1',
  },
  {
    id: 'log2',
    queue_id: 'q3',
    old_status: 'Diproses',
    new_status: 'Selesai',
    changed_by: null,
    changed_at: new Date('2024-06-13T12:30:00'),
    changed_by_name: 'Mekanik 2',
  },
];

// Mock Monthly Data
export const mockMonthlyData = [
  { month: 'Jan', queues: 45, completed: 42 },
  { month: 'Feb', queues: 52, completed: 48 },
  { month: 'Mar', queues: 48, completed: 46 },
  { month: 'Apr', queues: 61, completed: 58 },
  { month: 'May', queues: 55, completed: 52 },
  { month: 'Jun', queues: 67, completed: 63 },
];

// Mock Dashboard Stats
export const mockDashboardStats = {
  totalUsers: mockUsers.filter((u) => u.role === 'user').length,
  totalVehicles: mockVehicles.length,
  totalQueuestoday: mockServiceQueues.filter(
    (q) => q.service_date.toDateString() === new Date().toDateString()
  ).length,
  totalCompletedServices: mockServiceHistory.length,
  totalPendingQueues: mockServiceQueues.filter((q) => q.status === 'Menunggu').length,
  totalProcessingQueues: mockServiceQueues.filter((q) => q.status === 'Diproses').length,
};
