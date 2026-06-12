import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  BarChart3, Calendar, Download, TrendingUp, TrendingDown,
  DollarSign, ShoppingBag, Package, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReports();
  }, [activeTab, dateRange]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'sales') {
        const response = await adminService.getSalesReport(dateRange);
        setSalesData(response.data.data || []);
      } else if (activeTab === 'inventory') {
        const response = await adminService.getInventoryReport();
        setInventoryData(response.data.data || []);
      } else if (activeTab === 'customers') {
        const response = await adminService.getCustomerReport();
        setCustomerData(response.data.data || []);
      }
    } catch (error) {
      toast.error('Rapor yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'sales', label: 'Satış Raporu', icon: DollarSign },
    { id: 'inventory', label: 'Stok Raporu', icon: Package },
    { id: 'customers', label: 'Müşteri Raporu', icon: Users },
  ];

  // Satış istatistikleri
  const totalRevenue = salesData.reduce((sum, d) => sum + Number(d.revenue), 0);
  const totalOrders = salesData.reduce((sum, d) => sum + Number(d.order_count), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Stok istatistikleri
  const lowStockCount = inventoryData.filter(i => Number(i.stock_quantity) <= 10).length;
  const outOfStockCount = inventoryData.filter(i => Number(i.stock_quantity) === 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Raporlar</h1>
        {activeTab === 'sales' && (
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        )}
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <TabIcon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div>
          {/* SATIŞ RAPORU */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Özet Kartlar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">Toplam Gelir</p>
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">
                    {totalRevenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </p>
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> Seçili dönem
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">Toplam Sipariş</p>
                    <ShoppingBag className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
                  <p className="text-sm text-blue-600 mt-1">{salesData.length} gün</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">Ortalama Sipariş</p>
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">
                    {avgOrderValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">Sipariş başına</p>
                </div>
              </div>

              {/* Grafik */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-6">Günlük Satışlar</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`${Number(value).toLocaleString('tr-TR')} TL`, 'Gelir'];
                          if (name === 'orders') return [value, 'Sipariş'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      />
                      <Bar dataKey="revenue" fill="#ec4899" radius={[4, 4, 0, 0]} name="Gelir" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sipariş Sayısı Grafiği */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-6">Günlük Sipariş Sayısı</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value) => [value, 'Sipariş Sayısı']}
                      />
                      <Line
                        type="monotone"
                        dataKey="order_count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                        name="Sipariş"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* STOK RAPORU */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Özet Kartlar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">Toplam Ürün</p>
                    <Package className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{inventoryData.length}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">Düşük Stok</p>
                    <TrendingDown className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">{lowStockCount}</p>
                  <p className="text-sm text-yellow-600 mt-1">10 veya daha az stok</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">Stok Tükendi</p>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">{outOfStockCount}</p>
                  <p className="text-sm text-red-600 mt-1">Acil sipariş gerekli</p>
                </div>
              </div>

              {/* Stok Tablosu */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-bold">Stok Durumu</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Ürün</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">SKU</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Kategori</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Stok</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Varyant Stok</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inventoryData.map((item) => {
                        const stock = Number(item.stock_quantity);
                        const variantStock = Number(item.variant_stock);
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-gray-50 transition ${
                              stock === 0 ? 'bg-red-50' : stock <= 10 ? 'bg-yellow-50' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-800">{item.name}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{item.sku || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{item.category_name || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${
                                stock === 0 ? 'text-red-600' :
                                stock <= 10 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {stock}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{variantStock}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                stock === 0 ? 'bg-red-100 text-red-800' :
                                stock <= 10 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {stock === 0 ? 'Tükendi' : stock <= 10 ? 'Düşük' : 'Yeterli'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MÜŞTERİ RAPORU */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Özet */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">Toplam Müşteri</p>
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{customerData.length}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">Aktif Müşteri</p>
                    <ShoppingBag className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">
                    {customerData.filter(c => Number(c.total_orders) > 0).length}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">Toplam Harcama</p>
                    <DollarSign className="w-5 h-5 text-primary-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">
                    {customerData.reduce((sum, c) => sum + Number(c.total_spent), 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </p>
                </div>
              </div>

              {/* Müşteri Tablosu */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-bold">Müşteri Listesi</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Müşteri</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">E-posta</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Kayıt Tarihi</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Sipariş</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Toplam Harcama</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Son Sipariş</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customerData.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary-500" />
                              </div>
                              <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">{customer.total_orders}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-primary-600">
                              {Number(customer.total_spent).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {customer.last_order_date
                              ? new Date(customer.last_order_date).toLocaleDateString('tr-TR')
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
