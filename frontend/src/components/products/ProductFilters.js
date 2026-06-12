import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

const sizeOptions = ['0-3 Ay', '3-6 Ay', '6-9 Ay', '9-12 Ay', '1-2 Yaş', '2-3 Yaş', '3-4 Yaş', '4-5 Yaş', '5-6 Yaş', 'XS', 'S', 'M', 'L', 'XL'];
const colorOptions = ['Beyaz', 'Siyah', 'Mavi', 'Pembe', 'Kırmızı', 'Sarı', 'Yeşil', 'Mor', 'Turuncu', 'Gri', 'Kahverengi', 'Lacivert'];

export default function ProductFilters({ filters, onFilterChange, onClearFilters }) {
  const [openSections, setOpenSections] = useState({ price: true, size: true, color: true });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.size || filters.color;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filtreler</h3>
        {hasActiveFilters && (
          <button onClick={onClearFilters} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
            <X className="w-4 h-4" /> Temizle
          </button>
        )}
      </div>

      {/* Fiyat */}
      <div className="border-b pb-4 mb-4">
        <button onClick={() => toggleSection('price')} className="flex items-center justify-between w-full py-2">
          <span className="font-medium">Fiyat Aralığı</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${openSections.price ? 'rotate-180' : ''}`} />
        </button>
        {openSections.price && (
          <div className="mt-2 space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Beden */}
      <div className="border-b pb-4 mb-4">
        <button onClick={() => toggleSection('size')} className="flex items-center justify-between w-full py-2">
          <span className="font-medium">Beden</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${openSections.size ? 'rotate-180' : ''}`} />
        </button>
        {openSections.size && (
          <div className="mt-2 flex flex-wrap gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size}
                onClick={() => onFilterChange('size', filters.size === size ? '' : size)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  filters.size === size
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Renk */}
      <div>
        <button onClick={() => toggleSection('color')} className="flex items-center justify-between w-full py-2">
          <span className="font-medium">Renk</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${openSections.color ? 'rotate-180' : ''}`} />
        </button>
        {openSections.color && (
          <div className="mt-2 flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => onFilterChange('color', filters.color === color ? '' : color)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  filters.color === color
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
