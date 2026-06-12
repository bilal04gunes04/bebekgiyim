import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ChevronRight, FileText } from 'lucide-react';

export default function Page() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/pages/${slug}`);
      setPage(response.data.data);
    } catch (error) {
      setError('Sayfa bulunamadı');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;
  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Sayfa Bulunamadı</h2>
      <p className="text-gray-500 mb-6">Aradığınız sayfa mevcut değil.</p>
      <Link to="/" className="btn-primary">Ana Sayfaya Dön</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-500">Ana Sayfa</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800">{page.title}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{page.title}</h1>
        <div 
          className="prose prose-lg max-w-none text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  );
}
