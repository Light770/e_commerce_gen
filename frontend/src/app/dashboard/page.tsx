'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentActivity from '@/components/dashboard/RecentActivity';
import ToolsList from '@/components/dashboard/ToolsList';
import { apiService } from '@/services/apiService';
import { Tool } from '@/types/tool';

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    totalTools: 0,
    completedTools: 0,
    inProgressTools: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchDashboardData = async () => {
        try {
          setIsLoading(true);
          
          // Fetch tools
          const toolsResponse = await apiService.get<{ data: Tool[] }>('/tools');
          setTools(toolsResponse.data.data || []);
          
          // Fetch recent activity
          const activityResponse = await apiService.get('/users/me/activity');
          setRecentActivity(activityResponse.data.data || []);
          
          // Fetch stats
          const statsResponse = await apiService.get('/users/me/stats');
          setStats(statsResponse.data || {
            totalTools: 0,
            completedTools: 0,
            inProgressTools: 0,
          });
          
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-secondary-900">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="mb-8">
              <DashboardStats stats={stats} isLoading={isLoading} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <h2 className="text-lg font-medium text-secondary-900 mb-4">Recent Activity</h2>
                <RecentActivity activity={recentActivity} isLoading={isLoading} />
              </div>
              <div>
                <h2 className="text-lg font-medium text-secondary-900 mb-4">Available Tools</h2>
                <ToolsList tools={tools} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}