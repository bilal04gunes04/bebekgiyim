import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, FileText, Eye, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await adminService.getAllPages();
      setPages(response.data.data || []);
    } catch (error) {
      toast.error('Sayfalar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await adminService.updatePage(editingPage.id, formData);
        toast.success('Sayfa güncellendi');
      } else {
        await adminService.createPage(formData);
        toast.success('Sayfa oluşturuldu');
      }
      setShowModal(false);
      setEditingPage(null);
      fetchPages();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu sayfayı silmek istediğinize emin misiniz?')) return;
    try {
      await adminService.deletePage(id);
      toast.success('Sayfa silindi');
      fetchPages();
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  const openEdit = (page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      content: page.content || '',
      metaTitle: page.meta_title || '',
      metaDescription: page.meta_description || '',
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingPage(null);
    setFormData({ title: '', content: '', metaTitle: '', metaDescription: '' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Sayfalar</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Yeni Sayfa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Başlık</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Slug</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Meta Başlık</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Durum</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary-500" />
                        <span className="font-medium">{page.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">/{page.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{page.meta_title || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        page.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {page.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(page)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPage ? 'Sayfa Düzenle' : 'Yeni Sayfa'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Başlık *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">İçerik (HTML)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-40 resize-none font-mono text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                  placeholder="<p>İçerik...</p>"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meta Başlık (SEO)</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meta Açıklama (SEO)</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-20 resize-none focus:ring-2 focus:ring-primary-400 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary py-2">
                  {editingPage ? 'Güncelle' : 'Oluştur'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-outline py-2"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
