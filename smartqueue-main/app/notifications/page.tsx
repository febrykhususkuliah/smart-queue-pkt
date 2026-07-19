'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Bell, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await apiClient.get('/notifications'); // Pastikan endpoint ini ada di backend-mu
        if (res && res.success) {
          setNotifications(res.data);
        }
      } catch (error) {
        console.error('Gagal mengambil notifikasi', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  // Helper untuk memberikan icon dan warna sesuai judul notifikasi
  const getNotifStyle = (title: string) => {
    if (title.includes('Kendala') || title.includes('Tertunda') || title.includes('Penyesuaian')) {
      return { icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-500/10 border-orange-500/30' };
    }
    if (title.includes('Waktu')) {
      return { icon: <Clock className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-500/10 border-blue-500/30' };
    }
    if (title.includes('Selesai')) {
      return { icon: <CheckCircle className="w-5 h-5 text-green-500" />, bg: 'bg-green-500/10 border-green-500/30' };
    }
    if (title.includes('Paddock') || title.includes('Mulai')) {
      return { icon: <Wrench className="w-5 h-5 text-primary" />, bg: 'bg-primary/10 border-primary/30' };
    }
    return { icon: <Bell className="w-5 h-5 text-muted-foreground" />, bg: 'bg-muted border-border' };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pusat Notifikasi</h1>
          <p className="text-muted-foreground text-sm">Pantau pembaruan status dan waktu estimasi motor Anda.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <CheckCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Belum ada notifikasi</h3>
          <p className="text-muted-foreground text-sm">Semua pembaruan pengerjaan akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => {
            const style = getNotifStyle(notif.title);
            return (
              <div key={notif.id} className={`p-5 rounded-2xl border ${style.bg} backdrop-blur-sm flex items-start gap-4 transition-all hover:scale-[1.01]`}>
                <div className="mt-1">{style.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-foreground">{notif.title}</h3>
                    <span className="text-xs font-medium text-muted-foreground">
                      {new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}