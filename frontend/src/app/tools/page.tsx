'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/apiService';
import { Tool } from '@/types/tool';
import Link from 'next/link';

export default function ToolsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
        } finally {
          setIsLoading(false);
        }
      };

      fetchTools();
    }
  }, [isAuthenticated]);

  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (categoryFilter === 'all') return matchesSearch;
    return matchesSearch && tool.icon === categoryFilter;
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
          <h1 className="text-2xl font-semibold text-secondary-900">Tools</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
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
                  <Link 
                    key={tool.id} 
                    href={tool.name === 'Production Checklist' ? '/tools/production-checklist' : `/tools/${tool.id}`} 
                    className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                        {getToolIcon(tool.icon)}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-secondary-900">{tool.name}</h3>
                        <p className="mt-1 text-sm text-secondary-500 line-clamp-3">{tool.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Use Tool
                      </span>
                    </div>
                  </Link>
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

const getToolIcon = (iconName: string) => {
  switch (iconName) {
    case 'chart-bar':
      return (
        <svg
          className="h-6 w-6 text-primary-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    case 'file-text':
      return (
        <svg
          className="h-6 w-6 text-primary-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'image':
      return (
        <svg
          className="h-6 w-6 text-primary-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="h-6 w-6 text-primary-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      );
  }
};
