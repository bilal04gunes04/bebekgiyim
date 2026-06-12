import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, Grid, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', parentId: '', sortOrder: 0 });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminService.getAllCategories();
      setCategories(response.data.data || []);
    } catch (error) { toast.error('Kategoriler yüklenemedi'); }
    finally { setIsLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, formData);
        toast.success('Kategori güncellendi');
      } else {
        await adminService.createCategory(formData);
        toast.success('Kategori oluşturuldu');
      }
      setShowModal(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) { toast.error('İşlem başarısız'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    try { await adminService.deleteCategory(id); toast.success('Kategori silindi'); fetchCategories(); }
    catch (error) { toast.error('Silme başarısız'); }
  };

  const openEdit = (cat) => { setEditingCategory(cat); setFormData({ name: cat.name, description: cat.description || '', parentId: cat.parent_id || '', sortOrder: cat.sort_order }); setShowModal(true); };
  const openCreate = () => { setEditingCategory(null); setFormData({ name: '', description: '', parentId: '', sortOrder: 0 }); setShowModal(true); };

  const buildTree = (cats, parentId = null, level = 0) => {
    return cats.filter(c => c.parent_id === parentId).map(c => (
      <div key={c.id}>
        <div className={`flex items-center justify-between p-4 hover:bg-gray-50 transition ${level > 0 ? 'pl-12 border-l-2 border-gray-200' : 'border-b'}`}>
          <div className="flex items-center gap-3">
            {level > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <Grid className="w-5 h-5 text-primary-500" />
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-gray-500">/{c.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openEdit(c)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        {buildTree(cats, c.id, level + 1)}
      </div>
    ));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Kategoriler</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Yeni Kategori</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="py-20"><LoadingSpinner size="lg" /></div> : buildTree(categories)}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Kategori Adı</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Açıklama</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg h-20 resize-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Üst Kategori</label><select value={formData.parentId} onChange={(e) => setFormData({...formData, parentId: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Ana Kategori</option>{categories.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Sıralama</label><input type="number" value={formData.sortOrder} onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex gap-3"><button type="submit" className="flex-1 btn-primary py-2">{editingCategory ? 'Güncelle' : 'Oluştur'}</button><button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-outline py-2">İptal</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
