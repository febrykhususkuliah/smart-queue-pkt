'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, User as UserIcon, Mail, Shield } from 'lucide-react';
import { User } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';

const profileSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional(),
});

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

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
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
    // Ensure user object matches `User` type (created_at/updated_at)
    const normalized = {
      ...parsedUser,
      id: String(parsedUser.id),
      created_at: parsedUser.created_at ? new Date(parsedUser.created_at) : parsedUser.createdAt ? new Date(parsedUser.createdAt) : new Date(),
      updated_at: parsedUser.updated_at ? new Date(parsedUser.updated_at) : parsedUser.updatedAt ? new Date(parsedUser.updatedAt) : undefined,
    } as any;
    setUser(normalized);
    resetProfile({
      name: parsedUser.name,
      email: parsedUser.email,
      phone: parsedUser.phone || '',
    });
  }, [router, resetProfile]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!user) return;
      const updatedUser = {
        ...user,
        ...data,
        updated_at: new Date(),
      } as any;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui profil');
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

  if (!user) {
    return <p className="text-foreground/60">Loading...</p>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profil Saya</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Kelola informasi profil dan keamanan akun Anda
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="card-base">
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center h-24 w-24 rounded-lg bg-primary text-primary-foreground text-4xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-foreground/60 mt-1">{user.email}</p>
              <div className="mt-4 flex gap-3">
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </div>
                {user.created_at && (
                  <div className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-foreground/60">
                    Member sejak {new Date(user.created_at).toLocaleDateString('id-ID')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="card-base">
          <div className="flex items-center gap-3 mb-6">
            <UserIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Informasi Profil</h2>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                {...registerProfile('name')}
                className="input-field"
                placeholder="Masukkan nama lengkap"
              />
              {profileErrors.name && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                {...registerProfile('email')}
                className="input-field"
                placeholder="Masukkan email"
              />
              {profileErrors.email && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nomor Telepon (Opsional)
              </label>
              <input
                type="tel"
                {...registerProfile('phone')}
                className="input-field"
                placeholder="Masukkan nomor telepon"
              />
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Role</label>
              <input
                type="text"
                value={user.role === 'admin' ? 'Administrator' : 'User'}
                disabled
                className="input-field opacity-50 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isProfileSubmitting}
              className="btn-primary w-full"
            >
              {isProfileSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
            </button>
          </form>
        </div>

        {/* Password & Security Card */}
        <div className="card-base">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Keamanan</h2>
          </div>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <h3 className="font-medium text-foreground">Ubah Password</h3>
              <p className="text-sm text-foreground/60">Perbarui password akun Anda untuk keamanan lebih baik</p>
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
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.currentPassword.message}
                  </p>
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
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerPassword('confirmPassword')}
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.confirmPassword.message}
                  </p>
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
      </div>
    </DashboardLayout>
  );
}
