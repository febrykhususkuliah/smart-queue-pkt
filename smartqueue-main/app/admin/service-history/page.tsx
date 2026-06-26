'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ServiceHistory, User } from '@/lib/types';
import { SearchInput } from '@/components/search-input';

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
      h.queue_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.complaint && h.complaint.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!adminUser) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Riwayat Service</h1>
        <p className="mt-2 text-muted-foreground">Kelola riwayat service kendaraan</p>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Cari berdasarkan nomor antrian atau keluhan..."
        value={searchTerm}
        onChange={setSearchTerm}
        onClear={() => setSearchTerm('')}
      />

      {/* History Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  No. Antrian
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Pemilik
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Kendaraan
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Keluhan
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Tanggal Service
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Catatan Service
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada riwayat ditemukan
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.queue_number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.user_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.merk ? `${item.merk} ${item.tipe}` : 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {item.complaint}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.completed_at ? new Date(item.completed_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      {item.service_notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
