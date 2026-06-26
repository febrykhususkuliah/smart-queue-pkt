'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatisticCard } from '@/components/statistic-card';
import { Users, Car, ListTodo, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { User } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Color palette helper
const getChartColors = (isDark: boolean) => ({
  border: isDark ? '#334155' : '#E2E8F0',
  foreground: isDark ? '#94A3B8' : '#64748B',
  primary: isDark ? '#3B82F6' : '#2563EB',
  success: isDark ? '#22C55E' : '#16A34A',
  warning: isDark ? '#F59E0B' : '#F59E0B',
  tooltipBg: isDark ? '#1E293B' : '#F1F5F9',
});

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
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

    // Fetch admin stats
    if (parsedUser.role === 'admin') {
      (async () => {
        try {
          const res = await apiClient.get('/admin/stats');
          if (res && res.success && res.data) {
            setStats(res.data);
            setMonthlyData(res.data.monthlyData || []);
          } else {
            setStats({});
          }
        } catch (e) {
          setStats({});
        }
      })();
    }

    // Detect theme
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [router]);

  if (!user || !stats) {
    return <p className="text-foreground/60">Loading...</p>;
  }

  const colors = getChartColors(isDark);

  if (!user) {
    return <p className="text-foreground/60">Loading...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="mt-2 text-foreground/60">Kelola sistem antrian service bengkel</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatisticCard
          title="Total User"
          value={stats?.totalUsers ?? 0}
          icon={<Users className="h-6 w-6" />}
          variant="default"
        />
        <StatisticCard
          title="Total Kendaraan"
          value={stats?.totalVehicles ?? 0}
          icon={<Car className="h-6 w-6" />}
          variant="default"
        />
        <StatisticCard
          title="Antrian Hari Ini"
          value={stats?.totalQueuestoday ?? 0}
          icon={<ListTodo className="h-6 w-6" />}
          variant="warning"
        />
        <StatisticCard
          title="Service Selesai"
          value={stats?.totalCompletedServices ?? 0}
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Antrian Bulanan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="month" stroke={colors.foreground} />
              <YAxis stroke={colors.foreground} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: colors.tooltipBg, 
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.5rem',
                  color: isDark ? '#F8FAFC' : '#0F172A'
                }} 
              />
              <Legend wrapperStyle={{ color: isDark ? '#F8FAFC' : '#0F172A' }} />
              <Bar dataKey="queues" fill={colors.primary} name="Antrian" radius={[8, 8, 0, 0]} />
              <Bar dataKey="completed" fill={colors.success} name="Selesai" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Trend Service</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="month" stroke={colors.foreground} />
              <YAxis stroke={colors.foreground} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: colors.tooltipBg, 
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.5rem',
                  color: isDark ? '#F8FAFC' : '#0F172A'
                }} 
              />
              <Legend wrapperStyle={{ color: isDark ? '#F8FAFC' : '#0F172A' }} />
              <Line
                type="monotone"
                dataKey="queues"
                stroke={colors.primary}
                name="Antrian"
                strokeWidth={2}
                dot={{ fill: colors.primary, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke={colors.success}
                name="Selesai"
                strokeWidth={2}
                dot={{ fill: colors.success, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-foreground/60 font-medium">Pending Queue</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: colors.warning }}>
            {stats?.totalPendingQueues ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-foreground/60 font-medium">Processing Queue</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: colors.primary }}>
            {stats?.totalProcessingQueues ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-foreground/60 font-medium">Completed Today</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: colors.success }}>
            {stats?.totalCompletedServices ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
