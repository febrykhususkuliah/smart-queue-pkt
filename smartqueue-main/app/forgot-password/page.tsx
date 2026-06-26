'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result?.message || 'Terjadi kesalahan. Silakan coba lagi.');
        return;
      }

      toast.success(result?.message || 'Link reset password telah dikirim ke email Anda');
      setSubmitted(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (typeof window !== 'undefined') {
      if (newIsDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 transition-colors duration-300">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
        style={{
          backgroundColor: isDark ? '#334155' : '#E2E8F0',
        }}
      >
        <span
          className="absolute h-7 w-7 rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            transform: isDark ? 'translateX(26px)' : 'translateX(2px)',
          }}
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-blue-400" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-500" />
          )}
        </span>
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-muted p-3 shadow-sm">
            <Image src="/logo.svg" alt="Hasuno Workshop Smart Queue" width={96} height={96} className="object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Hasuno Workshop</h1>
          <p className="mt-2 text-foreground/60">Smart Queue untuk bengkel Anda</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg transition-all duration-300">
          {!submitted ? (
            <>
              <h2 className="text-2xl font-bold text-foreground">Lupa Password?</h2>
              <p className="mt-4 text-sm text-foreground/60">
                Masukkan email terdaftar Anda untuk menerima link reset password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="nama@example.com"
                    {...register('email')}
                    className="w-full rounded-lg border border-border bg-background text-foreground px-4 py-2.5 placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-6 w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Memproses...' : 'Kirim Link Reset'}
                </button>
              </form>

              {/* Back to Login */}
              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Login
              </Link>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="mb-4 text-5xl">✓</div>
                <h2 className="text-2xl font-bold text-foreground">Email Terkirim</h2>
                <p className="mt-4 text-sm text-foreground/60">
                  Kami telah mengirimkan link reset password ke email Anda. 
                  Silakan cek email dan ikuti instruksi untuk mereset password Anda.
                </p>
              </div>

              <Link
                href="/login"
                className="mt-6 block w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-center font-semibold hover:shadow-lg transition-all"
              >
                Kembali ke Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
