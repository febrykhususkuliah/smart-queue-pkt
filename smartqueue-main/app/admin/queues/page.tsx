'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ServiceQueue, User } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { SearchInput } from '@/components/search-input';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { MessageCircle, AlertTriangle, Trash2 } from 'lucide-react';

const extractServiceType = (complaintText: string) => {
  const match = complaintText.match(/^\[(.*?)\]/);
  const type = match ? match[1] : 'Servis Umum';
  const cleanComplaint = complaintText.replace(/^\[.*?\]\s*/, '');
  return { type, cleanComplaint };
};

const formatWhatsApp = (phone: string) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return `https://wa.me/${cleaned}`;
};

export default function AdminQueuesPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [queues, setQueues] = useState<(ServiceQueue & { user_phone?: string, estimated_time?: string })[]>([]);
  
  const [serviceNotes, setServiceNotes] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(0);

  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    id: string | null;
    action: 'process' | 'complete' | 'cancel' | 'kendala' | null;
  }>({ open: false, id: null, action: null });

  const fetchQueues = async () => {
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
          estimated_time: q.estimated_time || '',
          status: q.status as any,
          user_name: q.user_name || '',
          user_phone: q.user_phone || '',
          merk: q.merk || '',
          tipe: q.tipe || '',
          plat_nomor: q.plat_nomor || '',
        }));
        setQueues(mapped);
      }
    } catch (e) {
      console.error('Fetch admin queues error:', e);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) return router.push('/login');
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') return router.push('/dashboard');
    setAdminUser(parsedUser);
    fetchQueues();
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
      (filterStatus === 'kendala' && q.status === 'Kendala') ||
      (filterStatus === 'completed' && q.status === 'Selesai');
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = async (id: string, newStatus: string, notes?: string, delay?: number) => {
    try {
      const statusMap: Record<string, string> = {
        pending: 'Menunggu',
        process: 'Diproses', // Diubah agar sesuai dengan nilai action
        kendala: 'Kendala',
        complete: 'Selesai', // Diubah agar sesuai dengan nilai action
        cancel: 'Dibatalkan', // Diubah agar sesuai dengan nilai action
      };
      
      const backendStatus = statusMap[newStatus] || newStatus;

      const res = await apiClient.put(`/queues/${id}/status`, { 
        status: backendStatus, 
        service_notes: notes,
        delay_minutes: delay 
      });

      if (res && res.success) {
        toast.success('Status pengerjaan berhasil diupdate!');
        fetchQueues(); // Tarik data ulang untuk memperbarui efek domino waktu
      } else {
        toast.error(res?.message || 'Gagal mengubah status');
      }
    } catch (error) {
      toast.error('Gagal menghubungi server');
    } finally {
      setConfirmAction({ open: false, id: null, action: null });
      setServiceNotes('');
      setDelayMinutes(0);
    }
  }

  if (!adminUser) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Paddock</h1>
          <p className="mt-2 text-muted-foreground">Atur jadwal pengerjaan dan modifikasi mesin (Admin View)</p>
        </div>
        <div className="flex bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
           <span className="text-sm font-semibold text-primary">Total Booking: {filteredQueues.length} Motor</span>
        </div>
      </div>

      <div className="space-y-4">
        <SearchInput placeholder="Cari no antrean, plat nomor, nama..." value={searchTerm} onChange={setSearchTerm} onClear={() => setSearchTerm('')} />

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'pending', 'processing', 'kendala', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                filterStatus === status ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
              }`}
            >
              {status === 'all' ? 'Semua Jadwal' : status === 'pending' ? 'Menunggu' : status === 'processing' ? 'Diproses' : status === 'kendala' ? 'Kendala' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-4 font-semibold text-foreground">No. Urut & Jam</th>
                <th className="px-4 py-4 font-semibold text-foreground">Pelanggan & Kontak</th>
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
                    <tr key={queue.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-bold text-foreground block text-base">{queue.queue_number}</span>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded mt-1 inline-block">Jam Est: {queue.estimated_time || '-'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-foreground block">{queue.user_name || 'Unknown'}</span>
                        {queue.user_phone ? (
                          <a href={formatWhatsApp(queue.user_phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-md hover:bg-green-500/20 transition-colors dark:text-green-400">
                            <MessageCircle className="h-3.5 w-3.5" /> WA
                          </a>
                        ) : (<span className="inline-block mt-1 text-xs text-muted-foreground italic">- No HP -</span>)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{queue.merk ? `${queue.merk} ${queue.tipe}` : 'Unknown'}</div>
                        <div className="text-xs font-mono text-muted-foreground mb-1">{queue.plat_nomor}</div>
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">{type}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg border border-border max-h-20 overflow-y-auto whitespace-pre-wrap">{cleanComplaint}</div>
                      </td>
                      <td className="px-4 py-4">
                        {queue.status === 'Kendala' ? (
                          <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
                            <AlertTriangle className="w-3.5 h-3.5" /> TERTUNDA
                          </span>
                        ) : (
                          <StatusBadge status={queue.status} size="sm" />
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center items-center gap-1.5 flex-wrap">
                          {/* TOMBOL KERJAKAN & BATALKAN (STATUS: MENUNGGU) */}
                          {queue.status === 'Menunggu' && (
                            <>
                              <button onClick={() => setConfirmAction({ open: true, id: queue.id, action: 'process' })} className="text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors">Kerjakan</button>
                              
                              <button 
                                onClick={() => setConfirmAction({ open: true, id: queue.id, action: 'cancel' })} 
                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                                title="Batalkan Antrean"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {(queue.status === 'Diproses' || queue.status === 'Kendala') && (
                            <>
                              {queue.status === 'Diproses' && (
                                <button onClick={() => setConfirmAction({ open: true, id: queue.id, action: 'kendala' })} className="text-xs font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-colors">⚠️ Kendala</button>
                              )}
                              {queue.status === 'Kendala' && (
                                <button onClick={() => setConfirmAction({ open: true, id: queue.id, action: 'process' })} className="text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors">Lanjut Proses</button>
                              )}
                              <button onClick={() => setConfirmAction({ open: true, id: queue.id, action: 'complete' })} className="text-xs font-bold bg-green-500/10 text-green-600 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors">Selesai</button>
                            </>
                          )}

                          {(queue.status === 'Selesai' || queue.status === 'Dibatalkan') && (<span className="text-xs text-muted-foreground italic">-</span>)}
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

      {/* MODAL MULTI-FUNGSI (SELESAI & KENDALA) */}
      {confirmAction.open && (confirmAction.action === 'complete' || confirmAction.action === 'kendala') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {confirmAction.action === 'kendala' ? (
              <>
                <h3 className="text-xl font-bold text-orange-500 mb-2 flex items-center gap-2"><AlertTriangle className="h-6 w-6"/> Laporkan Kendala</h3>
                <p className="text-sm text-muted-foreground mb-4">Tambahkan ekstra waktu. Waktu antrean pelanggan lain di belakang motor ini akan ikut mundur (Domino Effect).</p>
                <select value={delayMinutes} onChange={(e) => setDelayMinutes(Number(e.target.value))} className="w-full mb-4 rounded-xl border border-border bg-background px-4 py-3 font-bold text-foreground">
                  <option value={0}>Tidak merubah waktu tunggu</option>
                  <option value={15}>Mundur +15 Menit</option>
                  <option value={30}>Mundur +30 Menit</option>
                  <option value={60}>Mundur +1 Jam</option>
                  <option value={120}>Mundur +2 Jam</option>
                </select>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-foreground mb-2">Motor Selesai Dikerjakan! 🏁</h3>
                <p className="text-sm text-muted-foreground mb-4">Silakan tinggalkan catatan mekanik sebelum mengirim notifikasi.</p>
              </>
            )}

            <textarea value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} placeholder={confirmAction.action === 'kendala' ? "Catatan kendala (Contoh: Baut patah, menunggu beli alat)..." : "Catatan mekanik (opsional)..."} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] mb-6" />
            
            <div className="flex justify-end gap-3">
              <button onClick={() => { setConfirmAction({ open: false, id: null, action: null }); setServiceNotes(''); setDelayMinutes(0); }} className="px-4 py-2.5 rounded-lg font-semibold text-muted-foreground hover:bg-muted transition-all">Batal</button>
              <button onClick={() => { if (confirmAction.id) { handleStatusChange(confirmAction.id, confirmAction.action as string, serviceNotes, delayMinutes); } }} className={`px-4 py-2.5 rounded-lg font-bold text-white transition-colors shadow-lg ${confirmAction.action === 'kendala' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}>
                {confirmAction.action === 'kendala' ? 'Terapkan Penundaan' : 'Konfirmasi Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi: Kerjakan */}
      <ConfirmDialog
        title="Mulai Pengerjaan"
        description="Apakah mekanik sudah siap untuk mulai mengerjakan motor ini?"
        isOpen={confirmAction.open && confirmAction.action === 'process'}
        onConfirm={() => { if (confirmAction.id) handleStatusChange(confirmAction.id, 'process'); }}
        onCancel={() => setConfirmAction({ open: false, id: null, action: null })}
      />

      {/* Dialog Konfirmasi: Batalkan */}
      <ConfirmDialog
        title="Batalkan Antrean"
        description="Peringatan: Antrean ini akan dibatalkan secara permanen. Apakah Anda yakin?"
        isOpen={confirmAction.open && confirmAction.action === 'cancel'}
        onConfirm={() => { if (confirmAction.id) handleStatusChange(confirmAction.id, 'cancel'); }}
        onCancel={() => setConfirmAction({ open: false, id: null, action: null })}
      />
    </div>
  );
}