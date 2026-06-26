'use client';

import { Bell, Settings, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ThemeToggle } from './theme-toggle';
import Image from 'next/image'; // Tambahan wajib untuk memanggil gambar di Next.js

interface NavbarProps {
  userName: string;
  userRole: string;
}

export function Navbar({ userName, userRole }: NavbarProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Berhasil logout');
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 right-0 left-0 z-20 border-b border-border bg-card md:left-64 transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-4">
        
{/* BAGIAN KIRI: LOGO PKT & UCAPAN SELAMAT DATANG */}
        <div className="flex items-center gap-2 sm:gap-4 pl-12 md:pl-0">
          <div className="flex items-center">
            {/* Memanggil logo-pkt.png dengan ukuran terkunci */}
            <Image 
              src="/logo-pkt.png" 
              alt="Logo Bengkel PKT" 
              width={140}
              height={50}
              className="object-contain"
              priority
            />
          </div>
          <div className="text-foreground/60 hidden sm:block">
            <p className="text-sm font-medium border-l-2 border-primary pl-3">
              Selamat datang kembali, Pasukan PKT!
            </p>
          </div>
        </div>

        {/* BAGIAN KANAN: MENU & PROFIL */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative p-2 text-foreground/60 hover:bg-muted rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 bg-destructive rounded-full"></span>
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className="p-2 text-foreground/60 hover:bg-muted rounded-lg transition-colors hidden sm:block"
          >
            <Settings className="h-5 w-5" />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted transition-colors border border-border/50"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-primary capitalize font-bold">{userRole}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profil Saya
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors sm:hidden"
                >
                  <Settings className="h-4 w-4" />
                  Pengaturan
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}