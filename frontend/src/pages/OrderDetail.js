import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, ChevronLeft, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800', icon: Clock, step: 1 },
  confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800', icon: CheckCircle, step: 2 },
  processing: { label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-800', icon: Package, step: 3 },
  shipped: { label: 'Kargoda', color: 'bg-indigo-100 text-indigo-800', icon: Truck, step: 4 },
  delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-800', icon: CheckCircle, step: 5 },
  cancelled: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800', icon: XCircle, step: 0 },
  refunded: { label: 'İade Edildi', color: 'bg-gray-100 text-gray-800', icon: XCircle, step: 0 },
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

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
  const shippingAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/siparislerim" className="flex items-center gap-2 text-gray-600 hover:text-primary-500 mb-6 transition">
        <ChevronLeft className="w-5 h-5" /> Siparişlerime Dön
      </Link>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Sipariş No</p>
            <h1 className="text-2xl font-bold">{order.order_number}</h1>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
            <StatusIcon className="w-5 h-5" />
            {status.label}
          </div>
        </div>

        {/* Durum Takibi */}
        {status.step > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step <= status.step ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step === 1 && <Clock className="w-5 h-5" />}
                    {step === 2 && <CheckCircle className="w-5 h-5" />}
                    {step === 3 && <Package className="w-5 h-5" />}
                    {step === 4 && <Truck className="w-5 h-5" />}
                    {step === 5 && <CheckCircle className="w-5 h-5" />}
                  </div>
                  <span className="text-xs mt-2 text-gray-600 hidden sm:block">
                    {step === 1 && 'Bekliyor'}
                    {step === 2 && 'Onaylandı'}
                    {step === 3 && 'Hazırlanıyor'}
                    {step === 4 && 'Kargoda'}
                    {step === 5 && 'Teslim'}
                  </span>
                </div>
              ))}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
                <div 
                  className="h-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${((status.step - 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Ürünler */}
        <div className="border-t pt-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Sipariş Edilen Ürünler</h2>
          <div className="space-y-4">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl">
                  👕
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.productName}</p>
                  {item.variantInfo && (
                    <p className="text-sm text-gray-500">
                      {item.variantInfo.size && `Beden: ${item.variantInfo.size}`}
                      {item.variantInfo.color && ` | Renk: ${item.variantInfo.color}`}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">x{item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{item.totalPrice} TL</p>
                  <p className="text-sm text-gray-500">{item.unitPrice} TL/adet</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Teslimat Adresi */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-500" /> Teslimat Adresi
            </h2>
            {shippingAddress && (
              <div className="text-gray-600 space-y-1">
                <p className="font-medium text-gray-800">{shippingAddress.full_name || shippingAddress.fullName}</p>
                <p>{shippingAddress.address_line || shippingAddress.addressLine}</p>
                <p>{shippingAddress.neighborhood && `${shippingAddress.neighborhood}, `}{shippingAddress.district}, {shippingAddress.city}</p>
                <p>{shippingAddress.phone}</p>
              </div>
            )}
          </div>

          {/* Ödeme */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-500" /> Ödeme Bilgisi
            </h2>
            <div className="text-gray-600 space-y-1">
              <p><span className="font-medium">Yöntem:</span> {order.payment_method === 'cod' ? 'Kapıda Ödeme' : 'Kredi Kartı'}</p>
              <p><span className="font-medium">Durum:</span> {order.payment_status === 'paid' ? 'Ödendi' : 'Bekliyor'}</p>
            </div>
          </div>
        </div>

        {/* Özet */}
        <div className="border-t pt-6 mt-6">
          <div className="max-w-sm ml-auto space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Ara Toplam</span>
              <span>{order.subtotal} TL</span>
            </div>
            {parseFloat(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>İndirim</span>
                <span>-{order.discount_amount} TL</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Kargo</span>
              <span>{parseFloat(order.shipping_cost) === 0 ? 'Ücretsiz' : `${order.shipping_cost} TL`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>KDV</span>
              <span>{order.tax_amount} TL</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-xl font-bold">
              <span>Toplam</span>
              <span className="text-primary-600">{order.total_amount} TL</span>
            </div>
          </div>
        </div>

        {/* İptal Butonu */}
        {['pending', 'confirmed'].includes(order.status) && (
          <div className="mt-6 pt-6 border-t">
            <button onClick={handleCancel} className="w-full py-3 border-2 border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition font-medium">
              Siparişi İptal Et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
