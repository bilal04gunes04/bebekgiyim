import React from 'react';
import { Link } from 'react-router-dom';
import { Baby, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marka */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Baby className="w-8 h-8 text-primary-400" />
              <span className="text-2xl font-bold">Mini<span className="text-primary-400">Moda</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              2010'dan beri bebek ve çocuk giyiminde kalite ve şıklığı bir araya getiriyoruz. 
              %100 organik pamuk, cilt dostu kumaşlar.
            </p>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Hızlı Linkler</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/urunler?category=bebek-giyim" className="hover:text-primary-400 transition">Bebek Giyim</Link></li>
              <li><Link to="/urunler?category=kiz-cocuk" className="hover:text-primary-400 transition">Kız Çocuk</Link></li>
              <li><Link to="/urunler?category=erkek-cocuk" className="hover:text-primary-400 transition">Erkek Çocuk</Link></li>
              <li><Link to="/urunler?tag=yeni-sezon" className="hover:text-primary-400 transition">Yeni Sezon</Link></li>
              <li><Link to="/urunler?tag=indirim" className="hover:text-primary-400 transition">İndirim</Link></li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Kurumsal</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/sayfa/hakkimizda" className="hover:text-primary-400 transition">Hakkımızda</Link></li>
              <li><Link to="/sayfa/iletisim" className="hover:text-primary-400 transition">İletişim</Link></li>
              <li><Link to="/sayfa/kargo-ve-iade" className="hover:text-primary-400 transition">Kargo & İade</Link></li>
              <li><Link to="/sayfa/gizlilik-politikasi" className="hover:text-primary-400 transition">Gizlilik Politikası</Link></li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Bize Ulaşın</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>0850 123 45 67</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>info@minimoda.com.tr</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary-400 mt-1" />
                <span>İstanbul, Türkiye</span>
              </li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-primary-500 transition"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-primary-500 transition"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-primary-500 transition"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>© 2026 MiniModa. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
