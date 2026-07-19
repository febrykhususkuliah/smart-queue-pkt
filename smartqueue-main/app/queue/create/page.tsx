'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Vehicle, ServiceQueue } from '@/lib/types';
import { Wrench, Calendar, Clock, ArrowRight, CheckCircle2, Car, Info, AlertTriangle } from 'lucide-react';

export default function CreateQueuePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [liveQueues, setLiveQueues] = useState<(ServiceQueue & { duration_minutes?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [durationText, setDurationText] = useState('');

  const [formData, setFormData] = useState({
    vehicleId: '', serviceType: '', complaintDetail: '', serviceDate: '', estimatedTime: '',
    merk: '', tipe: '', tahun: '', plat_nomor: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleRes = await apiClient.get('/vehicles');
        if (vehicleRes?.success) {
          const fetchedVehicles = vehicleRes.data || [];
          setVehicles(fetchedVehicles);
          if (fetchedVehicles.length === 0) { setIsNewVehicle(true); setFormData(prev => ({ ...prev, vehicleId: 'new' })); }
        }
        const paddockRes = await apiClient.get('/queues/global');
        if (paddockRes?.success) setLiveQueues(paddockRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchData();
    
    // Auto-refresh Live Paddock setiap 10 detik agar terlihat Real-Time
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    switch (formData.serviceType) {
      case 'Service Ringan': setDurationText('⏱️ Est. Pengerjaan: ~1 Jam'); break;
      case 'Servis Umum': setDurationText('⏱️ Est. Pengerjaan: ~2 Jam'); break;
      case 'Remap ECU': setDurationText('⏱️ Est. Pengerjaan: 1 - 2 Jam'); break;
      case 'Porting Polish': setDurationText('⏱️ Est. Pengerjaan: 4 Jam'); break;
      case 'Bore Up Harian': setDurationText('⏱️ Est. Pengerjaan: 1 Hari'); break;
      case 'Bore Up Kompetisi': setDurationText('⏱️ Est. Pengerjaan: 3 Hari'); break;
      case 'Restorasi Mesin': setDurationText('⏱️ Est. Pengerjaan: 6 Hari'); break;
      default: setDurationText('');
    }
  }, [formData.serviceType]);

  const handleVehicleSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, vehicleId: val });
    setIsNewVehicle(val === 'new');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceType || !formData.complaintDetail || !formData.serviceDate || !formData.estimatedTime) {
      toast.error('Harap lengkapi jenis pengerjaan, keluhan, tanggal, dan jam kedatangan.');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        vehicle_id: isNewVehicle ? null : formData.vehicleId,
        is_new_vehicle: isNewVehicle,
        merk: formData.merk, tipe: formData.tipe, tahun: formData.tahun, plat_nomor: formData.plat_nomor,
        complaint: `[${formData.serviceType}] ${formData.complaintDetail}`,
        service_date: formData.serviceDate,
        estimated_time: formData.estimatedTime,
      };
      const res = await apiClient.post('/queues', payload);
      if (res?.success) {
        toast.success('Jadwal berhasil dibooking! Waktu telah dikalkulasi otomatis.');
        router.push('/dashboard');
      } else { toast.error(res?.message || 'Gagal membuat antrean.'); }
    } catch (error) {
      toast.error('Terjadi kesalahan pada server.');
    } finally { setIsLoading(false); }
  };

  const calculateCompletionTime = (startStr: string, durationMins: number) => {
    if (!startStr) return '-';
    const [h, m] = startStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + (durationMins || 0), 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (isFetchingData) return <div className="flex h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Booking Jadwal Workshop</h1>
        <p className="mt-2 text-foreground/60">Sistem otomatis menghitung estimasi waktu tunggu Anda berbasis algoritma Queueing Theory.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Form Booking (Kiri) */}
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Wrench className="w-64 h-64 transform rotate-45" /></div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="bg-muted/30 p-5 rounded-2xl border border-border/60">
                <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Car className="h-4 w-4 text-primary" /> Identitas Kendaraan <span className="text-destructive">*</span></label>
                {vehicles.length > 0 && (
                  <select value={formData.vehicleId} onChange={handleVehicleSelection} className="w-full rounded-xl border border-border bg-background px-4 py-3.5 focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium cursor-pointer mb-4">
                    <option value="" disabled>Pilih motor dari garasi Anda...</option>
                    {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.merk} {v.tipe} ({v.plat_nomor})</option>))}
                    <option value="new" className="font-bold text-primary">➕ Daftarkan Motor Baru...</option>
                  </select>
                )}
                {isNewVehicle && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Merek</label><input type="text" value={formData.merk} onChange={(e) => setFormData({ ...formData, merk: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" placeholder="Honda" /></div>
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Tipe</label><input type="text" value={formData.tipe} onChange={(e) => setFormData({ ...formData, tipe: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" placeholder="Vario 150" /></div>
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Tahun</label><input type="number" value={formData.tahun} onChange={(e) => setFormData({ ...formData, tahun: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" placeholder="YYYY" /></div>
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Plat Nomor</label><input type="text" value={formData.plat_nomor} onChange={(e) => setFormData({ ...formData, plat_nomor: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 uppercase" placeholder="H 1234 XX" /></div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Jenis Pengerjaan Utama <span className="text-destructive">*</span></label>
                <select value={formData.serviceType} onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-3.5 focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium">
                  <option value="">Pilih jenis modifikasi/servis...</option>
                  <option value="Service Ringan">Service Ringan (Ganti Oli, CVT, dll)</option>
                  <option value="Servis Umum">Servis Umum / Pengecekan Total</option>
                  <option value="Bore Up Harian">Bore Up Harian (Aman Harian)</option>
                  <option value="Bore Up Kompetisi">Bore Up Kompetisi (Drag/Roadrace)</option>
                  <option value="Porting Polish">Porting Polish Saja</option>
                  <option value="Remap ECU">Remap ECU / Juken / Aracer</option>
                  <option value="Restorasi Mesin">Restorasi Mesin Total</option>
                  <option value="Lainnya">Custom / Lainnya</option>
                </select>
                {durationText && <p className="text-sm font-bold text-primary mt-2 flex items-center gap-1.5"><Info className="w-4 h-4"/> {durationText}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Detail Request Modifikasi <span className="text-destructive">*</span></label>
                <textarea value={formData.complaintDetail} onChange={(e) => setFormData({ ...formData, complaintDetail: e.target.value })} rows={4} className="w-full rounded-xl border border-border bg-background px-4 py-3.5" placeholder="Sertakan detail keluhan..."></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2"><Calendar className="h-4 w-4 inline mr-1 text-primary" /> Tanggal Masuk</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} value={formData.serviceDate} onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-3.5" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2"><Clock className="h-4 w-4 inline mr-1 text-primary" /> Permintaan Kedatangan</label>
                  <input type="time" value={formData.estimatedTime} onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-3.5" />
                  <p className="text-[10.5px] text-muted-foreground mt-1.5 font-medium leading-tight">Jam mulai aktual dapat bergeser otomatis menyesuaikan kepadatan antrean di Paddock.</p>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-4 font-bold text-lg hover:bg-primary/90 transition-all uppercase flex justify-center items-center gap-2 group">
                {isLoading ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span> : <>GASKAN BOOKING <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: LIVE PADDOCK */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-lg h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></div>
                <h3 className="font-bold text-foreground text-lg">Live Paddock</h3>
              </div>
              <span className="text-xs font-bold bg-muted px-2 py-1 rounded text-muted-foreground">{liveQueues.length} Motor</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[600px] scrollbar-thin">
              {liveQueues.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center opacity-50"><CheckCircle2 className="h-10 w-10 mb-2" /><p className="text-sm font-medium">Paddock kosong.</p></div>
              ) : (
                liveQueues.map((q) => (
                  <div key={q.id} className={`bg-background/50 border-2 rounded-xl p-4 transition-all duration-300 ${q.status === 'Kendala' ? 'border-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.2)] bg-orange-500/5' : 'border-border hover:border-primary/30'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">{q.queue_number}</span>
                      
                      {/* Lencana Status Dinamis */}
                      {q.status === 'Diproses' ? (
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded flex items-center gap-1 animate-pulse">
                          <Wrench className="w-3 h-3"/> ON PROGRESS
                        </span>
                      ) : q.status === 'Kendala' ? (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-500/20 border border-orange-500/40 px-2 py-1 rounded flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3"/> ⚠️ TERTUNDA
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-warning bg-warning/10 border border-warning/20 px-2 py-1 rounded">WAITING</span>
                      )}
                    </div>
                    
                    <p className={`font-bold text-sm truncate mt-1 ${q.status === 'Kendala' ? 'text-orange-600' : 'text-foreground'}`}>{q.merk} {q.tipe}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{q.plat_nomor}</p>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Mulai Dikerjakan</p>
                        <p className={`text-xs font-bold ${q.status === 'Kendala' ? 'text-orange-600' : 'text-foreground'}`}>{q.estimated_time || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Est. Selesai</p>
                        <p className={`text-xs font-bold ${q.status === 'Kendala' ? 'text-orange-600' : 'text-green-600 dark:text-green-400'}`}>
                          {q.status === 'Kendala' ? 'Menunggu Mekanik' : calculateCompletionTime(q.estimated_time || '00:00', q.duration_minutes || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}