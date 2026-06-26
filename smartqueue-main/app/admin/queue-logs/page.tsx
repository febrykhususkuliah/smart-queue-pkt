'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { QueueLog, User } from '@/lib/types';
import { SearchInput } from '@/components/search-input';

export default function AdminQueueLogsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<QueueLog[]>([]);

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
        const res = await apiClient.get('/queue-logs');
        if (res && res.success) {
          const mapped = (res.data || []).map((l: any) => ({
            id: String(l.id),
            queue_id: String(l.queue_id),
            queue_number: l.queue_number || '',
            old_status: l.old_status,
            new_status: l.new_status,
            changed_by: l.changed_by || 0,
            changed_at: new Date(l.changed_at),
            changed_by_name: l.changed_by_name || '',
          }));
          setLogs(mapped);
          return;
        }
      } catch (e) {
        console.error('Fetch queue logs error:', e);
      }
      setLogs([]);
    })();
  }, [router]);

  const filteredLogs = logs.filter((log) =>
    (log.queue_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.changed_by_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!adminUser) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Queue Logs</h1>
        <p className="mt-2 text-muted-foreground">Riwayat perubahan status antrian</p>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Cari berdasarkan nomor antrian..."
        value={searchTerm}
        onChange={setSearchTerm}
        onClear={() => setSearchTerm('')}
      />

      {/* Logs Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  No. Antrian
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Status Lama
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Status Baru
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Diubah Oleh
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Waktu
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada log ditemukan
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {log.queue_number || log.queue_id}
                    </td>
                    <td className="px-4 py-3 text-foreground/60">
                      {log.old_status || '-'}
                    </td>
                    <td className="px-4 py-3 text-foreground/60">
                      {log.new_status || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.changed_by_name || 'Admin'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(log.changed_at).toLocaleString('id-ID')}
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
