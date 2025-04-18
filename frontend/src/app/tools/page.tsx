'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/apiService';
import Link from 'next/link';
import ToolCard from '@/components/tools/ToolCard';
import { toast } from 'react-hot-toast';

interface Tool {
  id: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  access: {
    has_access: boolean;
    reason: string | null;
    remaining_uses: number | "unlimited";
  };
}

export default function ToolsPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [premiumFilter, setPremiumFilter] = useState<'all' | 'free' | 'premium'>('all');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchTools = async () => {
        try {
          setIsLoading(true);
          const response = await apiService.get('/tools');
          setTools(response.data || []);
        } catch (error) {
          console.error('Error fetching tools:', error);
          toast.error('Failed to load tools');
        } finally {
          setIsLoading(false);
        }
      };

      fetchTools();
    }
  }, [isAuthenticated]);

  const filteredTools = tools.filter((tool) => {
    // Search filter
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || tool.icon === categoryFilter;
    
    // Premium filter
    const matchesPremium = 
      premiumFilter === 'all' || 
      (premiumFilter === 'premium' && tool.is_premium) || 
      (premiumFilter === 'free' && !tool.is_premium);
    
    return matchesSearch && matchesCategory && matchesPremium;
  });

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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-secondary-900">Tools</h1>
            <Link 
              href="/pricing" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {/* Current Plan Banner */}
            <div className="mb-6 bg-secondary-50 rounded-lg p-4 border border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-700">
                    Current Plan: <span className="font-semibold text-primary-600">
                      {user?.active_subscription?.plan_name || 'Free'}
                    </span>
                  </p>
                  {!user?.active_subscription && (
                    <p className="text-xs text-secondary-500 mt-1">
                      Free plan has limited access to premium tools. 
                      <Link href="/pricing" className="ml-1 text-primary-600 hover:text-primary-500">
                        Upgrade for full access
                      </Link>
                    </p>
                  )}
                </div>
                {user?.active_subscription && (
                  <Link 
                    href="/profile?tab=subscription" 
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Manage Subscription
                  </Link>
                )}
              </div>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search tools..."
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="chart-bar">Data Analysis</option>
                  <option value="file-text">Text Processing</option>
                  <option value="image">Image Editing</option>
                </select>
              </div>
              <div>
                <select
                  className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={premiumFilter}
                  onChange={(e) => setPremiumFilter(e.target.value as 'all' | 'free' | 'premium')}
                >
                  <option value="all">All Tools</option>
                  <option value="free">Free Tools</option>
                  <option value="premium">Premium Tools</option>
                </select>
              </div>
            </div>

            {/* Tools Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white shadow rounded-lg p-6 animate-pulse">
                    <div className="h-10 w-10 bg-secondary-200 rounded-md mb-4"></div>
                    <div className="h-6 bg-secondary-200 w-3/4 mb-3 rounded"></div>
                    <div className="h-4 bg-secondary-100 w-full mb-2 rounded"></div>
                    <div className="h-4 bg-secondary-100 w-5/6 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    id={tool.id}
                    name={tool.name}
                    description={tool.description}
                    icon={tool.icon}
                    isPremium={tool.is_premium}
                    access={{
                      hasAccess: tool.access.has_access,
                      reason: tool.access.reason,
                      remainingUses: tool.access.remaining_uses
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-secondary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-secondary-900">No tools found</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}