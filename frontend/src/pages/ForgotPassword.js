import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Mail, Baby, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Lütfen e-posta adresinizi girin');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (error) {
      // Güvenlik nedeniyle backend her durumda başarılı mesajı döndürür,
      // ancak ağ hatası gibi durumlarda kullanıcıyı bilgilendirelim.
      toast.error(error.response?.data?.message || 'Bir hata oluştu, lütfen tekrar deneyin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-baby-lavender px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Baby className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Şifremi Unuttum</h1>
            <p className="text-gray-500 mt-1">
              {sent
                ? 'E-postanızı kontrol edin'
                : 'E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim'}
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-gray-600 mb-6">
                <strong>{email}</strong> adresine bir bağlantı gönderdik. Gelen kutunuzu (ve gerekirse spam klasörünü) kontrol edin.
              </p>
              <Link to="/giris" className="btn-primary w-full inline-block py-3">
                Girişe Dön
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50"
              >
                {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>
          )}

          <Link to="/giris" className="flex items-center justify-center gap-2 mt-6 text-gray-500 hover:text-primary-500 text-sm">
            <ArrowLeft className="w-4 h-4" /> Girişe Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
