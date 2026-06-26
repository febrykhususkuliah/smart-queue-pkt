'use client';

import { useEffect, useState } from 'react';
import { StatisticCard } from '@/components/statistic-card';
import { EmptyState } from '@/components/empty-state';
import { toast } from 'sonner';
import { Car, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthToken, getStoredSession } from '@/lib/auth';
import { SessionUser, ServiceQueue, Vehicle } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [queues, setQueues] = useState<ServiceQueue[]>([]);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.push('/login');
      return;
    }

    setUser(stored.user);

    const fetchDashboardData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const [vehicleResponse, queueResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/vehicles`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/queues`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!vehicleResponse.ok || !queueResponse.ok) {
          throw new Error('Gagal memuat data dashboard');
        }

        const vehicleResult = await vehicleResponse.json();
        const queueResult = await queueResponse.json();

        setVehicles(
          (vehicleResult.data || []).map((vehicle: any) => ({
            id: String(vehicle.id),
            user_id: String(vehicle.user_id),
            merk: vehicle.merk,
            tipe: vehicle.tipe,
            tahun: Number(vehicle.tahun),
            plat_nomor: vehicle.plat_nomor,
            created_at: new Date(vehicle.created_at),
          }))
        );

        setQueues(
          (queueResult.data || []).map((queue: any) => ({
            id: String(queue.id),
            queue_number: queue.queue_number,
            user_id: String(queue.user_id),
            vehicle_id: String(queue.vehicle_id),
            complaint: queue.complaint,
            service_date: new Date(queue.service_date),
            status: queue.status,
            created_at: new Date(queue.created_at),
            merk: queue.merk || '',
            tipe: queue.tipe || '',
            tahun: queue.tahun,
            plat_nomor: queue.plat_nomor || '',
            user_name: queue.user_name || '',
          }))
        );
      } catch (error) {
        console.error('Fetch dashboard data error:', error);
        toast.error('Gagal memuat data dashboard. Silakan login kembali.');
        router.push('/login');
      }
    };

    fetchDashboardData();
  }, [router]);

  if (!user) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const userVehicles = vehicles;
  const userQueues = queues;
  const activeQueues = userQueues.filter(
    (q) => q.status !== 'Selesai' && q.status !== 'Dibatalkan'
  );
  const completedQueues = userQueues.filter((q) => q.status === 'Selesai');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Selamat datang kembali, {user.name}!</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatisticCard
          title="Total Kendaraan"
          value={userVehicles.length}
          icon={<Car className="h-6 w-6" />}
          variant="default"
        />
        <StatisticCard
          title="Antrian Aktif"
          value={activeQueues.length}
          icon={<AlertCircle className="h-6 w-6" />}
          variant="warning"
        />
        <StatisticCard
          title="Service Selesai"
          value={completedQueues.length}
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Kendaraan Saya</h2>
          <Link
            href="/vehicles"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Lihat Semua →
          </Link>
        </div>

        {userVehicles.length === 0 ? (
          <EmptyState
            title="Belum ada kendaraan"
            description="Tambahkan kendaraan Anda untuk memulai membuat antrian service"
            icon={<Car className="h-12 w-12" />}
            action={{
              label: 'Tambah Kendaraan',
              onClick: () => router.push('/vehicles'),
            }}
          />
        ) : (
          <div className="space-y-3">
            {userVehicles.slice(0, 3).map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between rounded-3xl border border-border bg-muted p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {vehicle.merk} {vehicle.tipe}
                  </p>
                  <p className="text-sm text-muted-foreground">{vehicle.plat_nomor}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{vehicle.tahun}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Antrian Saya</h2>
            <p className="mt-1 text-sm text-muted-foreground">Lihat nomor antrean dan tanggal service yang telah Anda buat</p>
          </div>
          <Link
            href="/queue/create"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Buat Antrian Baru →
          </Link>
        </div>

        {userQueues.length === 0 ? (
          <EmptyState
            title="Belum ada antrian"
            description="Buat antrian service untuk melihat nomor antrean dan tanggal service Anda"
            icon={<AlertCircle className="h-12 w-12" />}
            action={{
              label: 'Buat Antrian',
              onClick: () => router.push('/queue/create'),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">No. Antrian</th>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Tanggal Service</th>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Kendaraan</th>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {userQueues.map((queue) => (
                  <tr key={queue.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{queue.queue_number}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {queue.service_date.toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {queue.merk ? `${queue.merk} ${queue.tipe}` : 'Belum dipilih'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{queue.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/queue/create"
          className="flex items-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-primary/10 p-6 hover:border-primary/40 hover:bg-primary/15 transition-colors"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Buat Antrian Baru</p>
            <p className="text-sm text-muted-foreground">Daftarkan kendaraan untuk service</p>
          </div>
        </Link>

        <Link
          href="/service-history"
          className="flex items-center gap-4 rounded-3xl border border-dashed border-success/30 bg-success/10 p-6 hover:border-success/40 hover:bg-success/15 transition-colors"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success text-success-foreground">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Lihat Riwayat Service</p>
            <p className="text-sm text-muted-foreground">Histori service kendaraan Anda</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
