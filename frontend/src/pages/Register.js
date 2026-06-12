import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, Lock, Phone, Eye, EyeOff, Baby, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Tüm zorunlu alanları doldurun');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }
    if (!agreeTerms) {
      toast.error('Kullanım koşullarını kabul etmelisiniz');
      return;
    }

    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });

    if (result.success) {
      toast.success('Kayıt başarılı! Hoş geldiniz.');
      navigate('/');
    } else {
      toast.error(result.error || 'Kayıt başarısız');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-baby-lavender px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Baby className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">MiniModa</h1>
            <p className="text-gray-500 mt-1">Yeni hesap oluşturun</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="firstName" value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Adınız"
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="lastName" value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Soyadınız"
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange}
                  placeholder="ornek@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel" name="phone" value={formData.phone}
                  onChange={handleChange}
                  placeholder="05XX XXX XX XX"
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={formData.password}
                  onChange={handleChange}
                  placeholder="En az 6 karakter"
                  className="w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre Tekrar *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Şifrenizi tekrar girin"
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded text-primary-500"
              />
              <span className="text-sm text-gray-600">
                <Link to="/sayfa/gizlilik-politikasi" className="text-primary-500 hover:underline">Kullanım koşullarını</Link> ve{' '}
                <Link to="/sayfa/gizlilik-politikasi" className="text-primary-500 hover:underline">gizlilik politikasını</Link> kabul ediyorum.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50"
            >
              {isLoading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Zaten hesabınız var mı?{' '}
            <Link to="/giris" className="text-primary-500 hover:text-primary-600 font-medium">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
