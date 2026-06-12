import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, Eye, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  processing: { label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-800', icon: Package },
  shipped: { label: 'Kargoda', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  delivered: { label: 'Teslim', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => { fetchOrders(); }, [page, status, search]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 20, search: search || undefined, status: status !== 'all' ? status : undefined };
      const response = await adminService.getAllOrders(params);
      setOrders(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) { toast.error('Siparişler yüklenemedi'); }
    finally { setIsLoading(false); }
  };

  const handleStatusUpdate = async () => {
    try {
      await adminService.updateOrderStatus(selectedOrder.id, { status: newStatus, trackingNumber });
      toast.success('Durum güncellendi');
      setShowStatusModal(false);
      fetchOrders();
    } catch (error) { toast.error('Güncelleme başarısız'); }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.tracking_number || '');
    setShowStatusModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Siparişler</h1>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Sipariş no, e-posta ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">Tüm Durumlar</option>
          {Object.entries(statusConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="py-20"><LoadingSpinner size="lg" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Sipariş No</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Müşteri</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Tarih</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Tutar</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Durum</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => {
                    const config = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{order.order_number}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{order.first_name} {order.last_name}</p>
                          <p className="text-sm text-gray-500">{order.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4 font-bold text-primary-600">{order.total_amount} TL</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                            <StatusIcon className="w-3 h-3" /> {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openStatusModal(order)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination && <div className="p-4 border-t"><Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} /></div>}
          </>
        )}
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Sipariş Durumunu Güncelle</h2>
            <p className="text-gray-600 mb-4">{selectedOrder?.order_number}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Yeni Durum</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              {newStatus === 'shipped' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Kargo Takip No</label>
                  <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Takip numarası..." className="w-full px-3 py-2 border rounded-lg" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleStatusUpdate} className="flex-1 btn-primary py-2">Güncelle</button>
              <button onClick={() => setShowStatusModal(false)} className="flex-1 btn-outline py-2">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
