import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, ImageOff, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, summary, updateQuantity, removeItem, clearCart, applyCoupon, coupon, removeCoupon } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = React.useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode);
    if (result.success) {
      toast.success('Kupon uygulandı!');
      setCouponCode('');
    } else {
      toast.error(result.error || 'Geçersiz kupon');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sepetiniz Boş</h2>
        <p className="text-gray-500 mb-6">Sepetinizde ürün bulunmamaktadır.</p>
        <Link to="/urunler" className="btn-primary inline-flex items-center gap-2">
          Alışverişe Başla <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Alışveriş Sepeti</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Ürünler */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 bg-white rounded-xl p-4 shadow-sm">
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-7 h-7 text-gray-300" /></div>
                )}
              </div>
              <div className="flex-1">
                <Link to={`/urun/${item.product_slug}`} className="font-medium text-gray-800 hover:text-primary-500 transition">
                  {item.product_name}
                </Link>
                {item.size && <p className="text-sm text-gray-500">Beden: {item.size}</p>}
                {item.color && <p className="text-sm text-gray-500">Renk: {item.color}</p>}
                <p className="font-bold text-primary-600 mt-1">{item.unit_price} TL</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition">
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex items-center border rounded-lg">
                  <button 
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="p-2 hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-medium">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-red-500 hover:text-red-600 text-sm font-medium">
            Sepeti Temizle
          </button>
        </div>

        {/* Özet */}
        <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4">Sipariş Özeti</h2>

          <div className="space-y-3 mb-4">
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
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between text-xl font-bold">
              <span>Toplam</span>
              <span className="text-primary-600">{summary.total} TL</span>
            </div>
          </div>

          {/* Kupon */}
          <div className="mb-4">
            {coupon ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                <span className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {coupon.code} uygulandı
                </span>
                <button onClick={removeCoupon} className="text-green-600 hover:text-green-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kupon kodu"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button onClick={handleApplyCoupon} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 transition">
                  <Tag className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (!user) {
                toast.error('Ödeme yapmak için giriş yapmalısınız');
                navigate('/giris', { state: { from: '/sepet' } });
                return;
              }
              navigate('/odeme');
            }}
            className="w-full btn-primary py-4 text-lg"
          >
            Ödemeye Geç
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            250 TL üzeri siparişlerde kargo ücretsizdir.
          </p>
        </div>
      </div>
    </div>
  );
}
