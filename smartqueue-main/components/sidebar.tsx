'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Car,
  Plus,
  History,
  User,
  Users,
  ListTodo,
  Logs,
  Menu,
  X,
  Settings,
  LogOut
} from 'lucide-react';
import { NAVIGATION_ITEMS_ADMIN, NAVIGATION_ITEMS_USER } from '@/lib/constants';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  Car: <Car className="h-5 w-5" />,
  Plus: <Plus className="h-5 w-5" />,
  History: <History className="h-5 w-5" />,
  User: <User className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  ListTodo: <ListTodo className="h-5 w-5" />,
  Logs: <Logs className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
};

interface SidebarProps {
  role: 'admin' | 'user';
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const items = role === 'admin' ? NAVIGATION_ITEMS_ADMIN : NAVIGATION_ITEMS_USER;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 rounded-lg bg-primary p-2 text-primary-foreground md:hidden shadow-md"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          
          {/* Bagian Judul Tanpa Logo */}
          <div className="border-b border-sidebar-border p-6 flex items-center justify-center">
            <div className="text-center py-2">
              <h1 className="text-2xl font-black tracking-widest text-primary">BENGKEL PKT</h1>
              <p className="mt-1 text-xs font-bold text-sidebar-foreground/60 uppercase tracking-[0.2em]">Sistem Antrean</p>
            </div>
          </div>

          {/* User Info (Plat Identitas) */}
          <div className="border-b border-sidebar-border px-6 py-5 bg-muted/20">
            <p className="text-sm font-medium text-sidebar-foreground/70">Panel Akses,</p>
            <p className="mt-1 truncate text-sm font-bold text-sidebar-foreground">{userName}</p>
            <span className="mt-3 inline-block rounded-md bg-primary text-primary-foreground px-3 py-1 text-xs font-extrabold uppercase tracking-wider shadow-sm">
              {role === 'admin' ? 'Admin Bengkel' : 'Pelanggan'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md translate-x-1'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1'
                  }`}
                >
                  {ICON_MAP[item.icon as keyof typeof ICON_MAP]}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="border-t border-sidebar-border p-4">
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar Sistem</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop (Efek Blur di HP) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}