'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ServiceQueue, User } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { SearchInput } from '@/components/search-input';
import { ConfirmDialog } from '@/components/confirm-dialog';

export default function AdminQueuesPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [queues, setQueues] = useState<ServiceQueue[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    id: string | null;
    action: 'process' | 'complete' | 'cancel' | null;
  }>({
    open: false,
    id: null,
    action: null,
  });

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
        const res = await apiClient.get('/queues');
        if (res && res.success) {
          const mapped = (res.data || []).map((q: any) => ({
            id: String(q.id),
            queue_number: q.queue_number,
            user_id: String(q.user_id),
            vehicle_id: String(q.vehicle_id),
            complaint: q.complaint || '',
            service_date: new Date(q.service_date),
            status: q.status as any,
            created_at: new Date(q.created_at),
            user_name: q.user_name || '',
            merk: q.merk || '',
            tipe: q.tipe || '',
            tahun: q.tahun,
            plat_nomor: q.plat_nomor || '',
          }));
          setQueues(mapped);
          return;
        }
      } catch (e) {
        console.error('Fetch admin queues error:', e);
      }
      setQueues([]);
    })();
  }, [router]);

  const filteredQueues = queues.filter((q) => {
    const matchesSearch =
      q.queue_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.complaint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && q.status === 'Menunggu') ||
      (filterStatus === 'processing' && q.status === 'Diproses') ||
      (filterStatus === 'completed' && q.status === 'Selesai') ||
      (filterStatus === 'cancelled' && q.status === 'Dibatalkan');
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Map frontend UI status to backend database status
      const statusMap: Record<string, string> = {
        pending: 'Menunggu',
        processing: 'Diproses',
        completed: 'Selesai',
        cancelled: 'Dibatalkan',
      };
      const backendStatus = statusMap[newStatus] || newStatus;

      // Call backend API
      const res = await apiClient.put(`/queues/${id}/status`, { status: backendStatus });
      if (res && res.success) {
        // Update local state with database status
        const updatedQueues = queues.map((q) =>
          q.id === id ? { ...q, status: backendStatus } : q
        );
        setQueues(updatedQueues as any);
        toast.success('Status antrian berhasil diubah');
      } else {
        toast.error(res?.message || 'Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error updating queue status:', error);
      toast.error('Gagal mengubah status antrian');
    } finally {
      setConfirmAction({ open: false, id: null, action: null });
    }
  }


  if (!adminUser) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Antrian</h1>
        <p className="mt-2 text-muted-foreground">Kelola antrian service kendaraan</p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <SearchInput
          placeholder="Cari antrian atau keluhan..."
          value={searchTerm}
          onChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
        />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'processing', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Queues Table */}
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
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada antrian ditemukan
                  </td>
                </tr>
              ) : (
                filteredQueues.map((queue) => (
                  <tr
                    key={queue.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {queue.queue_number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{queue.user_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{queue.merk ? `${queue.merk} ${queue.tipe}` : 'Unknown'}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {queue.complaint}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(queue.service_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={queue.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {queue.status === 'Menunggu' && (
                          <button
                            onClick={() =>
                              setConfirmAction({
                                open: true,
                                id: queue.id,
                                action: 'process',
                              })
                            }
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            Proses
                          </button>
                        )}
                        {queue.status === 'Diproses' && (
                          <>
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  open: true,
                                  id: queue.id,
                                  action: 'complete',
                                })
                              }
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                            >
                              Selesai
                            </button>
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  open: true,
                                  id: queue.id,
                                  action: 'cancel',
                                })
                              }
                              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                            >
                              Batalkan
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        title="Ubah Status Antrian?"
        description={`Status antrian akan diubah menjadi ${
          confirmAction.action === 'process'
            ? 'Diproses'
            : confirmAction.action === 'complete'
            ? 'Selesai'
            : 'Dibatalkan'
        }`}
        isOpen={confirmAction.open}
        onConfirm={() => {
          if (confirmAction.id && confirmAction.action) {
            const statusMap = {
              process: 'processing',
              complete: 'completed',
              cancel: 'cancelled',
            };
            handleStatusChange(confirmAction.id, statusMap[confirmAction.action]);
          }
        }}
        onCancel={() => setConfirmAction({ open: false, id: null, action: null })}
      />
    </div>
  );
}
