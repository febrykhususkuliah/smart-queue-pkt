'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveUserSession, getStoredSession } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      router.push(stored.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
    
    // Check initial theme
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, [router]);

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

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      // ⚠️ DIKUNCI KE PORT 4000 AGAR TIDAK ERROR HTML/JSON
      const response = await fetch('http://127.0.0.1:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result?.message || 'Login gagal. Silakan coba lagi.');
        return;
      }

      const { user, token } = result.data;
      saveUserSession(user, Boolean(data.rememberMe), token);

      toast.success('Login berhasil! Gaspol!');
      setTimeout(() => {
        router.push(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 py-12 transition-colors duration-300 relative overflow-hidden"
      style={{
        backgroundImage: "url('/wallpaper-login.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Tombol Tema (Dark/Light Mode) */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 inline-flex h-8 w-14 items-center rounded-full bg-muted border border-border p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 z-20 shadow-md"
      >
        <span
          className={`h-6 w-6 rounded-full bg-card shadow-sm transition-transform duration-300 flex items-center justify-center ${
            isDark ? 'translate-x-6' : 'translate-x-0'
          }`}
        >
          {isDark ? (
            <Moon className="h-3 w-3 text-primary" />
          ) : (
            <Sun className="h-3 w-3 text-yellow-500" />
          )}
        </span>
      </button>

      {/* Kontainer Utama Form Login */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Bagian Header Logo */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <div className="relative w-80 h-32 sm:w-96 sm:h-36 mb-2 transition-transform hover:scale-105 duration-300">
            <Image 
              src="/logo-pkt.png" 
              alt="Bengkel PKT Logo" 
              fill
              className="object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]" 
              priority
            />
          </div>
        </div>

        {/* Kartu Form Login */}
        <div className="relative rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.7)] transition-all duration-300">
          <h2 className="text-2xl font-bold text-foreground">Login PKT</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Masukkan kredensial Anda untuk masuk ke sistem
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {/* Input Email */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Email Pengguna</label>
              <input
                type="email"
                placeholder="nama@email.com"
                {...register('email')}
                className="w-full rounded-lg border border-border bg-background/70 text-foreground px-4 py-3 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium shadow-inner"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm font-medium text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full rounded-lg border border-border bg-background/70 text-foreground px-4 py-3 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all pr-12 font-medium shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm font-medium text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Fitur Ingat Saya */}
            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary transition-colors"
                />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Ingat kredensial saya</span>
              </label>
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 w-full rounded-lg bg-primary text-primary-foreground py-3.5 font-bold text-lg hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
                  MEMPROSES...
                </span>
              ) : (
                'MASUK SISTEM'
              )}
            </button>
          </form>

          {/* Tautan Daftar */}
          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            Belum tergabung?{' '}
            <Link
              href="/register"
              className="font-bold text-primary hover:text-primary/80 hover:underline transition-all"
            >
              Daftar Pasukan Baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}