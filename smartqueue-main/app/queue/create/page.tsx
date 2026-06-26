'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { getAuthToken, getStoredSession } from '@/lib/auth';
import { Vehicle, SessionUser } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

const queueSchema = z.object({
  vehicle_id: z.string().min(1, 'Pilih kendaraan'),
  complaint: z.string().min(5, 'Keluhan minimal 5 karakter').max(500, 'Keluhan maksimal 500 karakter'),
  service_date: z.string().min(1, 'Pilih tanggal service'),
});

type QueueFormData = z.infer<typeof queueSchema>;

export default function CreateQueuePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QueueFormData>({
    resolver: zodResolver(queueSchema),
  });

  const vehicleId = watch('vehicle_id');

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.push('/login');
      return;
    }

    setUser(stored.user);

    const fetchUserVehicles = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/vehicles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Gagal memuat kendaraan');
        }

        const result = await response.json();
        const mappedVehicles: Vehicle[] = (result.data || []).map((vehicle: any) => ({
          id: String(vehicle.id),
          user_id: String(vehicle.user_id),
          merk: vehicle.merk,
          tipe: vehicle.tipe,
          tahun: Number(vehicle.tahun),
          plat_nomor: vehicle.plat_nomor,
          created_at: new Date(vehicle.created_at),
        }));

        setVehicles(mappedVehicles);
      } catch (error) {
        console.error('Fetch vehicles error:', error);
        toast.error('Gagal memuat kendaraan. Silakan login kembali.');
        router.push('/login');
      }
    };

    fetchUserVehicles();
  }, [router]);

  const onSubmit = async (data: QueueFormData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/queues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: Number(data.vehicle_id),
          complaint: data.complaint,
          service_date: data.service_date,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || 'Gagal membuat antrian');
      }

      toast.success('Antrian berhasil dibuat. Silakan cek dashboard Anda.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Create queue error:', error);
      toast.error('Gagal membuat antrian');
    }
  };

  if (!user) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Buat Antrian Service</h1>
          <p className="mt-2 text-muted-foreground">Daftarkan kendaraan Anda untuk service di bengkel</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          {vehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Anda belum memiliki kendaraan.</p>
              <button
                onClick={() => router.push('/vehicles')}
                className="mt-4 text-primary hover:text-primary/80 font-medium"
              >
                Tambahkan kendaraan terlebih dahulu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-3xl bg-primary/10 p-4 border border-primary/20">
                <p className="text-sm text-primary font-medium">Nomor Antrian</p>
                <p className="mt-2 text-base text-foreground">Nomor akan dibuat otomatis setelah submit</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Pilih Kendaraan *</label>
                <select
                  {...register('vehicle_id')}
                  className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Pilih kendaraan...</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.merk} {vehicle.tipe} ({vehicle.plat_nomor})
                    </option>
                  ))}
                </select>
                {errors.vehicle_id && (
                  <p className="mt-1 text-sm text-destructive">{errors.vehicle_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Keluhan Kendaraan *</label>
                <textarea
                  placeholder="Jelaskan keluhan atau masalah pada kendaraan Anda..."
                  {...register('complaint')}
                  rows={4}
                  className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-2.5 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                />
                {errors.complaint && (
                  <p className="mt-1 text-sm text-destructive">{errors.complaint.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Tanggal Service *</label>
                <input
                  type="date"
                  {...register('service_date')}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {errors.service_date && (
                  <p className="mt-1 text-sm text-destructive">{errors.service_date.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 rounded-3xl border border-border px-4 py-2.5 font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-3xl bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Membuat...' : 'Daftar Service'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
