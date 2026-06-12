import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import { Search, Plus, Edit2, Trash2, Eye, Package, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', basePrice: '', salePrice: '', categoryId: '', brandId: '', stockQuantity: '', sku: '', isFeatured: false, isNewArrival: false, isActive: true
  });

  useEffect(() => {
    fetchProducts();
  }, [page, status, search]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 20, search: search || undefined, status: status !== 'all' ? status : undefined };
      const response = await adminService.getAllProducts(params);
      setProducts(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await adminService.deleteProduct(id);
      toast.success('Ürün silindi');
      fetchProducts();
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await adminService.updateProduct(editingProduct.id, formData);
        toast.success('Ürün güncellendi');
      } else {
        await adminService.createProduct(formData);
        toast.success('Ürün oluşturuldu');
      }
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      basePrice: product.base_price,
      salePrice: product.sale_price || '',
      categoryId: product.category_id || '',
      brandId: product.brand_id || '',
      stockQuantity: product.stock_quantity,
      sku: product.sku || '',
      isFeatured: product.is_featured,
      isNewArrival: product.is_new_arrival,
      isActive: product.is_active,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', basePrice: '', salePrice: '', categoryId: '', brandId: '', stockQuantity: '', sku: '', isFeatured: false, isNewArrival: false, isActive: true });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Ürünler</h1>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Yeni Ürün
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">Tümü</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="low_stock">Düşük Stok</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Ürün</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Fiyat</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Stok</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Kategori</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Durum</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                            {product.primary_image ? (
                              <img src={product.primary_image} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : '👕'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.sku || 'SKU yok'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-primary-600">{product.sale_price || product.base_price} TL</p>
                        {product.sale_price && <p className="text-xs text-gray-400 line-through">{product.base_price} TL</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${product.stock_quantity <= 10 ? 'text-red-500' : 'text-green-600'}`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && (
              <div className="p-4 border-t">
                <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-6">{editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Ürün Adı</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Açıklama</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg h-24 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fiyat</label>
                  <input type="number" step="0.01" value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">İndirimli Fiyat</label>
                  <input type="number" step="0.01" value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stok</label>
                  <input type="number" value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="col-span-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})} />
                    <span className="text-sm">Öne Çıkan</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isNewArrival} onChange={(e) => setFormData({...formData, isNewArrival: e.target.checked})} />
                    <span className="text-sm">Yeni Gelen</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} />
                    <span className="text-sm">Aktif</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary py-2">{editingProduct ? 'Güncelle' : 'Oluştur'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-outline py-2">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
