import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import { useEffect } from 'react';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Page from './pages/Page';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminCategories from './pages/admin/Categories';
import AdminUsers from './pages/admin/Users';
import AdminBanners from './pages/admin/Banners';
import AdminCoupons from './pages/admin/Coupons';
import AdminPages from './pages/admin/Pages';
import AdminSettings from './pages/admin/Settings';
import AdminReports from './pages/admin/Reports';

function App() {
  const { user } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/urunler" element={<Products />} />
          <Route path="/urun/:slug" element={<ProductDetail />} />
          <Route path="/sepet" element={<Cart />} />
          <Route path="/odeme" element={<Checkout />} />
          <Route path="/giris" element={<Login />} />
          <Route path="/kayit" element={<Register />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/siparislerim" element={<Orders />} />
          <Route path="/siparis/:id" element={<OrderDetail />} />
          <Route path="/favorilerim" element={<Wishlist />} />
          <Route path="/sayfa/:slug" element={<Page />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="urunler" element={<AdminProducts />} />
            <Route path="siparisler" element={<AdminOrders />} />
            <Route path="kategoriler" element={<AdminCategories />} />
            <Route path="kullanicilar" element={<AdminUsers />} />
            <Route path="bannerlar" element={<AdminBanners />} />
            <Route path="kuponlar" element={<AdminCoupons />} />
            <Route path="sayfalar" element={<AdminPages />} />
            <Route path="ayarlar" element={<AdminSettings />} />
            <Route path="raporlar" element={<AdminReports />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
