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
import { Wrench } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// DAFTAR MODIFIKASI KHUSUS BENGKEL PKT RACING
const MOD_SERVICES = [
  { id: 'Tune Up', label: 'Tune Up & Kirian (Meningkatkan Performa Harian)', est: '~2-3 Jam' },
  { id: 'Porting Polish', label: 'Porting Polish (Optimalisasi Jalur Udara)', est: '~1-2 Hari' },
  { id: 'Bore Up', label: 'Bore Up / Stroke Up (Sistem Kenaikan CC)', est: '~3-7 Hari' },
  { id: 'Dyno Test', label: 'Dyno Test + Remap ECU (Setting Kurva Power)', est: '~1-2 Jam' },
  { id: 'Kaki-Kaki', label: 'Modifikasi Kaki-Kaki & Suspensi', est: '~3-5 Jam' },
];

const queueSchema = z.object({
  vehicle_id: z.string().min(1, 'Pilih kendaraan Anda'),
  service_type: z.string().min(1, 'Pilih jenis layanan modifikasi/servis'),
  complaint: z.string().min(5, 'Detail spek/keluhan minimal 5 karakter').max(500, 'Maksimal 500 karakter'),
  service_date: z.string().min(1, 'Pilih tanggal booking'),
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
    defaultValues: {
      service_type: '',
    }
  });

  const selectedServiceType = watch('service_type');

  // Cari informasi estimasi berdasarkan opsi yang sedang dipilih pengguna
  const currentEstimation = MOD_SERVICES.find(s => s.id === selectedServiceType)?.est;

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

      // TRIK CERDAS: Menggabungkan Tipe Servis ke Teks Keluhan sebelum dikirim ke database backend
      const combinedComplaint = `[${data.service_type}] ${data.complaint}`;

      const response = await fetch(`${API_BASE_URL}/api/queues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: Number(data.vehicle_id),
          complaint: combinedComplaint,
          service_date: data.service_date,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || 'Gagal membuat antrean');
      }

      toast.success('Booking jadwal modifikasi berhasil didaftarkan!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Create queue error:', error);
      toast.error('Gagal membuat antrean service');
    }
  };

  if (!user) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Booking Jadwal Workshop</h1>
          <p className="mt-2 text-muted-foreground">Daftarkan motor Anda untuk pengerjaan modifikasi performa di Bengkel PKT</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          {vehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Anda belum mendaftarkan motor di akun ini.</p>
              <button
                onClick={() => router.push('/vehicles')}
                className="mt-4 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Tambahkan motor terlebih dahulu →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-2xl bg-primary/10 p-4 border border-primary/20 flex items-center gap-3">
                <Wrench className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm text-primary font-semibold">Sistem Booking PKT Racing</p>
                  <p className="text-xs text-foreground/70">Nomor urut pengerjaan mesin akan digenerate otomatis.</p>
                </div>
              </div>

              {/* CHOOSE VEHICLE */}
              <div>
                <label className="block text-sm font-medium text-foreground">Pilih Motor Anda *</label>
                <select
                  {...register('vehicle_id')}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Pilih motor dari garasi...</option>
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

              {/* NEW FIELD: CHOOSE SERVICE TYPE */}
              <div>
                <label className="block text-sm font-medium text-foreground">Jenis Pengerjaan Utama *</label>
                <select
                  {...register('service_type')}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Pilih jenis modifikasi/servis...</option>
                  {MOD_SERVICES.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.label}
                    </option>
                  ))}
                </select>
                {errors.service_type && (
                  <p className="mt-1 text-sm text-destructive">{errors.service_type.message}</p>
                )}
              </div>

              {/* REAL-TIME DYNAMIC ESTIMATION BOX */}
              {selectedServiceType && currentEstimation && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">Estimasi Durasi Workshop</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{currentEstimation}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Waktu pengerjaan nyata bergantung pada antrean fisik di bengkel dan kerumitan setting mesin.</p>
                </div>
              )}

              {/* COMPLAINT / SPECS */}
              <div>
                <label className="block text-sm font-medium text-foreground">Detail Request Modifikasi & Spek *</label>
                <textarea
                  placeholder="Contoh: Request bore up paket 62mm, porting polish, ecu aracer, sertakan detail keluhan atau part yang dibawa sendiri jika ada..."
                  {...register('complaint')}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                />
                {errors.complaint && (
                  <p className="mt-1 text-sm text-destructive">{errors.complaint.message}</p>
                )}
              </div>

              {/* BOOKING DATE */}
              <div>
                <label className="block text-sm font-medium text-foreground">Tanggal Masuk Motor *</label>
                <input
                  type="date"
                  {...register('service_date')}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {errors.service_date && (
                  <p className="mt-1 text-sm text-destructive">{errors.service_date.message}</p>
                )}
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Booking Sekarang'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}