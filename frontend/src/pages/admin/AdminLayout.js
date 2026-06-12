import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import AdminSidebar from '../../components/layout/AdminSidebar';

export default function AdminLayout() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/giris" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
