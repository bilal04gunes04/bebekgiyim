import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronRight, Eye } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  processing: { label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-800', icon: Package },
  shipped: { label: 'Kargoda', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'İade Edildi', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

export default function Orders() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/giris');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await orderService.getOrders(params);
      setOrders(response.data.data || []);
    } catch (error) {
      toast.error('Siparişler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) return;
    try {
      await orderService.cancelOrder(orderId);
      toast.success('Sipariş iptal edildi');
      fetchOrders();
    } catch (error) {
      toast.error('İptal işlemi başarısız');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Siparişlerim</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Tümü' : statusConfig[status]?.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Henüz siparişiniz bulunmamaktadır.</p>
          <Link to="/urunler" className="btn-primary inline-block mt-4">Alışverişe Başla</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Sipariş No</p>
                    <p className="font-bold text-lg">{order.order_number}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {status.label}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
                    <p className="font-bold text-xl text-primary-600">{order.total_amount} TL</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    {(order.items || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                            👕
                          </div>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-gray-500">x{item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-medium">{item.totalPrice} TL</span>
                      </div>
                    ))}
                    {(order.items || []).length > 3 && (
                      <p className="text-sm text-gray-500">+{(order.items || []).length - 3} ürün daha</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <Link to={`/siparis/${order.id}`} className="flex-1 btn-outline text-sm py-2 text-center flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> Detaylar
                  </Link>
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button onClick={() => handleCancel(order.id)} className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm py-2 transition">
                      İptal Et
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
