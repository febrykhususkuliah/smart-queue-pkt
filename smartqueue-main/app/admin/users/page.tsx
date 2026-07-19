// app/admin/users/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { User } from '@/lib/types';
import { SearchInput } from '@/components/search-input';

export default function AdminUsersPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);

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
        const res = await apiClient.get('/admin/users');
        if (res && res.success) {
          const mapped = (res.data || []).map((u: any) => ({
            id: String(u.id),
            name: u.name,
            email: u.email,
            role: u.role,
            phone: u.phone || '',
            address: u.address || '',
            created_at: new Date(u.created_at),
          }));
          setUsers(mapped);
          return;
        }

        if (res && (res.code === 401 || res.code === 403)) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionExpiry');
          }
          router.push('/login');
          return;
        }
      } catch (e) {
        console.error('Fetch admin users error:', e);
      }
      setUsers([]);
    })();
  }, [router]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!adminUser) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data User</h1>
        <p className="mt-2 text-muted-foreground">Kelola daftar user sistem</p>
      </div>

      <SearchInput
        placeholder="Cari user berdasarkan nama, email, atau peran..."
        value={searchTerm}
        onChange={setSearchTerm}
        onClear={() => setSearchTerm('')}
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Telepon</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Alamat</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Tanggal Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Tidak ada user ditemukan
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{user.role}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{user.address || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.created_at.toLocaleDateString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted p-6">
        <p className="text-sm text-muted-foreground">
          Total User: <span className="font-bold text-foreground">{users.length}</span>
        </p>
      </div>
    </div>
  );
}