import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, Tag, Percent, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({ code: '', type: 'percentage', value: '', minPurchase: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '' });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try { const response = await adminService.getAllCoupons(); setCoupons(response.data.data || []); }
    catch (error) { toast.error('Kuponlar yüklenemedi'); }
    finally { setIsLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) { await adminService.updateCoupon(editingCoupon.id, { isActive: !editingCoupon.is_active }); toast.success('Kupon güncellendi'); }
      else { await adminService.createCoupon(formData); toast.success('Kupon oluşturuldu'); }
      setShowModal(false); setEditingCoupon(null); fetchCoupons();
    } catch (error) { toast.error('İşlem başarısız'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
    try { await adminService.deleteCoupon(id); toast.success('Kupon silindi'); fetchCoupons(); }
    catch (error) { toast.error('Silme başarısız'); }
  };

  const toggleActive = async (coupon) => {
    try { await adminService.updateCoupon(coupon.id, { isActive: !coupon.is_active }); toast.success('Durum güncellendi'); fetchCoupons(); }
    catch (error) { toast.error('Güncelleme başarısız'); }
  };

  const openCreate = () => { setEditingCoupon(null); setFormData({ code: '', type: 'percentage', value: '', minPurchase: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '' }); setShowModal(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Kuponlar</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Yeni Kupon</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <div className="col-span-full py-20"><LoadingSpinner size="lg" /></div> : (
          coupons.map(coupon => (
            <div key={coupon.id} className={`bg-white rounded-xl p-6 shadow-sm border-2 ${coupon.is_active ? 'border-transparent' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${coupon.type === 'percentage' ? 'bg-purple-100 text-purple-600' : coupon.type === 'fixed_amount' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                  {coupon.type === 'percentage' ? <Percent className="w-6 h-6" /> : coupon.type === 'fixed_amount' ? <Tag className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(coupon)} className={`p-2 rounded-lg ${coupon.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>{coupon.is_active ? <Tag className="w-4 h-4" /> : <Tag className="w-4 h-4" />}</button>
                  <button onClick={() => handleDelete(coupon.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{coupon.code}</h3>
              <p className="text-gray-600 mb-4">
                {coupon.type === 'percentage' ? `%${coupon.value} İndirim` : coupon.type === 'fixed_amount' ? `${coupon.value} TL İndirim` : 'Ücretsiz Kargo'}
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                {coupon.min_purchase > 0 && <p>Min. alışveriş: {coupon.min_purchase} TL</p>}
                {coupon.max_discount && <p>Max. indirim: {coupon.max_discount} TL</p>}
                <p>Kullanım: {coupon.usage_count} / {coupon.usage_limit || '∞'}</p>
                {coupon.start_date && <p className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(coupon.start_date).toLocaleDateString('tr-TR')} - {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString('tr-TR') : 'Süresiz'}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Yeni Kupon</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Kupon Kodu</label><input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg uppercase" required /></div>
              <div><label className="block text-sm font-medium mb-1">Tip</label><select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="percentage">Yüzde (%)</option><option value="fixed_amount">Sabit Tutar (TL)</option><option value="free_shipping">Ücretsiz Kargo</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Değer</label><input type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Min. Alışveriş</label><input type="number" value={formData.minPurchase} onChange={(e) => setFormData({...formData, minPurchase: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">Max. İndirim</label><input type="number" value={formData.maxDiscount} onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div></div>
              <div><label className="block text-sm font-medium mb-1">Kullanım Limiti</label><input type="number" value={formData.usageLimit} onChange={(e) => setFormData({...formData, usageLimit: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Sınırsız için boş bırakın" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Başlangıç</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">Bitiş</label><input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div></div>
              <div className="flex gap-3"><button type="submit" className="flex-1 btn-primary py-2">Oluştur</button><button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-outline py-2">İptal</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
