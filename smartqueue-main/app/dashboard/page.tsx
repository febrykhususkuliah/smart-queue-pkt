'use client';

import { useEffect, useState } from 'react';
import { StatisticCard } from '@/components/statistic-card';
import { EmptyState } from '@/components/empty-state';
import { toast } from 'sonner';
import { Car, AlertCircle, CheckCircle, Zap, Printer, Activity, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthToken, getStoredSession } from '@/lib/auth';
import { SessionUser, ServiceQueue, Vehicle } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// FUNGSI SUPER: Menghitung Jam + Deteksi Beda Hari
const getServiceDetails = (queue: any) => {
  const complaintText = queue.complaint || '';
  const match = complaintText.match(/^\[(.*?)\]/);
  const type = match ? match[1] : 'Service Ringan';
  const cleanComplaint = complaintText.replace(/^\[.*?\]\s*/, '') || '-';

  const durationMap: Record<string, number> = {
    'Service Ringan': 45, 'Servis Umum': 45, 'Tune Up': 120, 
    'Porting Polish': 1440, 'Bore Up Harian': 1440, 'Bore Up Kompetisi': 4320, 
    'Dyno Test': 90, 'Kaki-Kaki': 240, 'Restorasi Mesin': 8640
  };
  
  const baseDuration = durationMap[type] || 45;
  const delay = Number(queue.delay_minutes) || 0; 
  const totalDuration = baseDuration + delay; 
  
  let startTime = new Date();
  
  if (queue.estimated_time) {
    const [hours, minutes] = queue.estimated_time.split(':');
    if (hours && minutes) {
      startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }
  } else if (queue.created_at) {
    startTime = new Date(queue.created_at);
  }

  const endTime = new Date(startTime.getTime() + totalDuration * 60000);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, ':');
  };

  // ⚠️ LOGIKA BARU: Cek apakah motor selesainya nyebrang hari
  let timeRange = `${formatTime(startTime)} - ${formatTime(endTime)}`;
  if (totalDuration >= 1440) {
    const days = Math.floor(totalDuration / 1440);
    timeRange = `${formatTime(startTime)} - ${formatTime(endTime)} (+${days} Hari)`;
  } else if (startTime.getDate() !== endTime.getDate()) {
    timeRange = `${formatTime(startTime)} - ${formatTime(endTime)} (Besok)`;
  }

  let estimationStr = `~${totalDuration >= 60 ? (totalDuration/60).toFixed(1).replace('.0', '') + ' Jam' : totalDuration + ' Menit'}`;

  return { 
    type, 
    cleanComplaint, 
    timeRange,
    estimation: estimationStr,
    hasDelay: delay > 0,
    delayMinutes: delay
  };
};

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [queues, setQueues] = useState<ServiceQueue[]>([]);
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
        if (!token) return;

        const [vehicleResponse, queueResponse, globalQueueResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/queues`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/queues/global`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [vehicleResult, queueResult, globalQueueResult] = await Promise.all([
          vehicleResponse.json(),
          queueResponse.json(),
          globalQueueResponse.json()
        ]);

        setVehicles((vehicleResult.data || []).map((v: any) => ({ ...v, id: String(v.id), tahun: Number(v.tahun), created_at: new Date(v.created_at) })));
        setQueues((queueResult.data || []).map((q: any) => ({ 
          ...q, id: String(q.id), service_date: new Date(q.service_date), created_at: new Date(q.created_at),
          estimated_time: q.estimated_time, delay_minutes: q.delay_minutes || 0 
        })));
        setGlobalQueues(globalQueueResult.data || []);
      } catch (error) {
        toast.error('Gagal memuat data dashboard.');
      }
    };
    
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handlePrintReceipt = (queue: ServiceQueue) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const { type, cleanComplaint, estimation } = getServiceDetails(queue);
    
    const html = `
      <html>
        <body style="font-family: monospace; padding: 20px;">
          <div style="border: 2px dashed #000; width: 300px; padding: 15px;">
            <h1 style="text-align: center;">BENGKEL PKT</h1>
            <h2 style="text-align: center;">${queue.queue_number}</h2>
            <p><strong>Motor:</strong> ${queue.merk} ${queue.tipe}</p>
            <p><strong>Layanan:</strong> ${type}</p>
            <p><strong>Est. Durasi:</strong> ${estimation}</p>
            <p><strong>Keluhan:</strong> ${cleanComplaint}</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (!user) return <p className="text-muted-foreground">Loading...</p>;

  const activeQueues = queues.filter((q) => q.status !== 'Selesai' && q.status !== 'Dibatalkan');
  const completedQueues = queues.filter((q) => q.status === 'Selesai');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Workshop</h1>
        <p className="mt-2 text-muted-foreground">Selamat datang kembali, {user.name}!</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatisticCard title="Total Motor di Garasi" value={vehicles.length} icon={<Car className="h-6 w-6" />} variant="default" />
        <StatisticCard title="Project Workshop Aktif" value={activeQueues.length} icon={<AlertCircle className="h-6 w-6" />} variant="warning" />
        <StatisticCard title="Project Selesai" value={completedQueues.length} icon={<CheckCircle className="h-6 w-6" />} variant="success" />
      </div>

      {/* STATUS ANTREAN PRIBADI */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Status Pengerjaan Mesin Anda</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-4 text-sm font-semibold">No. Antrean</th>
                <th className="px-4 py-4 text-sm font-semibold">Kategori & Unit</th>
                <th className="px-4 py-4 text-sm font-semibold">Jadwal Pengerjaan</th>
                <th className="px-4 py-4 text-sm font-semibold text-center">Nota</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((queue) => {
                const { type, timeRange, hasDelay, delayMinutes } = getServiceDetails(queue);
                return (
                  <tr key={queue.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4 font-bold">{queue.queue_number}</td>
                    <td className="px-4 py-4">
                      {queue.merk} {queue.tipe} <br/> 
                      <span className="inline-block mt-1 text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">{type}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-mono text-sm font-medium">{timeRange}</div>
                      {hasDelay && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-500 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 w-max">
                          <AlertTriangle className="w-3 h-3" /> +{delayMinutes}m Tertunda
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => handlePrintReceipt(queue)} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LIVE PADDOCK MONITOR */}
      <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <Activity className="w-32 h-32 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          Live Paddock Monitor
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-background relative z-10">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-semibold">No. Antrean</th>
                <th className="px-4 py-3 font-semibold">Unit Motor</th>
                <th className="px-4 py-3 font-semibold">Jenis Layanan</th>
                <th className="px-4 py-3 font-semibold">Jadwal Pengerjaan</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {globalQueues.map((gq, idx) => {
                const { type, timeRange, hasDelay, delayMinutes } = getServiceDetails(gq);
                return (
                  <tr key={idx} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-bold">{gq.queue_number}</td>
                    <td className="px-4 py-3">{gq.merk} {gq.tipe}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{type}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-medium">{timeRange}</div>
                      {hasDelay && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-500 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 w-max">
                          <AlertTriangle className="w-3 h-3" /> +{delayMinutes}m Tertunda
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${gq.status === 'Diproses' ? 'bg-primary/20 text-primary animate-pulse' : gq.status === 'Kendala' ? 'bg-orange-500/20 text-orange-600' : 'bg-warning/20 text-warning'}`}>
                        {gq.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}