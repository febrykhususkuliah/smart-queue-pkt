'use client';

import { Sidebar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';
import { getStoredSession } from '@/lib/auth';
import { SessionUser } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.push('/login');
      return;
    }
    setSessionUser(stored.user);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memeriksa sesi...</p>
      </div>
    );
  }

  return (
    <div className="flex bg-background">
      <Sidebar role={sessionUser?.role ?? 'user'} userName={sessionUser?.name ?? ''} />
      <main className="flex-1 md:ml-64">
        <Navbar
          userName={sessionUser?.name ?? ''}
          userRole={sessionUser?.role === 'admin' ? 'Admin' : 'User'}
        />
        <div className="mt-24 px-4 md:px-8 pb-8">{children}</div>
      </main>
    </div>
  );
}
