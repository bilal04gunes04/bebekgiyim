import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Plus, Edit2, Trash2, Home, Heart, ShoppingBag, LogOut, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: '', fullName: '', phone: '', city: '', district: '', neighborhood: '', addressLine: '', postalCode: '', isDefault: false
  });
  const [profileForm, setProfileForm] = useState({
    firstName: '', lastName: '', phone: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/giris');
      return;
    }
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || ''
    });
    fetchAddresses();
  }, [user, navigate]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/users/addresses');
      setAddresses(response.data.data || []);
    } catch (error) {
      console.error('Adresler yüklenemedi:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/auth/profile', profileForm);
      updateUser(response.data.user);
      toast.success('Profil güncellendi');
    } catch (error) {
      toast.error('Güncelleme başarısız');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/addresses', addressForm);
      toast.success('Adres eklendi');
      setShowAddressForm(false);
      setAddressForm({ title: '', fullName: '', phone: '', city: '', district: '', neighborhood: '', addressLine: '', postalCode: '', isDefault: false });
      fetchAddresses();
    } catch (error) {
      toast.error('Adres eklenemedi');
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm('Bu adresi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Adres silindi');
      fetchAddresses();
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await api.put(`/users/addresses/${id}/default`);
      toast.success('Varsayılan adres güncellendi');
      fetchAddresses();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  if (!user) return null;

  const tabs = [
    { id: 'info', label: 'Profil Bilgileri', icon: User },
    { id: 'addresses', label: 'Adreslerim', icon: MapPin },
    { id: 'password', label: 'Şifre Değiştir', icon: Star },
    { id: 'orders', label: 'Siparişlerim', icon: ShoppingBag },
    { id: 'wishlist', label: 'Favorilerim', icon: Heart },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <User className="w-10 h-10 text-primary-500" />
              </div>
              <h2 className="font-bold text-lg">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <nav className="bg-white rounded-xl shadow-sm overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'orders') navigate('/siparislerim');
                  else if (tab.id === 'wishlist') navigate('/favorilerim');
                  else setActiveTab(tab.id);
                }}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition ${
                  activeTab === tab.id ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-500' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full flex items-center gap-3 px-6 py-3 text-left text-red-500 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Çıkış Yap</span>
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'info' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Profil Bilgileri</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ad</label>
                    <input
                      type="text" value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Soyad</label>
                    <input
                      type="text" value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-posta</label>
                  <input type="email" value={user.email} disabled className="w-full px-4 py-2.5 border rounded-lg bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefon</label>
                  <input
                    type="tel" value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                  />
                </div>
                <button type="submit" className="btn-primary">Bilgileri Güncelle</button>
              </form>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Adreslerim</h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="btn-outline text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Yeni Adres
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Adres Başlığı (Ev, İş)" value={addressForm.title} onChange={(e) => setAddressForm({...addressForm, title: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" required />
                    <input placeholder="Ad Soyad" value={addressForm.fullName} onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Telefon" value={addressForm.phone} onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" required />
                    <input placeholder="Posta Kodu" value={addressForm.postalCode} onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Şehir" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" required />
                    <input placeholder="İlçe" value={addressForm.district} onChange={(e) => setAddressForm({...addressForm, district: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" required />
                  </div>
                  <input placeholder="Mahalle" value={addressForm.neighborhood} onChange={(e) => setAddressForm({...addressForm, neighborhood: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <textarea placeholder="Adres Detayı" value={addressForm.addressLine} onChange={(e) => setAddressForm({...addressForm, addressLine: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm h-20 resize-none" required />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})} />
                    Varsayılan adres olarak ayarla
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm py-2">Kaydet</button>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="btn-outline text-sm py-2">İptal</button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Kayıtlı adresiniz bulunmamaktadır.</p>
                ) : (
                  addresses.map(addr => (
                    <div key={addr.id} className={`border rounded-lg p-4 ${addr.is_default ? 'border-primary-500 bg-primary-50' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{addr.title}</span>
                            {addr.is_default && <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded">Varsayılan</span>}
                          </div>
                          <p className="text-sm text-gray-600">{addr.full_name}</p>
                          <p className="text-sm text-gray-600">{addr.address_line}</p>
                          <p className="text-sm text-gray-600">{addr.district}, {addr.city} {addr.postal_code}</p>
                          <p className="text-sm text-gray-600">{addr.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          {!addr.is_default && (
                            <button onClick={() => setDefaultAddress(addr.id)} className="p-2 text-gray-400 hover:text-primary-500" title="Varsayılan yap">
                              <Home className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => deleteAddress(addr.id)} className="p-2 text-gray-400 hover:text-red-500" title="Sil">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Şifre Değiştir</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (passwordForm.newPassword.length < 6) { toast.error('Yeni şifre en az 6 karakter olmalı'); return; }
                if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Yeni şifreler eşleşmiyor'); return; }
                setPasswordLoading(true);
                try {
                  await api.put('/auth/change-password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
                  toast.success('Şifreniz başarıyla güncellendi');
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Şifre güncellenemedi');
                } finally { setPasswordLoading(false); }
              }} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Şifre</label>
                  <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre</label>
                  <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="En az 6 karakter" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre (Tekrar)</label>
                  <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={passwordLoading} className="btn-primary py-2 px-6 disabled:opacity-50">
                  {passwordLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
