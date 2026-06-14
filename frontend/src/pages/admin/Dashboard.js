import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Users, Package, ShoppingBag, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ImageOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminService.getDashboard();
      setStats(response.data.data);
    } catch (error) {
      console.error('Dashboard yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;
  if (!stats) return <div className="text-center py-20">Veri yüklenemedi</div>;

  const statCards = [
    { title: 'Toplam Müşteri', value: stats.stats.total_customers, icon: Users, color: 'bg-blue-500', change: '+12%' },
    { title: 'Toplam Ürün', value: stats.stats.total_products, icon: Package, color: 'bg-green-500', change: '+5%' },
    { title: 'Toplam Sipariş', value: stats.stats.total_orders, icon: ShoppingBag, color: 'bg-purple-500', change: '+8%' },
    { title: 'Toplam Gelir', value: `${Number(stats.stats.total_revenue).toLocaleString('tr-TR')} TL`, icon: DollarSign, color: 'bg-primary-500', change: '+15%' },
  ];

  const dailySales = stats.dailySales?.map(d => ({
    date: new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    revenue: Number(d.revenue),
    orders: Number(d.order_count),
  })) || [];

  const recentOrders = stats.recentOrders || [];
  const topProducts = stats.topProducts || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color} text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className={`text-sm font-medium flex items-center gap-1 ${card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {card.change.startsWith('+') ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {card.change}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{card.title}</p>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Grafik */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Günlük Satışlar</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${Number(value).toLocaleString('tr-TR')} TL`, 'Gelir']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Son Siparişler */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Son Siparişler</h2>
          <div className="space-y-4">
            {recentOrders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{order.order_number}</p>
                  <p className="text-xs text-gray-500">{order.first_name} {order.last_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600 text-sm">{order.total_amount} TL</p>
                  <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status === 'pending' ? 'Bekliyor' : order.status === 'delivered' ? 'Teslim' : 'İşleniyor'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* En Çok Satanlar */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4">En Çok Satan Ürünler</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {topProducts.slice(0, 5).map(product => (
            <div key={product.id} className="text-center">
              <div className="w-full aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-8 h-8 text-gray-300" /></div>
                )}
              </div>
              <p className="text-sm font-medium line-clamp-2">{product.name}</p>
              <p className="text-xs text-gray-500">{product.sold_count} satış</p>
              <p className="text-sm font-bold text-primary-600">{product.sale_price || product.base_price} TL</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
