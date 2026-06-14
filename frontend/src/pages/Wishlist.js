import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import api from '../utils/api';
import { Heart, ShoppingCart, Trash2, ArrowRight, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/giris');
      return;
    }
    fetchWishlist();
  }, [user, navigate]);

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/wishlist');
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Favoriler yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems(items.filter(item => item.product_id !== productId));
      toast.success('Favorilerden çıkarıldı');
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleAddToCart = async (productId) => {
    const result = await addToCart(productId, null, 1);
    if (result.success) {
      toast.success('Sepete eklendi!');
    } else {
      toast.error(result.error || 'Hata oluştu');
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Favorileriniz Boş</h2>
        <p className="text-gray-500 mb-6">Beğendiğiniz ürünleri favorilere ekleyin.</p>
        <Link to="/urunler" className="btn-primary inline-flex items-center gap-2">
          Alışverişe Başla <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Favorilerim</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map(item => {
          const price = item.sale_price || item.base_price;
          const originalPrice = item.sale_price ? item.base_price : null;
          return (
            <div key={item.id} className="group relative bg-white rounded-xl shadow-sm overflow-hidden">
              <Link to={`/urun/${item.slug}`}>
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-10 h-10 text-gray-300" /></div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 line-clamp-2 text-sm mb-2">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary-600">{price} TL</span>
                    {originalPrice && <span className="text-sm text-gray-400 line-through">{originalPrice} TL</span>}
                  </div>
                </div>
              </Link>
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => handleAddToCart(item.product_id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition"
                >
                  <ShoppingCart className="w-4 h-4" /> Sepete Ekle
                </button>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="p-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
