import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import { Search, Users, Shield, User, Mail, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchUsers(); }, [page, search]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 20, search: search || undefined };
      const response = await adminService.getUsers(params);
      setUsers(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) { toast.error('Kullanıcılar yüklenemedi'); }
    finally { setIsLoading(false); }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await adminService.updateUserRole(id, newRole);
      toast.success('Rol güncellendi');
      fetchUsers();
    } catch (error) { toast.error('Güncelleme başarısız'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Kullanıcılar</h1>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Kullanıcı ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="py-20"><LoadingSpinner size="lg" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Kullanıcı</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">E-posta</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Telefon</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Rol</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-500">ID: #{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            user.role === 'moderator' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          <option value="customer">Müşteri</option>
                          <option value="moderator">Moderatör</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && <div className="p-4 border-t"><Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} /></div>}
          </>
        )}
      </div>
    </div>
  );
}
