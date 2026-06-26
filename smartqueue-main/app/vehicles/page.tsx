'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Vehicle, SessionUser, VehicleFormData } from '@/lib/types';
import { getAuthToken, getStoredSession } from '@/lib/auth';
import { VEHICLE_BRANDS, VEHICLE_TYPES } from '@/lib/constants';
import { ConfirmDialog } from '@/components/confirm-dialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

const vehicleSchema = z.object({
  merk: z.string().min(1, 'Pilih merek kendaraan'),
  tipe: z.string().min(1, 'Pilih tipe kendaraan'),
  tahun: z.coerce.number().min(1900, 'Tahun tidak valid').max(new Date().getFullYear(), 'Tahun tidak valid'),
  plat_nomor: z.string().min(5, 'Plat nomor minimal 5 karakter'),
});

export default function VehiclesPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as any,
  });

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.push('/login');
      return;
    }

    setUser(stored.user);

    const fetchVehicles = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/vehicles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Gagal mengambil kendaraan');
        }

        const result = await response.json();
        const mappedVehicles: Vehicle[] = (result.data || []).map((vehicle: any) => ({
          id: String(vehicle.id),
          user_id: String(vehicle.user_id),
          merk: vehicle.merk,
          tipe: vehicle.tipe,
          tahun: Number(vehicle.tahun),
          plat_nomor: vehicle.plat_nomor,
          created_at: new Date(vehicle.created_at),
        }));

        setVehicles(mappedVehicles);
      } catch (error) {
        console.error('Fetch vehicles error:', error);
        toast.error('Gagal memuat kendaraan. Silakan login kembali.');
        router.push('/login');
      }
    };

    fetchVehicles();
  }, [router]);

  const onSubmit = async (data: VehicleFormData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const payload = {
        merk: data.merk,
        tipe: data.tipe,
        tahun: data.tahun,
        plat_nomor: data.plat_nomor,
      };

      if (editingId) {
        const response = await fetch(`${API_BASE_URL}/api/vehicles/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || 'Gagal memperbarui kendaraan');
        }

        setVehicles(
          vehicles.map((v) =>
            v.id === editingId
              ? {
                  ...v,
                  ...payload,
                }
              : v
          )
        );
        toast.success('Kendaraan berhasil diperbarui');
      } else {
        const response = await fetch(`${API_BASE_URL}/api/vehicles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || 'Gagal menambahkan kendaraan');
        }

        const createdVehicle = result.data;
        setVehicles([
          {
            id: String(createdVehicle.id),
            user_id: String(createdVehicle.user_id || user!.id),
            merk: createdVehicle.merk,
            tipe: createdVehicle.tipe,
            tahun: Number(createdVehicle.tahun),
            plat_nomor: createdVehicle.plat_nomor,
            created_at: new Date(),
          },
          ...vehicles,
        ]);
        toast.success('Kendaraan berhasil ditambahkan');
      }

      setIsModalOpen(false);
      setEditingId(null);
      reset();
    } catch (error) {
      console.error('Vehicle save error:', error);
      toast.error('Gagal menyimpan kendaraan');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/vehicles/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || 'Gagal menghapus kendaraan');
      }

      setVehicles(vehicles.filter((v) => v.id !== deleteConfirm.id));
      toast.success('Kendaraan berhasil dihapus');
      setDeleteConfirm({ open: false, id: null });
    } catch (error) {
      console.error('Vehicle delete error:', error);
      toast.error('Gagal menghapus kendaraan');
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    reset({
      merk: vehicle.merk,
      tipe: vehicle.tipe,
      tahun: vehicle.tahun,
      plat_nomor: vehicle.plat_nomor,
    });
    setEditingId(vehicle.id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kendaraan Saya</h1>
          <p className="mt-2 text-foreground/60">Kelola daftar kendaraan Anda</p>
        </div>
        <button
          onClick={() => {
            reset();
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Tambah Kendaraan
        </button>
      </div>

      {/* Vehicles List */}
      <div className="space-y-4">
        {vehicles.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <p className="text-foreground/60">Belum ada kendaraan. Tambahkan kendaraan untuk memulai.</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center justify-between rounded-3xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {vehicle.merk} {vehicle.tipe}
                </p>
                <p className="text-sm text-foreground/60">{vehicle.plat_nomor}</p>
                <p className="text-xs text-foreground/50">Tahun {vehicle.tahun}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="rounded-3xl bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-lg">
            <h2 className="text-xl font-bold text-foreground">
              {editingId ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-foreground">Merek Kendaraan</label>
                <select
                  {...register('merk')}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Pilih merek...</option>
                  {VEHICLE_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                {errors.merk && (
                  <p className="mt-1 text-sm text-destructive">{errors.merk.message}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-foreground">Tipe Kendaraan</label>
                <select
                  {...register('tipe')}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Pilih tipe...</option>
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.tipe && (
                  <p className="mt-1 text-sm text-destructive">{errors.tipe.message}</p>
                )}
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-foreground">Tahun Kendaraan</label>
                <input
                  type="number"
                  placeholder="2020"
                  {...register('tahun')}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 placeholder-muted-foreground text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {errors.tahun && (
                  <p className="mt-1 text-sm text-destructive">{errors.tahun.message}</p>
                )}
              </div>

              {/* Plate Number */}
              <div>
                <label className="block text-sm font-medium text-foreground">Plat Nomor</label>
                <input
                  type="text"
                  placeholder="B 1234 ABC"
                  {...register('plat_nomor')}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 placeholder-muted-foreground text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {errors.plat_nomor && (
                  <p className="mt-1 text-sm text-destructive">{errors.plat_nomor.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    reset();
                  }}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingId ? 'Update' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        title="Hapus Kendaraan?"
        description="Kendaraan akan dihapus dan tidak dapat dipulihkan."
        isOpen={deleteConfirm.open}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
        variant="danger"
      />
    </div>
  );
}
