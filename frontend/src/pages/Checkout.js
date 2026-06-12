import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { orderService } from '../services/orderService';
import { CreditCard, Truck, MapPin, ChevronRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { items, summary, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    shippingAddressId: '',
    paymentMethod: 'cod',
    notes: '',
    couponCode: '',
  });

  // Demo adresler (gerçekte API'den çekilir)
  const [addresses] = useState(user?.addresses || []);

  const handlePlaceOrder = async () => {
    if (!orderData.shippingAddressId) {
      toast.error('Lütfen bir teslimat adresi seçin');
      return;
    }
    setIsLoading(true);
    try {
      const response = await orderService.createOrder({
        shippingAddressId: parseInt(orderData.shippingAddressId),
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
        couponCode: orderData.couponCode,
      });
      toast.success('Siparişiniz alındı!');
      clearCart();
      navigate(`/siparis/${response.data.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sipariş oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Sepetiniz Boş</h2>
        <button onClick={() => navigate('/urunler')} className="btn-primary">
          Alışverişe Başla
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Ödeme</h1>

      {/* Adım Göstergesi */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}>
            <MapPin className="w-4 h-4" />
          </div>
          <span className="font-medium hidden sm:block">Adres</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}>
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="font-medium hidden sm:block">Ödeme</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}>
            <Check className="w-4 h-4" />
          </div>
          <span className="font-medium hidden sm:block">Onay</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sol - Form */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Teslimat Adresi</h2>
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Kayıtlı adresiniz bulunmamaktadır.</p>
                  <button onClick={() => navigate('/profil')} className="btn-outline">
                    Adres Ekle
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                        orderData.shippingAddressId === String(addr.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={orderData.shippingAddressId === String(addr.id)}
                        onChange={(e) => setOrderData({ ...orderData, shippingAddressId: e.target.value })}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{addr.title}</p>
                        <p className="text-sm text-gray-600">{addr.fullName}</p>
                        <p className="text-sm text-gray-600">{addr.addressLine}</p>
                        <p className="text-sm text-gray-600">{addr.district}, {addr.city}</p>
                        <p className="text-sm text-gray-600">{addr.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <button
                onClick={() => setStep(2)}
                disabled={!orderData.shippingAddressId}
                className="mt-6 w-full btn-primary py-3 disabled:opacity-50"
              >
                Devam Et <ChevronRight className="w-5 h-5 inline" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Ödeme Yöntemi</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                  orderData.paymentMethod === 'cod' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={orderData.paymentMethod === 'cod'}
                    onChange={(e) => setOrderData({ ...orderData, paymentMethod: e.target.value })}
                  />
                  <Truck className="w-6 h-6 text-primary-500" />
                  <div>
                    <p className="font-medium">Kapıda Ödeme</p>
                    <p className="text-sm text-gray-500">Nakit veya kredi kartı ile kapıda ödeme</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                  orderData.paymentMethod === 'card' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={orderData.paymentMethod === 'card'}
                    onChange={(e) => setOrderData({ ...orderData, paymentMethod: e.target.value })}
                  />
                  <CreditCard className="w-6 h-6 text-primary-500" />
                  <div>
                    <p className="font-medium">Kredi Kartı</p>
                    <p className="text-sm text-gray-500">Güvenli online ödeme</p>
                  </div>
                </label>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Sipariş Notu (İsteğe Bağlı)</label>
                <textarea
                  value={orderData.notes}
                  onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                  placeholder="Teslimat ile ilgili özel notlar..."
                  className="w-full px-4 py-3 border rounded-lg h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 btn-outline py-3">
                  Geri
                </button>
                <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3">
                  Devam Et <ChevronRight className="w-5 h-5 inline" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Sipariş Onayı</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Teslimat Adresi</h3>
                  {addresses.find(a => String(a.id) === orderData.shippingAddressId) && (
                    <div className="text-sm text-gray-600">
                      <p>{addresses.find(a => String(a.id) === orderData.shippingAddressId).fullName}</p>
                      <p>{addresses.find(a => String(a.id) === orderData.shippingAddressId).addressLine}</p>
                      <p>{addresses.find(a => String(a.id) === orderData.shippingAddressId).district}, {addresses.find(a => String(a.id) === orderData.shippingAddressId).city}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Ödeme Yöntemi</h3>
                  <p className="text-sm text-gray-600">
                    {orderData.paymentMethod === 'cod' ? 'Kapıda Ödeme' : 'Kredi Kartı'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Sipariş Edilen Ürünler</h3>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span className="font-medium">{item.total} TL</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 btn-outline py-3">
                  Geri
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  className="flex-1 btn-primary py-3 disabled:opacity-50"
                >
                  {isLoading ? 'İşleniyor...' : 'Siparişi Onayla'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sağ - Özet */}
        <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4">Sipariş Özeti</h2>
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
                <span className="font-medium">{item.total} TL</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Ara Toplam</span>
              <span>{summary.subtotal} TL</span>
            </div>
            {parseFloat(summary.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>İndirim</span>
                <span>-{summary.discountAmount} TL</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Kargo</span>
              <span>{parseFloat(summary.shippingCost) === 0 ? 'Ücretsiz' : `${summary.shippingCost} TL`}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-xl font-bold">
              <span>Toplam</span>
              <span className="text-primary-600">{summary.total} TL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
