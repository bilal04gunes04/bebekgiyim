import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { ShoppingBag, Heart, User, Menu, X, Search, Baby, ChevronDown, Sparkles, Truck, Gift } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/urunler?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      {/* Üst bar */}
      <div className="bg-primary-500 text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
          <Truck className="w-4 h-4" /> 250 TL üzeri kargo bedava!
          <span className="mx-1">|</span>
          <Gift className="w-4 h-4" /> Yeni üyelere özel %10 indirim
        </div>
      </div>

      {/* Ana navbar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Baby className="w-8 h-8 text-primary-500" />
            <span className="text-2xl font-bold text-gray-800">
              Mini<span className="text-primary-500">Moda</span>
            </span>
          </Link>

          {/* Arama - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Ürün, kategori veya marka ara..."
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400 hover:text-primary-500 transition" />
              </button>
            </div>
          </form>

          {/* Sağ menü */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/favorilerim" className="p-2 hover:bg-gray-100 rounded-full transition">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            </Link>
            <Link to="/sepet" className="p-2 hover:bg-gray-100 rounded-full transition relative">
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition">
                  <User className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                  <span className="hidden lg:block text-sm font-medium">{user.firstName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
                </button>
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg py-2 hidden group-hover:block border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link to="/profil" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition">Profilim</Link>
                  <Link to="/siparislerim" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition">Siparişlerim</Link>
                  <Link to="/favorilerim" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition">Favorilerim</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2.5 text-sm hover:bg-gray-50 text-primary-600 font-medium transition">
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/giris" className="btn-primary text-sm py-2 px-4">
                Giriş Yap
              </Link>
            )}

            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Kategoriler - Desktop */}
      <div className="hidden md:block border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-8 h-12 text-sm font-medium">
            <Link to="/urunler?category=bebek-giyim" className="hover:text-primary-500 transition-colors">Bebek Giyim</Link>
            <Link to="/urunler?category=kiz-cocuk" className="hover:text-primary-500 transition-colors">Kız Çocuk</Link>
            <Link to="/urunler?category=erkek-cocuk" className="hover:text-primary-500 transition-colors">Erkek Çocuk</Link>
            <Link to="/urunler?category=aksesuar" className="hover:text-primary-500 transition-colors">Aksesuar</Link>
            <div className="flex-1" />
            <Link to="/urunler?tag=yeni-sezon" className="text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Yeni Sezon
            </Link>
            <Link to="/urunler?tag=indirim" className="text-red-500 hover:text-red-600 transition-colors font-bold">
              İndirim
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menü */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-4 space-y-1">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ara..."
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>
            <Link to="/urunler?category=bebek-giyim" className="block py-2.5 text-gray-700 hover:text-primary-500 transition" onClick={() => setIsMenuOpen(false)}>Bebek Giyim</Link>
            <Link to="/urunler?category=kiz-cocuk" className="block py-2.5 text-gray-700 hover:text-primary-500 transition" onClick={() => setIsMenuOpen(false)}>Kız Çocuk</Link>
            <Link to="/urunler?category=erkek-cocuk" className="block py-2.5 text-gray-700 hover:text-primary-500 transition" onClick={() => setIsMenuOpen(false)}>Erkek Çocuk</Link>
            <Link to="/urunler?category=aksesuar" className="block py-2.5 text-gray-700 hover:text-primary-500 transition" onClick={() => setIsMenuOpen(false)}>Aksesuar</Link>
            <Link to="/urunler?tag=yeni-sezon" className="block py-2.5 text-primary-500 transition" onClick={() => setIsMenuOpen(false)}>Yeni Sezon</Link>
            <Link to="/urunler?tag=indirim" className="block py-2.5 text-red-500 transition" onClick={() => setIsMenuOpen(false)}>İndirim</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
