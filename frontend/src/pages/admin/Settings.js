import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Settings, Save, Globe, DollarSign, Truck, Mail, Phone, Percent, Package, Image, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminService.getSettings();
      setSettings(response.data.data || {});
    } catch (error) {
      toast.error('Ayarlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminService.updateSettings(settings);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      toast.error('Kaydetme başarısız');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const settingGroups = [
    {
      title: 'Genel Ayarlar',
      icon: Globe,
      settings: [
        { key: 'site_name', label: 'Site Adı', type: 'text', placeholder: 'MiniModa' },
        { key: 'site_logo', label: 'Site Logosu URL', type: 'text', placeholder: '/images/logo.png' },
      ],
    },
    {
      title: 'İletişim Bilgileri',
      icon: Mail,
      settings: [
        { key: 'contact_email', label: 'İletişim E-posta', type: 'email', placeholder: 'info@minimoda.com.tr' },
        { key: 'contact_phone', label: 'İletişim Telefon', type: 'text', placeholder: '0850 123 45 67' },
      ],
    },
    {
      title: 'Kargo Ayarları',
      icon: Truck,
      settings: [
        { key: 'free_shipping_threshold', label: 'Ücretsiz Kargo Limiti (TL)', type: 'number', placeholder: '250' },
        { key: 'shipping_cost', label: 'Standart Kargo Ücreti (TL)', type: 'number', placeholder: '29.90' },
      ],
    },
    {
      title: 'Vergi & Fiyatlandırma',
      icon: Percent,
      settings: [
        { key: 'tax_rate', label: 'Varsayılan KDV Oranı (%)', type: 'number', placeholder: '18' },
        { key: 'currency', label: 'Para Birimi', type: 'text', placeholder: 'TRY' },
      ],
    },
    {
      title: 'Ürün Listeleme',
      icon: Package,
      settings: [
        { key: 'items_per_page', label: 'Sayfa Başına Ürün Sayısı', type: 'number', placeholder: '24' },
      ],
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      <div className="grid gap-6">
        {settingGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.title} className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <GroupIcon className="w-5 h-5 text-primary-500" />
                {group.title}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {group.settings.map((setting) => (
                  <div key={setting.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {setting.label}
                    </label>
                    <input
                      type={setting.type}
                      value={settings[setting.key] || ''}
                      onChange={(e) => {
                        const value = setting.type === 'number'
                          ? parseFloat(e.target.value) || 0
                          : e.target.value;
                        updateSetting(setting.key, value);
                      }}
                      placeholder={setting.placeholder}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Bakım Modu */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-500" />
            Sistem Durumu
          </h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Bakım Modu</p>
              <p className="text-sm text-gray-500">Siteyi bakım moduna alır</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance_mode === true}
                onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
