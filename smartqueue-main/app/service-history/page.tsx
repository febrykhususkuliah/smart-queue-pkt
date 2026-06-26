'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ServiceHistory, User } from '@/lib/types';
import { getAuthToken, getStoredSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// Fungsi helper untuk mengekstrak Tipe Layanan (Bore Up, dll) dari teks keluhan
const extractServiceType = (complaintText: string) => {
  if (!complaintText) return { type: 'Servis Umum', cleanComplaint: '-' };
  const match = complaintText.match(/^\[(.*?)\]/);
  const type = match ? match[1] : 'Servis Umum';
  const cleanComplaint = complaintText.replace(/^\[.*?\]\s*/, '');
  return { type, cleanComplaint };
};

export default function ServiceHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<ServiceHistory[]>([]);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.push('/login');
      return;
    }

    // Normalize stored session user to match `User` type
    const u: any = stored.user;
    const normalizedUser = {
      ...u,
      id: String(u.id),
      created_at: u.created_at ? new Date(u.created_at) : u.createdAt ? new Date(u.createdAt) : new Date(),
      updated_at: u.updated_at ? new Date(u.updated_at) : u.updatedAt ? new Date(u.updatedAt) : undefined,
    } as any;
    setUser(normalizedUser);

    const fetchHistory = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/service-history`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Gagal memuat riwayat service');
        }

        const result = await response.json();
        setHistory(
          (result.data || []).map((item: any) => ({
            id: String(item.id),
            queue_id: String(item.queue_id),
            service_notes: item.service_notes || '',
            completed_at: item.completed_at ? new Date(item.completed_at) : null,
            queue_number: item.queue_number || '',
            user_name: item.user_name || '',
            merk: item.merk || '',
            tipe: item.tipe || '',
            complaint: item.complaint || '',
            plat_nomor: item.plat_nomor || '',
          }))
        );
      } catch (error) {
        console.error('Fetch service history error:', error);
        toast.error('Gagal memuat riwayat service. Silakan login ulang.');
        router.push('/login');
      }
    };

    fetchHistory();
  }, [router]);

  if (!user) {
    return <p className="text-muted-foreground animate-pulse">Memuat arsip mesin...</p>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Riwayat Modifikasi & Servis</h1>
            <p className="mt-2 text-foreground/60">Arsip pengerjaan mesin yang telah diselesaikan oleh mekanik</p>
          </div>
          <div className="flex bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
             <span className="text-sm font-semibold text-primary">Total Pengerjaan: {history.length}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
          {history.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <p className="text-foreground font-medium text-lg">Belum ada riwayat pengerjaan</p>
              <p className="text-muted-foreground text-sm mt-1">Motor Anda belum pernah masuk ke garasi kami.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-6 py-4 text-sm font-semibold text-foreground">
                      No. Ref & Tanggal
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-foreground">
                      Unit Motor
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-foreground w-1/3">
                      Detail Request Spek
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-foreground">
                      Catatan Mekanik
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    // Ekstrak detail keluhan rahasia
                    const { type, cleanComplaint } = extractServiceType(item.complaint);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-foreground block text-base">{item.queue_number}</span>
                          <span className="text-xs text-muted-foreground mt-0.5 block">
                            {item.completed_at ? new Date(item.completed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{item.merk ? `${item.merk} ${item.tipe}` : 'Unknown'}</div>
                          {item.plat_nomor && (
                             <div className="text-xs font-mono text-muted-foreground mb-1.5">{item.plat_nomor}</div>
                          )}
                          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary text-primary-foreground">
                            {type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground bg-muted/50 p-2.5 rounded-xl border border-border max-h-20 overflow-y-auto whitespace-pre-wrap">
                            {cleanComplaint}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.service_notes ? (
                            <div className="text-sm text-success-foreground bg-success/10 p-2.5 rounded-xl border border-success/20 font-medium">
                              {item.service_notes}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic bg-muted px-2 py-1 rounded">Mekanik tidak meninggalkan catatan</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}