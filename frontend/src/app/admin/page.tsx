'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import AdminTabs from '@/components/admin/AdminTabs';
import AdminDashboard from '@/components/admin/AdminDashboard';
import UserManagement from '@/components/admin/UserManagement';
import ToolManagement from '@/components/admin/ToolManagement';
import SystemMonitoring from '@/components/admin/SystemMonitoring';

export default function AdminPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!user?.roles.includes('admin')) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, router, user]);

  if (loading || !isAuthenticated || !user?.roles.includes('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'tools':
        return <ToolManagement />;
      case 'system':
        return <SystemMonitoring />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-secondary-900">Admin Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-6">{renderActiveTab()}</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}