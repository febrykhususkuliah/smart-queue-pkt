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

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  queueUpdates: z.boolean(),
  maintenanceReminders: z.boolean(),
  systemUpdates: z.boolean(),
});

const twoFactorSchema = z.object({
  enable2FA: z.boolean(),
  backupCodes: z.boolean(),
});

type NotificationSettings = z.infer<typeof notificationSchema>;
type TwoFactorSettings = z.infer<typeof twoFactorSchema>;

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
    watch: watchNotifications,
    handleSubmit: handleNotificationsSubmit,
  } = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
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

  const notificationSettings = watchNotifications();

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
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pengaturan</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Kelola preferensi dan keamanan akun Anda
          </p>
        </div>

        {/* Notification Settings */}
        <div className="card-base">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notifikasi</h2>
          </div>

          <form onSubmit={handleNotificationsSubmit(onNotificationsSubmit)} className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Email Notifications</h3>
                <p className="text-sm text-foreground/60">Terima notifikasi melalui email</p>
              </div>
              <input
                type="checkbox"
                {...registerNotifications('emailNotifications')}
                className="w-5 h-5 rounded border-border cursor-pointer"
              />
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">SMS Notifications</h3>
                <p className="text-sm text-foreground/60">Terima notifikasi melalui SMS</p>
              </div>
              <input
                type="checkbox"
                {...registerNotifications('smsNotifications')}
                className="w-5 h-5 rounded border-border cursor-pointer"
              />
            </div>

            {/* Queue Updates */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Update Antrian</h3>
                <p className="text-sm text-foreground/60">Notifikasi update status antrian</p>
              </div>
              <input
                type="checkbox"
                {...registerNotifications('queueUpdates')}
                className="w-5 h-5 rounded border-border cursor-pointer"
              />
            </div>

            {/* Maintenance Reminders */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Pengingat Maintenance</h3>
                <p className="text-sm text-foreground/60">Ingatkan jadwal maintenance kendaraan</p>
              </div>
              <input
                type="checkbox"
                {...registerNotifications('maintenanceReminders')}
                className="w-5 h-5 rounded border-border cursor-pointer"
              />
            </div>

            {/* System Updates */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Update Sistem</h3>
                <p className="text-sm text-foreground/60">Informasi update sistem dan fitur baru</p>
              </div>
              <input
                type="checkbox"
                {...registerNotifications('systemUpdates')}
                className="w-5 h-5 rounded border-border cursor-pointer"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Simpan Pengaturan Notifikasi
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="card-base">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Keamanan</h2>
          </div>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <h3 className="font-medium text-foreground">Ubah Password</h3>
              <p className="text-sm text-foreground/60">Perbarui password akun Anda</p>
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
                    className="input-field"
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
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
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
                    className="input-field"
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
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword('confirmPassword')}
                    className="input-field"
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="btn-ghost flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPasswordSubmitting}
                  className="btn-primary flex-1"
                >
                  {isPasswordSubmitting ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Session & Account */}
        <div className="card-base">
          <h2 className="text-lg font-semibold text-foreground mb-6">Sesi & Akun</h2>

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors text-left flex items-center justify-between group"
            >
              <div>
                <h3 className="font-medium text-foreground">Logout</h3>
                <p className="text-sm text-foreground/60">Keluar dari akun</p>
              </div>
              <LogOut className="h-5 w-5 text-foreground/40 group-hover:text-foreground/60" />
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left flex items-center justify-between group border border-red-200"
            >
              <div>
                <h3 className="font-medium text-red-900">Hapus Akun</h3>
                <p className="text-sm text-red-700">Tindakan ini tidak dapat dibatalkan</p>
              </div>
              <Trash2 className="h-5 w-5 text-red-600 group-hover:text-red-700" />
            </button>
          </div>
        </div>

        {/* App Information */}
        <div className="card-base">
          <h2 className="text-lg font-semibold text-foreground mb-6">Informasi Aplikasi</h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-foreground/60">Versi Aplikasi</span>
              <span className="font-medium text-foreground">v1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-foreground/60">Versi API</span>
              <span className="font-medium text-foreground">v1</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-foreground/60">Last Updated</span>
              <span className="font-medium text-foreground">
                {new Date().toLocaleDateString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
