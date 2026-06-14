import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productService } from '../services/productService';
import { useCartStore } from '../store/useCartStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Heart, Share2, Truck, Shield, RotateCcw, Minus, Plus, Star, ChevronRight, ImageOff } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { data, isLoading } = useQuery(['product', slug], () => productService.getProduct(slug));
  const product = data?.data?.data;

  if (isLoading) return <div className="py-20"><LoadingSpinner size="xl" /></div>;
  if (!product) return <div className="text-center py-20">Ürün bulunamadı</div>;

  const price = product.sale_price || product.base_price;
  const originalPrice = product.sale_price ? product.base_price : null;
  const images = product.images || [];
  const variants = product.variants || [];
  const reviews = product.reviews || [];

  const uniqueSizes = [...new Set(variants.map(v => v.size))];
  const uniqueColors = [...new Set(variants.map(v => v.color))];

  const currentVariant = selectedVariant || variants[0];
  const finalPrice = currentVariant?.price_adjustment 
    ? price + parseFloat(currentVariant.price_adjustment) 
    : price;

  const handleAddToCart = async () => {
    const result = await addToCart(product.id, currentVariant?.id, quantity);
    if (result.success) {
      toast.success('Sepete eklendi!');
    } else {
      toast.error(result.error || 'Hata oluştu');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-500">Ana Sayfa</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/urunler?category=${product.category_slug}`} className="hover:text-primary-500">
          {product.category_name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Görseller */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
            {images[selectedImage]?.url ? (
              <img 
                src={images[selectedImage].url} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-baby-blue">
                <ImageOff className="w-16 h-16 text-primary-300" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === idx ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bilgiler */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-gray-500">{product.brand_name}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-2 rounded-full border transition ${isWishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-50">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>

          {/* Rating */}
          {product.rating_avg > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating_avg) ? 'fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-600">{product.rating_avg} ({product.rating_count} değerlendirme)</span>
            </div>
          )}

          {/* Fiyat */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-bold text-primary-600">{finalPrice} TL</span>
            {originalPrice && (
              <span className="text-xl text-gray-400 line-through">{originalPrice} TL</span>
            )}
            {originalPrice && (
              <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-1 rounded">
                %{Math.round((1 - price/originalPrice) * 100)} İndirim
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">{product.description || product.short_description}</p>

          {/* Varyantlar - Beden */}
          {uniqueSizes.length > 0 && (
            <div className="mb-4">
              <label className="block font-medium mb-2">Beden</label>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      const variant = variants.find(v => v.size === size && (!selectedVariant || v.color === selectedVariant.color));
                      setSelectedVariant(variant || variants.find(v => v.size === size));
                    }}
                    className={`px-4 py-2 rounded-lg border transition ${
                      selectedVariant?.size === size
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Varyantlar - Renk */}
          {uniqueColors.length > 0 && (
            <div className="mb-6">
              <label className="block font-medium mb-2">Renk</label>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      const variant = variants.find(v => v.color === color && (!selectedVariant || v.size === selectedVariant.size));
                      setSelectedVariant(variant || variants.find(v => v.color === color));
                    }}
                    className={`px-4 py-2 rounded-lg border transition ${
                      selectedVariant?.color === color
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stok */}
          <div className="mb-6">
            <span className={`text-sm font-medium ${
              (currentVariant?.stock || product.stock_quantity) > 0 ? 'text-green-600' : 'text-red-500'
            }`}>
              {(currentVariant?.stock || product.stock_quantity) > 0 
                ? `✓ Stokta (${currentVariant?.stock || product.stock_quantity} adet)` 
                : '✗ Stokta yok'}
            </span>
          </div>

          {/* Miktar & Sepete Ekle */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border rounded-lg">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-gray-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={handleAddToCart}
              disabled={(currentVariant?.stock || product.stock_quantity) <= 0}
              className="flex-1 btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sepete Ekle
            </button>
          </div>

          {/* Özellikler */}
          <div className="grid grid-cols-3 gap-4 py-6 border-t">
            <div className="text-center">
              <Truck className="w-6 h-6 mx-auto mb-2 text-primary-500" />
              <p className="text-xs text-gray-600">Ücretsiz Kargo<br/>250 TL+</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-primary-500" />
              <p className="text-xs text-gray-600">Güvenli<br/>Ödeme</p>
            </div>
            <div className="text-center">
              <RotateCcw className="w-6 h-6 mx-auto mb-2 text-primary-500" />
              <p className="text-xs text-gray-600">14 Gün<br/>İade</p>
            </div>
          </div>
        </div>
      </div>

      {/* Yorumlar */}
      {reviews.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">Müşteri Değerlendirmeleri</h2>
          <div className="space-y-4">
            {reviews.slice(0, 5).map(review => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="font-medium">{review.userName}</span>
                  <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
