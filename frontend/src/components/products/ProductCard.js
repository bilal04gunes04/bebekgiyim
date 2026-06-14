import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, ImageOff } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCartStore();
  const price = product.sale_price || product.base_price;
  const originalPrice = product.sale_price ? product.base_price : null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await addToCart(product.id, null, 1);
    if (result.success) {
      toast.success('Sepete eklendi!');
    } else {
      toast.error(result.error || 'Hata oluştu');
    }
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <Link to={`/urun/${product.slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          {product.primary_image || product.images?.[0]?.url ? (
            <img
              src={product.primary_image || product.images?.[0]?.url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-baby-blue">
              <ImageOff className="w-10 h-10 text-primary-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-0 right-0 flex justify-between px-3">
            {product.is_new_arrival && (
              <span className="bg-baby-mint text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">
                Yeni
              </span>
            )}
            {originalPrice && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full ml-auto">
                %{Math.round((1 - price / originalPrice) * 100)} İndirim
              </span>
            )}
          </div>

          {/* Quick add button */}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary-500 hover:text-white"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">{product.brand_name}</p>
          <h3 className="font-medium text-gray-800 line-clamp-2 mb-2 text-sm leading-snug">{product.name}</h3>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary-600">{price} TL</span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">{originalPrice} TL</span>
            )}
          </div>

          {product.rating_avg > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.round(product.rating_avg) ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.rating_count})</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
