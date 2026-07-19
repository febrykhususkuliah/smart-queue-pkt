'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatisticCard } from '@/components/statistic-card';
import { Users, Car, ListTodo, CheckCircle, Trophy, Settings } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { User } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const getChartColors = (isDark: boolean) => ({
  border: isDark ? '#334155' : '#E2E8F0',
  foreground: isDark ? '#94A3B8' : '#64748B',
  primary: isDark ? '#EAB308' : '#D97706', // Diubah jadi Kuning PKT
  success: isDark ? '#22C55E' : '#16A34A',
  warning: isDark ? '#F59E0B' : '#F59E0B',
  tooltipBg: isDark ? '#0B1221' : '#FFFFFF',
});

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [topVehicles, setTopVehicles] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUser(parsedUser);

    if (parsedUser.role === 'admin') {
      (async () => {
        try {
          const res = await apiClient.get('/admin/stats');
          if (res && res.success && res.data) {
            setStats(res.data);
            setMonthlyData(res.data.monthlyData || []);
            setTopVehicles(res.data.topVehicles || []);
          } else {
            setStats({});
          }
        } catch (e) {
          setStats({});
        }
      })();
    }

    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [router]);

  if (!user || !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Settings className="w-10 h-10 animate-spin text-primary" />
           <p className="text-foreground/60 font-medium font-mono">Memuat Analitik Data...</p>
        </div>
      </div>
    );
  }

  const colors = getChartColors(isDark);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="mt-2 text-foreground/60">Kelola sistem antrian dan analisis performa bengkel</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatisticCard title="Total Pelanggan" value={stats?.totalUsers ?? 0} icon={<Users className="h-6 w-6" />} variant="default" />
        <StatisticCard title="Motor Terdaftar" value={stats?.totalVehicles ?? 0} icon={<Car className="h-6 w-6" />} variant="default" />
        <StatisticCard title="Antrean Hari Ini" value={stats?.totalQueuestoday ?? 0} icon={<ListTodo className="h-6 w-6" />} variant="warning" />
        <StatisticCard title="Service Selesai" value={stats?.totalCompletedServices ?? 0} icon={<CheckCircle className="h-6 w-6" />} variant="success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-6">Grafik Antrean Bulanan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData.length > 0 ? monthlyData : [{ month: 'Belum ada data', queues: 0, completed: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
              <XAxis dataKey="month" stroke={colors.foreground} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={colors.foreground} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: isDark ? '#1E293B' : '#F1F5F9' }} contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.border}`, borderRadius: '0.8rem', color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ color: isDark ? '#F8FAFC' : '#0F172A', paddingTop: '20px' }} />
              <Bar dataKey="queues" fill={colors.primary} name="Total Masuk" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="completed" fill={colors.success} name="Diselesaikan" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-6">Tren Produktivitas Paddock</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData.length > 0 ? monthlyData : [{ month: 'Belum ada data', queues: 0, completed: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
              <XAxis dataKey="month" stroke={colors.foreground} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={colors.foreground} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.border}`, borderRadius: '0.8rem', color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ color: isDark ? '#F8FAFC' : '#0F172A', paddingTop: '20px' }} />
              <Line type="monotone" dataKey="queues" stroke={colors.primary} name="Tren Masuk" strokeWidth={3} dot={{ fill: colors.primary, r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="completed" stroke={colors.success} name="Tren Selesai" strokeWidth={3} dot={{ fill: colors.success, r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bagian Bawah: Quick Stats & Top Motor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Stats (Kiri) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 font-medium">Pending & Kendala</p>
              <p className="mt-1 text-4xl font-black text-warning">{stats?.totalPendingQueues ?? 0}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center text-warning text-xl">⏳</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 font-medium">Sedang Diproses</p>
              <p className="mt-1 text-4xl font-black text-primary">{stats?.totalProcessingQueues ?? 0}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">⚙️</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 font-medium">Total Motor Selesai</p>
              <p className="mt-1 text-4xl font-black text-success">{stats?.totalCompletedServices ?? 0}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success text-xl">🏁</div>
          </div>
        </div>

        {/* Top Motor Ranking (Kanan) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Top 5 Motor Paling Sering Masuk Paddock</h2>
          </div>
          
          <div className="space-y-5">
            {topVehicles.length === 0 ? (
              <p className="text-muted-foreground italic text-center py-8">Belum ada data kendaraan yang diservis.</p>
            ) : (
              topVehicles.map((vehicle, index) => {
                // Kalkulasi persentase bar (relatif terhadap motor urutan pertama)
                const maxService = topVehicles[0].total_service;
                const percentage = Math.max(10, Math.round((vehicle.total_service / maxService) * 100));
                
                return (
                  <div key={index} className="relative">
                    <div className="flex justify-between text-sm mb-1.5 font-bold">
                      <span className="text-foreground">#{index + 1} {vehicle.merk} {vehicle.tipe}</span>
                      <span className="text-primary">{vehicle.total_service}x Servis</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}