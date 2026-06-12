import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, Package, Grid, Tag, Image, FileText, Settings, BarChart3, LogOut, Heart, MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/siparisler', icon: ShoppingBag, label: 'Siparişler' },
  { path: '/admin/urunler', icon: Package, label: 'Ürünler' },
  { path: '/admin/kategoriler', icon: Grid, label: 'Kategoriler' },
  { path: '/admin/kullanicilar', icon: Users, label: 'Kullanıcılar' },
  { path: '/admin/kuponlar', icon: Tag, label: 'Kuponlar' },
  { path: '/admin/bannerlar', icon: Image, label: 'Bannerlar' },
  { path: '/admin/sayfalar', icon: FileText, label: 'Sayfalar' },
  { path: '/admin/raporlar', icon: BarChart3, label: 'Raporlar' },
  { path: '/admin/ayarlar', icon: Settings, label: 'Ayarlar' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary-400" />
          <span className="text-xl font-bold">Mini<span className="text-primary-400">Moda</span></span>
        </Link>
        <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
