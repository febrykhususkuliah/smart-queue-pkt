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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// Skema Validasi Form Daftar (Sudah lengkap dengan Phone)
const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(9, 'Nomor telepon minimal 9 angka'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

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

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: data.name, 
          email: data.email, 
          phone: data.phone, 
          password: data.password,
          confirmPassword: data.confirmPassword
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result?.message || 'Gagal mendaftar. Silakan coba lagi.');
        return;
      }

      toast.success('Pendaftaran berhasil! Pasukan baru siap bertugas.');
      setTimeout(() => { router.push('/login'); }, 1000);
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
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
        <span className={`h-6 w-6 rounded-full bg-card shadow-sm transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-6' : 'translate-x-0'}`}>
          {isDark ? <Moon className="h-3 w-3 text-primary" /> : <Sun className="h-3 w-3 text-yellow-500" />}
        </span>
      </button>

      {/* Kontainer Utama */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Logo PKT */}
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

        {/* Kartu Form Register */}
        <div className="relative rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.7)] transition-all duration-300">
          <h2 className="text-2xl font-bold text-foreground">Gabung Pasukan PKT</h2>
          <p className="mt-2 text-sm text-muted-foreground">Lengkapi data di bawah untuk membuat akun baru</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Nama Lengkap</label>
              <input type="text" placeholder="Misal: Budi Santoso" {...register('name')} className="w-full rounded-lg border border-border bg-background/70 text-foreground px-4 py-3 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium" />
              {errors.name && <p className="mt-1.5 text-sm font-medium text-destructive">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Email Pengguna</label>
              <input type="email" placeholder="nama@email.com" {...register('email')} className="w-full rounded-lg border border-border bg-background/70 text-foreground px-4 py-3 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium" />
              {errors.email && <p className="mt-1.5 text-sm font-medium text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Nomor Telepon / WA</label>
              <input type="tel" placeholder="08123456789" {...register('phone')} className="w-full rounded-lg border border-border bg-background/70 text-foreground px-4 py-3 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium" />
              {errors.phone && <p className="mt-1.5 text-sm font-medium text-destructive">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Kata Sandi</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...register('password')} className="w-full rounded-lg border border-border bg-background/70 text-foreground px-4 py-3 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 pr-12 font-medium" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-sm font-medium text-destructive">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Konfirmasi Kata Sandi</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...register('confirmPassword')} className="w-full rounded-lg border border-border bg-background/70 text-foreground px-4 py-3 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 pr-12 font-medium" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-sm font-medium text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="mt-8 w-full rounded-lg bg-primary text-primary-foreground py-3.5 font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 uppercase tracking-wider">
              {isLoading ? 'MEMPROSES...' : 'DAFTAR SEKARANG'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            Sudah tergabung dalam pasukan?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">Masuk Sistem</Link>
          </p>
        </div>
      </div>
    </div>
  );
}