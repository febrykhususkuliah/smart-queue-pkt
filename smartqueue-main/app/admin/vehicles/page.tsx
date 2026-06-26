'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Vehicle, User } from '@/lib/types';
import { SearchInput } from '@/components/search-input';

export default function AdminVehiclesPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

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
        const res = await apiClient.get('/admin/vehicles');
        if (res && res.success) {
          const mapped = (res.data || []).map((v: any) => ({
            id: String(v.id),
            user_id: String(v.user_id),
            merk: v.merk,
            tipe: v.tipe,
            tahun: Number(v.tahun),
            plat_nomor: v.plat_nomor,
            created_at: new Date(v.created_at),
            user_name: v.user_name || '',
          }));
          setVehicles(mapped);
          return;
        }
      } catch (e) {
        console.error('Fetch admin vehicles error:', e);
      }
      setVehicles([]);
    })();
  }, [router]);

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.merk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plat_nomor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOwnerName = (userId: string, userName?: string) => {
    return userName || 'Unknown';
  };

  if (!adminUser) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Kendaraan</h1>
        <p className="mt-2 text-muted-foreground">Kelola daftar kendaraan pelanggan</p>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Cari kendaraan berdasarkan merek atau plat..."
        value={searchTerm}
        onChange={setSearchTerm}
        onClear={() => setSearchTerm('')}
      />

      {/* Vehicles Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Pemilik
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Merek
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Tipe
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Plat Nomor
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Tahun
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Tidak ada kendaraan ditemukan
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {getOwnerName(vehicle.user_id, (vehicle as any).user_name)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{vehicle.merk}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{vehicle.tipe}</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {vehicle.plat_nomor}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{vehicle.tahun}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-lg border border-border bg-muted p-6">
        <p className="text-sm text-muted-foreground">
          Total Kendaraan: <span className="font-bold text-foreground">{vehicles.length}</span>
        </p>
      </div>
    </div>
  );
}
