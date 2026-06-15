import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, Image, Eye, EyeOff, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';

const CLOUDINARY_CLOUD = 'dvxva8bzy';
const CLOUDINARY_PRESET = 'minimoda_uploads';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState({ title: '', subtitle: '', linkUrl: '', position: 'home_main', sortOrder: 0, isActive: true, startDate: '', endDate: '', imageUrl: '' });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Lütfen bir resim dosyası seçin'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Dosya boyutu 5MB\'dan küçük olmalı'); return; }

    setImageUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', CLOUDINARY_PRESET);
      data.append('folder', 'minimoda/banners');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: result.secure_url }));
        toast.success('Görsel yüklendi!');
      } else {
        throw new Error(result.error?.message || 'Yükleme başarısız');
      }
    } catch (err) {
      toast.error('Görsel yüklenemedi: ' + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try { const response = await adminService.getAllBanners(); setBanners(response.data.data || []); }
    catch (error) { toast.error('Bannerlar yüklenemedi'); }
    finally { setIsLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) { await adminService.updateBanner(editingBanner.id, formData); toast.success('Banner güncellendi'); }
      else { await adminService.createBanner(formData); toast.success('Banner oluşturuldu'); }
      setShowModal(false); setEditingBanner(null); fetchBanners();
    } catch (error) { toast.error('İşlem başarısız'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu bannerı silmek istediğinize emin misiniz?')) return;
    try { await adminService.deleteBanner(id); toast.success('Banner silindi'); fetchBanners(); }
    catch (error) { toast.error('Silme başarısız'); }
  };

  const toggleActive = async (banner) => {
    try { await adminService.updateBanner(banner.id, { isActive: !banner.is_active }); toast.success('Durum güncellendi'); fetchBanners(); }
    catch (error) { toast.error('Güncelleme başarısız'); }
  };

  const openEdit = (banner) => { setEditingBanner(banner); setFormData({ title: banner.title || '', subtitle: banner.subtitle || '', linkUrl: banner.link_url || '', position: banner.position, sortOrder: banner.sort_order, isActive: banner.is_active, startDate: banner.start_date?.split('T')[0] || '', endDate: banner.end_date?.split('T')[0] || '', imageUrl: banner.image_url || '' }); setShowModal(true); };
  const openCreate = () => { setEditingBanner(null); setFormData({ title: '', subtitle: '', linkUrl: '', position: 'home_main', sortOrder: 0, isActive: true, startDate: '', endDate: '', imageUrl: '' }); setShowModal(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Bannerlar</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Yeni Banner</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="py-20"><LoadingSpinner size="lg" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Görsel</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Başlık</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Pozisyon</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Sıra</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Durum</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">İşlemler</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {banners.map(banner => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4"><div className="w-20 h-12 bg-gray-100 rounded-lg overflow-hidden">{banner.image_url ? <img src={banner.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-5 h-5 text-gray-400" /></div>}</div></td>
                    <td className="px-6 py-4"><p className="font-medium">{banner.title || '-'}</p><p className="text-xs text-gray-500">{banner.subtitle || ''}</p></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{banner.position}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{banner.sort_order}</td>
                    <td className="px-6 py-4"><button onClick={() => toggleActive(banner)} className={`px-2 py-1 rounded-full text-xs font-medium ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{banner.is_active ? 'Aktif' : 'Pasif'}</button></td>
                    <td className="px-6 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => openEdit(banner)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(banner.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingBanner ? 'Banner Düzenle' : 'Yeni Banner'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Başlık</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>

              <div>
                <label className="block text-sm font-medium mb-1">Banner Görseli</label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${imageUploading ? 'border-pink-300 bg-pink-50' : 'border-gray-300 hover:border-pink-400 cursor-pointer'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageUpload({ target: { files: [f] } }); }}
                  onClick={() => !imageUploading && document.getElementById('banner-cloudinary-upload').click()}
                >
                  <input id="banner-cloudinary-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {imageUploading ? (
                    <div className="py-3">
                      <div className="w-6 h-6 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-pink-600">Yükleniyor...</p>
                    </div>
                  ) : formData.imageUrl ? (
                    <div className="relative inline-block">
                      <img src={formData.imageUrl} alt="Önizleme" className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFormData(p => ({ ...p, imageUrl: '' })); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >✕</button>
                    </div>
                  ) : (
                    <div className="py-3">
                      <ImageOff className="w-8 h-8 text-gray-300 mb-1 mx-auto" />
                      <p className="text-xs text-gray-500">Tıklayın veya sürükleyip bırakın</p>
                    </div>
                  )}
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Alt Başlık</label><input type="text" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Link</label><input type="text" value={formData.linkUrl} onChange={(e) => setFormData({...formData, linkUrl: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="/urunler?category=bebek-giyim" /></div>
              <div><label className="block text-sm font-medium mb-1">Pozisyon</label><select value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="home_main">Ana Sayfa - Ana</option><option value="home_secondary">Ana Sayfa - İkincil</option><option value="category_page">Kategori Sayfası</option></select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Sıra</label><input type="number" value={formData.sortOrder} onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">Başlangıç</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div></div>
              <div><label className="block text-sm font-medium mb-1">Bitiş</label><input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} /><span className="text-sm">Aktif</span></label>
              <div className="flex gap-3"><button type="submit" className="flex-1 btn-primary py-2">{editingBanner ? 'Güncelle' : 'Oluştur'}</button><button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-outline py-2">İptal</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
