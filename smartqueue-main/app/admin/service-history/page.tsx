'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ServiceHistory, User } from '@/lib/types';
import { SearchInput } from '@/components/search-input';

// Fungsi helper untuk mengekstrak Tipe Layanan (Bore Up, dll) dari teks keluhan
const extractServiceType = (complaintText: string) => {
  if (!complaintText) return { type: 'Servis Umum', cleanComplaint: '-' };
  const match = complaintText.match(/^\[(.*?)\]/);
  const type = match ? match[1] : 'Servis Umum';
  const cleanComplaint = complaintText.replace(/^\[.*?\]\s*/, '');
  return { type, cleanComplaint };
};

export default function AdminServiceHistoryPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<ServiceHistory[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setAdminUser(parsedUser);
    (async () => {
      try {
        const res = await apiClient.get('/service-history');
        if (res && res.success) {
          const mapped = (res.data || []).map((h: any) => ({
            id: String(h.id),
            queue_id: String(h.queue_id),
            service_notes: h.service_notes || '',
            completed_at: h.completed_at ? new Date(h.completed_at) : null,
            queue_number: h.queue_number || '',
            user_name: h.user_name || '',
            merk: h.merk || '',
            tipe: h.tipe || '',
            complaint: h.complaint || '',
            plat_nomor: h.plat_nomor || '', // Menambahkan plat nomor jika tersedia dari API
          }));
          setHistory(mapped);
          return;
        }
      } catch (e) {
        console.error('Fetch admin service history error:', e);
      }
      setHistory([]);
    })();
  }, [router]);

  const filteredHistory = history.filter(
    (h) =>
      (h.queue_number && h.queue_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.complaint && h.complaint.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.user_name && h.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.plat_nomor && h.plat_nomor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!adminUser) {
    return <p className="text-muted-foreground animate-pulse">Memuat Buku Rekam Mekanik...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Buku Rekam Pengerjaan</h1>
          <p className="mt-2 text-muted-foreground">Arsip histori modifikasi dan servis yang telah diselesaikan</p>
        </div>
        <div className="flex bg-success/10 border border-success/20 rounded-xl px-4 py-2">
           <span className="text-sm font-semibold text-success">Total Diselesaikan: {filteredHistory.length} Unit</span>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Cari berdasarkan nomor antrean, plat nomor, atau detail spek..."
        value={searchTerm}
        onChange={setSearchTerm}
        onClear={() => setSearchTerm('')}
      />

      {/* History Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-4 font-semibold text-foreground">No. Ref & Tanggal</th>
                <th className="px-4 py-4 font-semibold text-foreground">Pelanggan</th>
                <th className="px-4 py-4 font-semibold text-foreground">Unit Mesin</th>
                <th className="px-4 py-4 font-semibold text-foreground w-1/3">Histori Spek & Keluhan</th>
                <th className="px-4 py-4 font-semibold text-foreground">Catatan Mekanik</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-muted-foreground font-medium">Arsip pengerjaan masih kosong atau tidak ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const { type, cleanComplaint } = extractServiceType(item.complaint);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <span className="font-bold text-foreground block text-base">{item.queue_number}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          {item.completed_at ? item.completed_at.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-foreground">
                        {item.user_name || 'Unknown'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{item.merk ? `${item.merk} ${item.tipe}` : 'Motor Unknown'}</div>
                        {item.plat_nomor && (
                           <div className="text-xs font-mono text-muted-foreground mb-1">{item.plat_nomor}</div>
                        )}
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                          {type}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg border border-border max-h-20 overflow-y-auto whitespace-pre-wrap">
                          {cleanComplaint}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {item.service_notes ? (
                          <div className="text-sm text-success-foreground bg-success/10 p-2 rounded-lg border border-success/20 font-medium">
                            {item.service_notes}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic bg-muted px-2 py-1 rounded">Tidak ada catatan</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}