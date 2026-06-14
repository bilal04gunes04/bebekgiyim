import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, ChevronLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const statusConfig = {
  pending:    { label: 'Bekliyor',       color: 'bg-yellow-100 text-yellow-800', icon: Clock,        step: 1 },
  confirmed:  { label: 'Onaylandı',      color: 'bg-blue-100 text-blue-800',     icon: CheckCircle,  step: 2 },
  processing: { label: 'Hazırlanıyor',   color: 'bg-purple-100 text-purple-800', icon: Package,      step: 3 },
  shipped:    { label: 'Kargoda',        color: 'bg-indigo-100 text-indigo-800', icon: Truck,        step: 4 },
  delivered:  { label: 'Teslim Edildi',  color: 'bg-green-100 text-green-800',   icon: CheckCircle,  step: 5 },
  cancelled:  { label: 'İptal Edildi',   color: 'bg-red-100 text-red-800',       icon: XCircle,      step: 0 },
  refunded:   { label: 'İade Edildi',    color: 'bg-gray-100 text-gray-800',     icon: XCircle,      step: 0 },
};

const steps = [
  { step: 1, label: 'Sipariş Alındı',  icon: Clock },
  { step: 2, label: 'Onaylandı',       icon: CheckCircle },
  { step: 3, label: 'Hazırlanıyor',    icon: Package },
  { step: 4, label: 'Kargoya Verildi', icon: Truck },
  { step: 5, label: 'Teslim Edildi',   icon: CheckCircle },
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getOrder(id);
      setOrder(response.data.data);
    } catch (error) {
      toast.error('Sipariş bulunamadı');
      navigate('/siparislerim');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) return;
    try {
      await orderService.cancelOrder(id);
      toast.success('Sipariş iptal edildi');
      fetchOrder();
    } catch (error) {
      toast.error('İptal işlemi başarısız');
    }
  };

  if (isLoading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;
  if (!order) return null;

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const shippingAddress = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  const statusHistory = (order.status_history || [])
    .filter(h => h && h.status)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/siparislerim" className="flex items-center gap-2 text-gray-600 hover:text-primary-500 mb-6 transition">
        <ChevronLeft className="w-5 h-5" /> Siparişlerime Dön
      </Link>

      {/* Başlık */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Sipariş No</p>
            <h1 className="text-2xl font-bold">{order.order_number}</h1>
            <p className="text-sm text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
            <StatusIcon className="w-5 h-5" />
            {status.label}
          </div>
        </div>

        {/* Kargo Takip Numarası */}
        {order.tracking_number && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3">
            <Truck className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-800">Kargo Takip Numarası</p>
              <p className="text-indigo-600 font-mono text-lg mt-1">{order.tracking_number}</p>
              <p className="text-xs text-indigo-400 mt-1">Kargo firmasının web sitesinden siparişinizi takip edebilirsiniz.</p>
            </div>
          </div>
        )}

        {/* Durum Progress Bar */}
        {status.step > 0 && (
          <div className="mb-8">
            <div className="flex items-start justify-between relative">
              {steps.map(({ step, label, icon: Icon }) => {
                const done = step <= status.step;
                const current = step === status.step;
                return (
                  <div key={step} className="flex flex-col items-center z-10 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      done
                        ? 'bg-pink-500 border-pink-500 text-white'
                        : 'bg-white border-gray-200 text-gray-300'
                    } ${current ? 'ring-4 ring-pink-100' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 text-center hidden sm:block leading-tight ${done ? 'text-pink-600 font-medium' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
              {/* Bağlantı çizgisi */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 -z-0">
                <div
                  className="h-full bg-pink-500 transition-all duration-700"
                  style={{ width: `${Math.max(0, ((status.step - 1) / 4) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* İptal durumu uyarısı */}
        {status.step === 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">Bu sipariş {status.label.toLowerCase()}.</p>
          </div>
        )}

        {/* Durum Geçmişi (Timeline) */}
        {statusHistory.length > 0 && (
          <div className="mb-6 border-t pt-6">
            <h2 className="text-lg font-bold mb-4">Sipariş Geçmişi</h2>
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              {statusHistory.map((h, i) => {
                const cfg = statusConfig[h.status] || statusConfig.pending;
                const HIcon = cfg.icon;
                return (
                  <div key={i} className="relative mb-5 last:mb-0">
                    <div className={`absolute -left-4 w-8 h-8 rounded-full flex items-center justify-center ${cfg.color}`}>
                      <HIcon className="w-4 h-4" />
                    </div>
                    <div className="pl-6">
                      <p className="font-semibold text-gray-800">{cfg.label}</p>
                      {h.note && <p className="text-sm text-gray-500 mt-0.5">{h.note}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {h.createdAt ? new Date(h.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ürünler */}
        <div className="border-t pt-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Sipariş Edilen Ürünler</h2>
          <div className="space-y-3">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm">
                  👕
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.productName}</p>
                  {item.variantInfo && (typeof item.variantInfo === 'object') && (
                    <p className="text-sm text-gray-500">
                      {item.variantInfo.size && `Beden: ${item.variantInfo.size}`}
                      {item.variantInfo.size && item.variantInfo.color && ' | '}
                      {item.variantInfo.color && `Renk: ${item.variantInfo.color}`}
                    </p>
                  )}
                  <p className="text-sm text-gray-400">x{item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{parseFloat(item.totalPrice).toFixed(2)} TL</p>
                  <p className="text-xs text-gray-400">{parseFloat(item.unitPrice).toFixed(2)} TL/adet</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Teslimat Adresi */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pink-500" /> Teslimat Adresi
            </h2>
            {shippingAddress && (
              <div className="text-gray-600 space-y-1 text-sm bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-800">{shippingAddress.full_name || shippingAddress.fullName}</p>
                <p>{shippingAddress.address_line || shippingAddress.addressLine}</p>
                <p>
                  {shippingAddress.neighborhood && `${shippingAddress.neighborhood}, `}
                  {shippingAddress.district}, {shippingAddress.city}
                </p>
                {shippingAddress.phone && <p>📞 {shippingAddress.phone}</p>}
              </div>
            )}
          </div>

          {/* Ödeme */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-pink-500" /> Ödeme Bilgisi
            </h2>
            <div className="text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-500">Yöntem</span>
                <span className="font-medium">{order.payment_method === 'cod' ? '🚪 Kapıda Ödeme' : '💳 Kredi Kartı'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Durum</span>
                <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment_status === 'paid' ? '✅ Ödendi' : '⏳ Bekliyor'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fiyat Özeti */}
        <div className="border-t pt-6 mt-6">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Ara Toplam</span>
              <span>{parseFloat(order.subtotal).toFixed(2)} TL</span>
            </div>
            {parseFloat(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>İndirim</span>
                <span>-{parseFloat(order.discount_amount).toFixed(2)} TL</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Kargo</span>
              <span>{parseFloat(order.shipping_cost) === 0 ? 'Ücretsiz' : `${parseFloat(order.shipping_cost).toFixed(2)} TL`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>KDV</span>
              <span>{parseFloat(order.tax_amount).toFixed(2)} TL</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Toplam</span>
              <span className="text-pink-600">{parseFloat(order.total_amount).toFixed(2)} TL</span>
            </div>
          </div>
        </div>

        {/* İptal Butonu */}
        {['pending', 'confirmed'].includes(order.status) && (
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={handleCancel}
              className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition font-medium"
            >
              Siparişi İptal Et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
