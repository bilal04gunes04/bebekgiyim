import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/products/ProductCard';
import ProductFilters from '../components/products/ProductFilters';
import Pagination from '../components/ui/Pagination';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { SlidersHorizontal, Grid3X3, LayoutList } from 'lucide-react';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    size: '',
    color: '',
    sort: 'newest',
  });

  const page = parseInt(searchParams.get('page')) || 1;
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const tag = searchParams.get('tag');
  const brand = searchParams.get('brand');

  const { data: productsData, isLoading } = useQuery(
    ['products', { page, category, search, tag, brand, ...filters }],
    () => productService.getProducts({
      page,
      limit: 24,
      category,
      search,
      tag,
      brand,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      size: filters.size || undefined,
      color: filters.color || undefined,
      sort: filters.sort,
    }),
    { keepPreviousData: true }
  );

  const { data: categoriesData } = useQuery('categories', () => categoryService.getCategories());

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setSearchParams(prev => {
      prev.set('page', '1');
      return prev;
    });
  };

  const handleClearFilters = () => {
    setFilters({ minPrice: '', maxPrice: '', size: '', color: '', sort: 'newest' });
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => {
      prev.set('page', String(newPage));
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const products = productsData?.data?.data || [];
  const pagination = productsData?.data?.pagination;

  const getPageTitle = () => {
    if (search) return `"${search}" için arama sonuçları`;
    if (tag === 'yeni-sezon') return 'Yeni Sezon';
    if (tag === 'indirim') return 'İndirimli Ürünler';
    if (category) {
      const cat = categoriesData?.data?.data?.find(c => c.slug === category);
      return cat?.name || 'Ürünler';
    }
    return 'Tüm Ürünler';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{getPageTitle()}</h1>
        <p className="text-gray-500 mt-1">
          {pagination?.total ? `${pagination.total} ürün bulundu` : ''}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtreler
          </button>
          {showMobileFilters && (
            <div className="mt-4">
              <ProductFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="newest">En Yeni</option>
                <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                <option value="popular">En Çok Satan</option>
                <option value="rating">En Yüksek Puan</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <LayoutList className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Ürün bulunamadı.</p>
              <button onClick={handleClearFilters} className="mt-4 text-primary-500 hover:underline">
                Filtreleri temizle
              </button>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
