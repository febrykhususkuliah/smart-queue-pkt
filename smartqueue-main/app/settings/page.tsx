'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Bell, Lock, Eye, EyeOff, LogOut, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { User } from '@/lib/types';

// SKEMA DIUBAH: Email dan SMS notifications telah dihapus
const notificationSchema = z.object({
  queueUpdates: z.boolean(),
  maintenanceReminders: z.boolean(),
  systemUpdates: z.boolean(),
});

type NotificationSettings = z.infer<typeof notificationSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const passwordSchema = z
    .object({
      currentPassword: z.string().min(6, 'Password minimal 6 karakter'),
      newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Password tidak cocok',
      path: ['confirmPassword'],
    });

  type PasswordFormData = z.infer<typeof passwordSchema>;

  const {
    register: registerNotifications,
    handleSubmit: handleNotificationsSubmit,
  } = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      queueUpdates: true,
      maintenanceReminders: true,
      systemUpdates: true,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [router]);

  const onNotificationsSubmit = async (data: NotificationSettings) => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(data));
      setSettings(data);
      toast.success('Pengaturan notifikasi berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui pengaturan');
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Password berhasil diubah');
      resetPassword();
      setShowPasswordForm(false);
    } catch (error) {
      toast.error('Gagal mengubah password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Berhasil logout');
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    if (confirm('Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.')) {
      localStorage.removeItem('user');
      localStorage.removeItem('appSettings');
      localStorage.removeItem('notifications');
      toast.success('Akun berhasil dihapus');
      router.push('/login');
    }
  };

  if (!user) {
    return <p className="text-foreground/60">Loading...</p>;
  }

  return (
    <DashboardLayout>
      {/* mx-auto dipastikan terpasang agar rata tengah */}
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pengaturan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kelola preferensi dan keamanan akun Anda
          </p>
        </div>

        {/* Notification Settings */}
        <div className="card-base p-6 rounded-3xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notifikasi Dalam Aplikasi</h2>
          </div>

          <form onSubmit={handleNotificationsSubmit(onNotificationsSubmit)} className="space-y-4">
            {/* Queue Updates */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Update Antrian</h3>
                <p className="text-xs text-muted-foreground">Notifikasi pembaruan status pengerjaan mesin secara langsung</p>
              </div>
              <input
                type="checkbox"
                {...registerNotifications('queueUpdates')}
                className="w-5 h-5 rounded border-border cursor-pointer accent-primary"
              />
            </div>

            {/* Maintenance Reminders */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Pengingat Setup Ulang</h3>
                <p className="text-xs text-muted-foreground">Ingatkan jadwal cek berkala pasca modifikasi/bore up</p>
              </div>
              <input
                type="checkbox"
                {...registerNotifications('maintenanceReminders')}
                className="w-5 h-5 rounded border-border cursor-pointer accent-primary"
              />
            </div>

            {/* System Updates */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-border">
              <div>
                <h3 className="font-medium text-foreground">Update Workshop</h3>
                <p className="text-xs text-muted-foreground">Informasi fitur baru web dan promo paket modifikasi bengkel</p>
              </div>
              <input
                type="checkbox"
                {...registerNotifications('systemUpdates')}
                className="w-5 h-5 rounded border-border cursor-pointer accent-primary"
              />
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-colors mt-2">
              Simpan Pengaturan
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="card-base p-6 rounded-3xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Keamanan</h2>
          </div>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full p-4 bg-muted rounded-2xl hover:bg-muted/80 transition-colors text-left border border-border"
            >
              <h3 className="font-medium text-foreground">Ubah Password</h3>
              <p className="text-xs text-muted-foreground">Perbarui kata sandi akun keamanan Anda</p>
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerPassword('currentPassword')}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-xs text-destructive">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerPassword('newPassword')}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-xs text-destructive">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('confirmPassword')}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPasswordSubmitting}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPasswordSubmitting ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Session & Account */}
        <div className="card-base p-6 rounded-3xl border border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-6">Sesi & Akun</h2>

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full p-4 bg-muted rounded-2xl hover:bg-muted/80 transition-colors text-left flex items-center justify-between group border border-border"
            >
              <div>
                <h3 className="font-medium text-foreground">Logout</h3>
                <p className="text-xs text-muted-foreground">Keluar dengan aman dari sistem paddock</p>
              </div>
              <LogOut className="h-5 w-5 text-foreground/40 group-hover:text-foreground/60" />
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl transition-colors text-left flex items-center justify-between group border border-red-500/20"
            >
              <div>
                <h3 className="font-medium text-red-600 dark:text-red-400">Hapus Akun</h3>
                <p className="text-xs text-red-500/70 dark:text-red-400/70">Menghapus data garasi dan booking secara permanen</p>
              </div>
              <Trash2 className="h-5 w-5 text-red-500 group-hover:text-red-600" />
            </button>
          </div>
        </div>

        {/* App Information */}
        <div className="card-base p-6 rounded-3xl border border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-6">Informasi Sistem</h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Versi Aplikasi</span>
              <span className="font-medium text-foreground">v1.0.0-pkt-racing</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Koneksi Core API</span>
              <span className="font-medium text-foreground text-success">Connected v1</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Sinkronisasi Terakhir</span>
              <span className="font-medium text-foreground">
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>44
      </div>
    </DashboardLayout>
  );
}