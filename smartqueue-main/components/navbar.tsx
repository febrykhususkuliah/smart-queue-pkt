'use client';

import { Bell, Settings, LogOut, User, CheckCircle2, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ThemeToggle } from './theme-toggle';
import Image from 'next/image';
import { getAuthToken } from '@/lib/auth'; // Pastikan utility token ini ada

interface NavbarProps {
  userName: string;
  userRole: string;
}

// Tipe Data Notifikasi
interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean | number;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export function Navbar({ userName, userRole }: NavbarProps) {
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  // State untuk menyimpan notifikasi
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  // Fungsi untuk menarik data notifikasi dari Backend
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifs(true);
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const result = await res.json();
        const data = result.data || [];
        setNotifications(data);
        
        // Hitung notifikasi yang is_read nya false atau 0
        const unread = data.filter((n: Notification) => n.is_read === 0 || n.is_read === false).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  // Panggil fetch pertama kali web dimuat
  useEffect(() => {
    fetchNotifications();
    
    // (Opsional) Polling setiap 30 detik untuk mengecek notifikasi baru secara live
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fungsi Tandai Semua Sudah Dibaca
  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: 1 }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Berhasil logout');
    router.push('/login');
  };

  // Fungsi utilitas format tanggal
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <nav className="fixed top-0 right-0 left-0 z-20 border-b border-border bg-card md:left-64 transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* BAGIAN KIRI: LOGO PKT & UCAPAN SELAMAT DATANG */}
        <div className="flex items-center gap-2 sm:gap-4 pl-12 md:pl-0">
          <div className="flex items-center">
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
          <ThemeToggle />

          {/* ==============================================
              AREA NOTIFIKASI DROPDOWN (BARU) 
              ============================================== */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowProfileDropdown(false);
                if (!showNotifDropdown && unreadCount > 0) {
                  // Otomatis mark as read saat dibuka (opsional)
                  markAllAsRead(); 
                }
              }}
              className="relative p-2 text-foreground/60 hover:bg-muted rounded-lg transition-colors focus:outline-none"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                  <h3 className="font-bold text-foreground">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {isLoadingNotifs ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      Memuat data paddock...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                      <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                      Belum ada notifikasi baru.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {notifications.map((notif) => (
                        <li key={notif.id} className={`p-4 hover:bg-muted/50 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              {!notif.is_read && <span className="h-2 w-2 bg-primary rounded-full inline-block"></span>}
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(notif.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                            {notif.message}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="p-3 border-t border-border bg-muted/10 text-center">
                   <button 
                     onClick={() => setShowNotifDropdown(false)}
                     className="text-xs font-medium text-primary hover:underline"
                   >
                     Tutup
                   </button>
                </div>
              </div>
            )}
          </div>
          {/* ============================================== */}

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
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifDropdown(false);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted transition-colors border border-border/50"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md uppercase">
                {userName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{userName}</p>
                <p className="text-[10px] text-primary uppercase font-black tracking-wider mt-0.5">{userRole}</p>
              </div>
            </button>

            {/* Menu Dropdown Profil */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profil Mekanik
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors sm:hidden"
                >
                  <Settings className="h-4 w-4" />
                  Pengaturan
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                >
                  <LogOut className="h-4 w-4" />
                  Cabut dari Paddock
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}