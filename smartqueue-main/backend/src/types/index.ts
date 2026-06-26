// backend/src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  created_at: Date;
}

export interface Vehicle {
  id: number;
  user_id: number;
  merk: string;
  tipe: string;
  tahun: number;
  plat_nomor: string;
  created_at: Date;
}

export interface ServiceQueue {
  id: number;
  queue_number: string;
  user_id: number;
  vehicle_id: number;
  complaint: string;
  service_date: Date;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan';
  created_at: Date;
}

export interface ServiceHistory {
  id: number;
  queue_id: number;
  service_notes?: string;
  completed_at?: Date;
}

export interface QueueLog {
  id: number;
  queue_id: number;
  old_status?: string;
  new_status: string;
  changed_by?: number;
  changed_at: Date;
}

// Request/Response types

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateVehicleRequest {
  merk: string;
  tipe: string;
  tahun: number;
  plat_nomor: string;
}

export interface UpdateVehicleRequest extends CreateVehicleRequest {}

export interface CreateQueueRequest {
  vehicle_id: number;
  complaint: string;
  service_date: string; // ISO date format
}

export interface UpdateQueueStatusRequest {
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface CreateServiceHistoryRequest {
  queue_id: number;
  service_notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code: number;
}

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: JWTPayload;
}
