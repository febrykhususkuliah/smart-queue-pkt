// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at?: Date;
  phone?: string;
  address?: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  user_id: string;
  merk: string;
  tipe: string;
  tahun: number;
  plat_nomor: string;
  created_at: Date;
  user_name?: string;
}

// Queue Types
export type QueueStatus = 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan';

export interface ServiceQueue {
  id: string;
  queue_number: string;
  user_id: string;
  vehicle_id: string;
  complaint: string;
  service_date: Date;
  status: QueueStatus;
  created_at: Date;
  merk?: string;
  tipe?: string;
  tahun?: number;
  plat_nomor?: string;
  user_name?: string;
}

// Service History Types
export interface ServiceHistory {
  id: string;
  queue_id: string;
  service_notes: string | null;
  completed_at: Date | null;
  queue_number?: string;
  user_name?: string;
  merk?: string;
  tipe?: string;
  complaint?: string;
}

// Queue Logs Types
export interface QueueLog {
  id: string;
  queue_id: string;
  queue_number?: string;
  old_status: QueueStatus | null;
  new_status: QueueStatus | null;
  changed_by: number | null;
  changed_at: Date;
  changed_by_name?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalUsers?: number;
  totalVehicles?: number;
  totalQueuestoday: number;
  totalCompletedServices: number;
  totalPendingQueues: number;
  totalProcessingQueues: number;
}

export interface MonthlyData {
  month: string;
  queues: number;
  completed: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VehicleFormData {
  merk: string;
  tipe: string;
  tahun: number;
  plat_nomor: string;
}

export interface QueueFormData {
  vehicle_id: string;
  complaint: string;
  service_date: Date | string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
