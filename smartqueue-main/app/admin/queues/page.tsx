'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ServiceQueue, User } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { SearchInput } from '@/components/search-input';
import { ConfirmDialog } from '@/components/confirm-dialog';

// Fungsi helper untuk mengekstrak Tipe Layanan (Bore Up, dll) dari teks keluhan
const extractServiceType = (complaintText: string) => {
  const match = complaintText.match(/^\[(.*?)\]/);
  const type = match ? match[1] : 'Servis Umum';
  const cleanComplaint = complaintText.replace(/^\[.*?\]\s*/, '');
  return { type, cleanComplaint };
};

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
      q.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.plat_nomor || '').toLowerCase().includes(searchTerm.toLowerCase());
      
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
        toast.success('Status pengerjaan berhasil diupdate!');
      } else {
        toast.error(res?.message || 'Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error updating queue status:', error);
      toast.error('Gagal menghubungi server');
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Paddock</h1>
          <p className="mt-2 text-muted-foreground">Atur jadwal pengerjaan dan modifikasi mesin (Admin View)</p>
        </div>
        <div className="flex bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
           <span className="text-sm font-semibold text-primary">Total Booking: {filteredQueues.length} Motor</span>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <SearchInput
          placeholder="Cari no antrean, plat nomor, atau nama..."
          value={searchTerm}
          onChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
        />

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'pending', 'processing', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
              }`}
            >
              {status === 'all' ? 'Semua Jadwal' 
                : status === 'pending' ? 'Menunggu'
                : status === 'processing' ? 'Diproses'
                : status === 'completed' ? 'Selesai'
                : 'Dibatalkan'}
            </button>
          ))}
        </div>
      </div>

      {/* Queues Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-4 font-semibold text-foreground">No. Urut</th>
                <th className="px-4 py-4 font-semibold text-foreground">Pelanggan</th>
                <th className="px-4 py-4 font-semibold text-foreground">Unit & Layanan</th>
                <th className="px-4 py-4 font-semibold text-foreground w-1/3">Detail Spek/Keluhan</th>
                <th className="px-4 py-4 font-semibold text-foreground">Status</th>
                <th className="px-4 py-4 font-semibold text-foreground text-center">Aksi Mekanik</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-muted-foreground font-medium">Tidak ada data pengerjaan yang ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredQueues.map((queue) => {
                  const { type, cleanComplaint } = extractServiceType(queue.complaint);
                  
                  return (
                    <tr
                      key={queue.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <span className="font-bold text-foreground block text-base">{queue.queue_number}</span>
                        <span className="text-xs text-muted-foreground">{new Date(queue.service_date).toLocaleDateString('id-ID')}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-foreground">{queue.user_name || 'Unknown'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{queue.merk ? `${queue.merk} ${queue.tipe}` : 'Unknown'}</div>
                        <div className="text-xs font-mono text-muted-foreground mb-1">{queue.plat_nomor}</div>
                        
                        {/* BADGE TIPE LAYANAN (Bore Up, dll) */}
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
                        <StatusBadge status={queue.status} size="sm" />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          {queue.status === 'Menunggu' && (
                            <button
                              onClick={() => setConfirmAction({ open: true, id: queue.id, action: 'process' })}
                              className="text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
                            >
                              Kerjakan
                            </button>
                          )}
                          {queue.status === 'Diproses' && (
                            <>
                              <button
                                onClick={() => setConfirmAction({ open: true, id: queue.id, action: 'complete' })}
                                className="text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors"
                              >
                                Selesai
                              </button>
                              <button
                                onClick={() => setConfirmAction({ open: true, id: queue.id, action: 'cancel' })}
                                className="text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                              >
                                Batal
                              </button>
                            </>
                          )}
                          {(queue.status === 'Selesai' || queue.status === 'Dibatalkan') && (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        title="Update Status Pengerjaan"
        description={`Apakah Anda yakin ingin mengubah status mesin ini menjadi ${
          confirmAction.action === 'process'
            ? '"Sedang Dikerjakan"'
            : confirmAction.action === 'complete'
            ? '"Selesai"'
            : '"Dibatalkan"'
        }?`}
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