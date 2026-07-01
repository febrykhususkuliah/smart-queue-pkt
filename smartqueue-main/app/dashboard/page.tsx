'use client';

import { useEffect, useState } from 'react';
import { StatisticCard } from '@/components/statistic-card';
import { EmptyState } from '@/components/empty-state';
import { toast } from 'sonner';
import { Car, AlertCircle, CheckCircle, Zap, Printer, Clock, Activity } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthToken, getStoredSession } from '@/lib/auth';
import { SessionUser, ServiceQueue, Vehicle } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// Fungsi pembantu untuk membaca tipe pengerjaan & menentukan estimasi waktu secara dinamis
const getServiceDetails = (complaintText: string) => {
  const match = complaintText?.match(/^\[(.*?)\]/);
  const type = match ? match[1] : 'Servis Umum';
  // Bersihkan teks keluhan asli dari tag [Kategori]
  const cleanComplaint = complaintText?.replace(/^\[.*?\]\s*/, '') || '-';

  let estimation = '~45 Menit';
  if (type === 'Tune Up') estimation = '~2-3 Jam';
  else if (type === 'Porting Polish') estimation = '~1-2 Hari';
  else if (type === 'Bore Up') estimation = '~3-7 Hari';
  else if (type === 'Dyno Test') estimation = '~1-2 Jam';
  else if (type === 'Kaki-Kaki') estimation = '~3-5 Jam';

  return { type, cleanComplaint, estimation };
};

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [queues, setQueues] = useState<ServiceQueue[]>([]);
  
  // STATE: Untuk menampung data antrean bengkel secara global
  const [globalQueues, setGlobalQueues] = useState<any[]>([]);

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

        const [vehicleResponse, queueResponse, globalQueueResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/vehicles`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/queues`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/queues/global`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!vehicleResponse.ok || !queueResponse.ok) {
          throw new Error('Gagal memuat data dashboard');
        }

        const vehicleResult = await vehicleResponse.json();
        const queueResult = await queueResponse.json();
        const globalQueueResult = globalQueueResponse.ok ? await globalQueueResponse.json() : { data: [] };

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

        setGlobalQueues(globalQueueResult.data || []);

      } catch (error) {
        console.error('Fetch dashboard data error:', error);
        toast.error('Gagal memuat data dashboard. Silakan login kembali.');
        router.push('/login');
      }
    };

    fetchDashboardData();
  }, [router]);

  // FUNGSI CETAK STRUK DIGITAL WORKSHOP RACING
  const handlePrintReceipt = (queue: ServiceQueue) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Izinkan pop-up browser untuk mencetak struk');
      return;
    }

    const { type, cleanComplaint, estimation } = getServiceDetails(queue.complaint);

    const dateStr = queue.service_date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk Booking Workshop - ${queue.queue_number}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; color: #000; background: #fff; padding: 20px; display: flex; justify-content: center; }
            .receipt-box { border: 2px dashed #000; width: 350px; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            h1 { text-align: center; font-size: 24px; margin-bottom: 5px; font-weight: 900; letter-spacing: 1px; }
            p.subtitle { text-align: center; font-size: 13px; margin-top: 0; border-bottom: 1px dashed #000; padding-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
            .info-col { margin: 15px 0; font-size: 14px; }
            .queue-box { text-align: center; border: 2px solid #000; margin: 20px 0; padding: 12px; border-radius: 8px; }
            .queue-box p { margin: 0 0 5px 0; font-size: 12px; font-weight: bold; }
            .queue-box h2 { margin: 0; font-size: 42px; font-weight: 900; }
            .footer { text-align: center; font-size: 11px; margin-top: 25px; border-top: 1px dashed #000; padding-top: 15px; font-style: italic; }
            @media print {
              body { padding: 0; display: block; }
              .receipt-box { border: none; box-shadow: none; width: 100%; max-width: 350px; margin: 0 auto; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <h1>BENGKEL PKT RACING</h1>
            <p class="subtitle">Sistem Antrean & Booking Workshop<br/>Spesialis High Performance Engine</p>
            
            <div class="queue-box">
              <p>NOMOR URUT BOOKING</p>
              <h2>${queue.queue_number}</h2>
            </div>

            <div class="info-row">
              <span><strong>Tanggal Masuk:</strong></span>
              <span>${dateStr}</span>
            </div>
            <div class="info-row">
              <span><strong>Pelanggan:</strong></span>
              <span style="text-align: right;">${user?.name}</span>
            </div>
            <div class="info-row">
              <span><strong>Unit Motor:</strong></span>
              <span style="text-align: right;">${queue.merk} ${queue.tipe}<br/>(${queue.plat_nomor})</span>
            </div>
            <div class="info-row" style="border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px;">
              <span><strong>Menu Utama:</strong></span>
              <span><strong>${type}</strong></span>
            </div>
            <div class="info-row">
              <span><strong>Est. Durasi:</strong></span>
              <span><strong>${estimation}</strong></span>
            </div>
            
            <div class="info-col" style="border-top: 1px dashed #000; padding-top: 8px;">
              <strong>Detail Request & Spek:</strong><br/>
              <span style="display: block; margin-top: 5px; padding: 10px; background: #f8f9fa; border: 1px solid #ddd; font-size: 13px; white-space: pre-wrap;">${cleanComplaint}</span>
            </div>

            <div class="footer">
              Waktu pengerjaan nyata bergantung pada<br/>
              antrean fisik workshop & kompleksitas mesin.<br/><br/>
              <strong>#EngineeredToWin - Terima Kasih!</strong>
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(() => { window.print(); window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
        <h1 className="text-3xl font-bold text-foreground">Dashboard Workshop</h1>
        <p className="mt-2 text-muted-foreground">Selamat datang kembali di paddock, {user.name}!</p>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatisticCard
          title="Total Motor di Garasi"
          value={userVehicles.length}
          icon={<Car className="h-6 w-6" />}
          variant="default"
        />
        <StatisticCard
          title="Project Workshop Aktif"
          value={activeQueues.length}
          icon={<AlertCircle className="h-6 w-6" />}
          variant="warning"
        />
        <StatisticCard
          title="Project Selesai Setup"
          value={completedQueues.length}
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
        />
      </div>

      {/* KENDARAAN SAYA */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Motor Saya</h2>
          <Link
            href="/vehicles"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Lihat Semua →
          </Link>
        </div>

        {userVehicles.length === 0 ? (
          <EmptyState
            title="Belum ada kendaraan"
            description="Tambahkan kendaraan Anda untuk memulai membuat antrean servis"
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
                className="flex items-center justify-between rounded-3xl border border-border bg-muted p-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {vehicle.merk} {vehicle.tipe}
                  </p>
                  <p className="text-sm text-muted-foreground">{vehicle.plat_nomor}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                  Tahun {vehicle.tahun}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STATUS ANTREAN PRIBADI */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Status Pengerjaan Mesin Anda</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pantau durasi modifikasi dan unduh nota antrean digital Anda</p>
          </div>
          <Link
            href="/queue/create"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Buat Booking Baru →
          </Link>
        </div>

        {userQueues.length === 0 ? (
          <EmptyState
            title="Belum ada data booking"
            description="Buat jadwal booking modifikasi mesin untuk memantau status antrean mekanik Anda."
            icon={<AlertCircle className="h-12 w-12" />}
            action={{
              label: 'Buat Booking',
              onClick: () => router.push('/queue/create'),
            }}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-4 text-sm font-semibold text-foreground">No. Urut</th>
                  <th className="px-4 py-4 text-sm font-semibold text-foreground">Kategori & Spek</th>
                  <th className="px-4 py-4 text-sm font-semibold text-foreground">Status & Estimasi</th>
                  <th className="px-4 py-4 text-sm font-semibold text-foreground text-center">Nota</th>
                </tr>
              </thead>
              <tbody>
                {userQueues.map((queue) => {
                  const { type, cleanComplaint, estimation } = getServiceDetails(queue.complaint);

                  return (
                    <tr key={queue.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-foreground">{queue.queue_number}</span>
                          <span className="text-xs text-muted-foreground">{queue.service_date.toLocaleDateString('id-ID')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-foreground">
                          {queue.merk ? `${queue.merk} ${queue.tipe}` : 'Motor'} 
                          <span className="ml-1.5 px-2 py-0.5 rounded text-xs font-normal bg-primary/10 text-primary border border-primary/20">{type}</span>
                        </div>
                        <span className="block text-xs text-muted-foreground font-normal mt-1 truncate max-w-xs" title={cleanComplaint}>
                          {cleanComplaint}
                        </span>
                        <span className="block text-[11px] text-foreground/40 font-mono mt-0.5">{queue.plat_nomor}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            queue.status === 'Selesai' ? 'bg-success/10 text-success border-success/30' :
                            queue.status === 'Diproses' ? 'bg-primary/10 text-primary border-primary/30' :
                            queue.status === 'Dibatalkan' ? 'bg-destructive/10 text-destructive border-destructive/30' :
                            'bg-warning/10 text-warning border-warning/30'
                          }`}>
                            {queue.status}
                          </span>
                          
                          {(queue.status === 'Menunggu' || queue.status === 'pending' || queue.status === 'Diproses') && (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              <Clock className="h-3 w-3" />
                              <span>Durasi: {estimation}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handlePrintReceipt(queue)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary/80 hover:bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground transition-colors border border-border"
                          title="Cetak Nota Cetak Digital"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Struk</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LIVE PADDOCK MONITOR (GLOBAL QUEUE) DENGAN ESTIMASI */}
      <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <Activity className="w-32 h-32 text-primary" />
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-xl font-bold text-foreground">Live Paddock Monitor</h2>
            </div>
            <p className="text-sm text-muted-foreground">Pantau kepadatan garasi. Menampilkan proyek motor yang sedang aktif (Identitas disensor).</p>
          </div>
          <div className="bg-background border border-border px-4 py-2 rounded-xl text-sm font-semibold">
            Total Proyek Aktif: <span className="text-primary">{globalQueues.length} Unit</span>
          </div>
        </div>

        {globalQueues.length === 0 ? (
          <div className="text-center py-8 bg-background/50 rounded-xl border border-border relative z-10">
            <p className="text-muted-foreground font-medium">Garasi sedang sepi, tidak ada motor yang sedang dikerjakan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-background relative z-10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 font-semibold text-foreground">No. Antrean</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Pelanggan</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Unit Motor</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Jenis Layanan</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Estimasi Waktu</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {globalQueues.map((gq, index) => {
                  const { type, estimation } = getServiceDetails(gq.complaint);
                  return (
                    <tr key={index} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">{gq.queue_number}</td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">{gq.user_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {gq.merk} {gq.tipe} <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-1 font-mono">{gq.plat_nomor}</span>
                      </td>
                      <td className="px-4 py-3">
                         <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3" />
                          <span>{estimation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            gq.status === 'Diproses' ? 'bg-primary/20 text-primary animate-pulse' : 'bg-warning/20 text-warning'
                          }`}>
                            {gq.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK LINKS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/queue/create"
          className="flex items-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-primary/10 p-6 hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-110 transition-transform">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Buat Booking Baru</p>
            <p className="text-sm text-muted-foreground">Daftarkan motor untuk modifikasi mesin</p>
          </div>
        </Link>

        <Link
          href="/service-history"
          className="flex items-center gap-4 rounded-3xl border border-dashed border-success/30 bg-success/10 p-6 hover:border-success/50 hover:shadow-md transition-all group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success text-success-foreground group-hover:scale-110 transition-transform">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Riwayat Workshop</p>
            <p className="text-sm text-muted-foreground">Cek histori setup mesin motor Anda</p>
          </div>
        </Link>
      </div>
    </div>
  );
}