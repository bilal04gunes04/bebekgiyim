import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/products/ProductCard';
import { ArrowRight, Truck, Shield, RotateCcw, Headphones, Baby, Heart, Sparkles, Star, Shirt, PersonStanding, Gift } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';

const features = [
  { icon: Truck, title: 'Ücretsiz Kargo', desc: '250 TL üzeri' },
  { icon: Shield, title: 'Güvenli Alışveriş', desc: 'SSL koruma' },
  { icon: RotateCcw, title: 'Kolay İade', desc: '14 gün içinde' },
  { icon: Headphones, title: '7/24 Destek', desc: 'Müşteri hizmetleri' },
];

export default function Home() {
  const { data: featured } = useQuery('featured', () => productService.getFeatured());
  const { data: newArrivals } = useQuery('newArrivals', () => productService.getNewArrivals());
  const { data: categoriesData } = useQuery('categories', () => categoryService.getCategories());

  const categories = categoriesData?.data?.data || [];

  return (
    <div>
      {/* Hero Slider */}
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        className="h-[400px] md:h-[500px]"
      >
        <SwiperSlide className="bg-gradient-to-r from-primary-100 to-baby-lavender flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
                Yeni Sezon <span className="text-primary-500">Bebek Giyim</span>
              </h1>
              <p className="text-lg text-gray-600 mb-6">%100 organik pamuk, cilt dostu kumaşlar</p>
              <Link to="/urunler?tag=yeni-sezon" className="btn-primary inline-flex items-center gap-2">
                Keşfet <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="w-64 h-64 bg-white/50 rounded-full flex items-center justify-center shadow-2xl">
                <Baby className="w-32 h-32 text-primary-400" />
              </div>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide className="bg-gradient-to-r from-baby-blue to-secondary-100 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
                Okula Dönüş <span className="text-secondary-500">Koleksiyonu</span>
              </h1>
              <p className="text-lg text-gray-600 mb-6">Şık ve rahat okul kıyafetleri</p>
              <Link to="/urunler?tag=okula-donus" className="btn-secondary inline-flex items-center gap-2">
                Alışverişe Başla <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="w-64 h-64 bg-white/50 rounded-full flex items-center justify-center text-9xl shadow-2xl">
                🎒
              </div>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>

      {/* Özellikler */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition">
              <div className="p-3 bg-primary-100 rounded-lg">
                <f.icon className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kategoriler */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-2">Kategoriler</h2>
        <p className="text-gray-500 text-center mb-8">Bebek ve çocuklarınız için en iyisi</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/urunler?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-square shadow-sm hover:shadow-lg transition"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${
                cat.slug?.includes('bebek') ? 'from-pink-200 to-rose-100' :
                cat.slug?.includes('kiz') ? 'from-purple-200 to-violet-100' :
                cat.slug?.includes('erkek') ? 'from-blue-200 to-sky-100' :
                'from-green-200 to-emerald-100'
              }`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="mb-3 group-hover:scale-110 transition-transform">
                  {cat.slug?.includes('bebek') ? <Baby className="w-12 h-12 text-primary-400" /> :
                   cat.slug?.includes('kiz') ? <PersonStanding className="w-12 h-12 text-pink-400" /> :
                   cat.slug?.includes('erkek') ? <Shirt className="w-12 h-12 text-blue-400" /> :
                   <Gift className="w-12 h-12 text-green-400" />}
                </span>
                <h3 className="text-xl font-bold text-gray-800">{cat.name}</h3>
                <span className="text-sm text-gray-600 group-hover:text-primary-500 transition mt-1">Keşfet →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Öne Çıkan Ürünler */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Öne Çıkan Ürünler</h2>
            <p className="text-gray-500 mt-1">En çok tercih edilen ürünler</p>
          </div>
          <Link to="/urunler?tag=indirim" className="text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
            Tümünü Gör <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {(featured?.data?.data || []).slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Yeni Gelenler */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Yeni Gelenler</h2>
              <p className="text-gray-500 mt-1">Bu sezonun en yeni ürünleri</p>
            </div>
            <Link to="/urunler?tag=yeni-sezon" className="text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(newArrivals?.data?.data || []).slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-2xl p-8 md:p-12 text-center text-white">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-white/80" />
          <h2 className="text-3xl font-bold mb-3">Yeni Ürünlerden İlk Siz Haberdar Olun</h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">Bültenimize abone olun, özel indirimler ve yeni koleksiyonlardan ilk siz haberdar olun.</p>
          <div className="flex max-w-md mx-auto gap-3">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 outline-none focus:ring-2 focus:ring-white/50"
            />
            <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
              Abone Ol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
