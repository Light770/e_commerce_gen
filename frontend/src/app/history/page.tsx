'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/apiService';
import { ToolUsage } from '@/types/tool';
import Link from 'next/link';

export default function HistoryPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<ToolUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivityHistory(currentPage);
    }
  }, [isAuthenticated, currentPage]);

  const fetchActivityHistory = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await apiService.get<{data: ToolUsage[], total: number, pages: number}>(
        `/users/me/activity?page=${page}&limit=${itemsPerPage}`
      );
      
      setActivities(response.data.data || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Error fetching activity history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
          <h1 className="text-2xl font-semibold text-secondary-900">Activity History</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {isLoading ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-secondary-200">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <li key={index} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="w-1/3 h-4 bg-secondary-200 animate-pulse rounded"></div>
                        <div className="w-1/4 h-4 bg-secondary-200 animate-pulse rounded"></div>
                      </div>
                      <div className="mt-2">
                        <div className="w-2/3 h-3 bg-secondary-100 animate-pulse rounded"></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-secondary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-secondary-900">No activity yet</h3>
                <p className="mt-1 text-sm text-secondary-500">Get started by using one of our tools.</p>
                <div className="mt-6">
                  <Link
                    href="/tools"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Browse Tools
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-secondary-200">
                  {activities.map((activity) => (
                    <li key={activity.id}>
                      <Link 
                        href={`/history/${activity.id}`}
                        className="block hover:bg-secondary-50"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary-600 truncate">
                              {activity.tool?.name || 'Unknown Tool'}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <StatusBadge status={activity.status} />
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-secondary-500">
                                {formatDate(activity.started_at)}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-secondary-500 sm:mt-0">
                              <svg
                                className="flex-shrink-0 mr-1.5 h-5 w-5 text-secondary-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p>
                                {activity.completed_at
                                  ? `Completed ${formatDate(activity.completed_at)}`
                                  : 'In progress'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-secondary-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md ${
                          currentPage === 1
                            ? 'bg-secondary-100 text-secondary-400'
                            : 'bg-white text-secondary-700 hover:bg-secondary-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? 'bg-secondary-100 text-secondary-400'
                            : 'bg-white text-secondary-700 hover:bg-secondary-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-secondary-700">
                          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, activities.length)}
                          </span>{' '}
                          of <span className="font-medium">{activities.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-secondary-300 bg-white text-sm font-medium ${
                              currentPage === 1
                                ? 'text-secondary-300'
                                : 'text-secondary-500 hover:bg-secondary-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => handlePageChange(i + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === i + 1
                                  ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                  : 'bg-white border-secondary-300 text-secondary-500 hover:bg-secondary-50'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-secondary-300 bg-white text-sm font-medium ${
                              currentPage === totalPages
                                ? 'text-secondary-300'
                                : 'text-secondary-500 hover:bg-secondary-50'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let backgroundColor = '';
  let textColor = '';
  
  switch (status) {
    case 'COMPLETED':
      backgroundColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'FAILED':
      backgroundColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'IN_PROGRESS':
      backgroundColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    default:
      backgroundColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
  }
  
  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${backgroundColor} ${textColor}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};