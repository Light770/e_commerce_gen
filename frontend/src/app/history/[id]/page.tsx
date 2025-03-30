'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/apiService';
import { ToolUsage, Tool } from '@/types/tool';
import Link from 'next/link';

export default function ActivityDetailPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const activityId = params.id as string;
  
  const [activity, setActivity] = useState<ToolUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && activityId) {
      fetchActivityDetail();
    }
  }, [isAuthenticated, activityId]);

  const fetchActivityDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<ToolUsage>(
        `/users/me/activity/${activityId}`
      );
      
      setActivity(response.data);
    } catch (error: any) {
      console.error('Error fetching activity detail:', error);
      setError(error.response?.data?.detail || 'Failed to load activity details');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputData = (data: any) => {
    if (!data) return <p className="text-secondary-500">No input data available</p>;
    
    if (typeof data === 'object') {
      return (
        <div className="bg-secondary-50 p-4 rounded-md overflow-x-auto">
          <pre className="text-sm text-secondary-800">{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
    }
    
    return <p className="text-secondary-700">{String(data)}</p>;
  };

  const renderResultData = (data: any) => {
    if (!data) return <p className="text-secondary-500">No result data available</p>;
    
    if (typeof data === 'object') {
      return (
        <div className="bg-secondary-50 p-4 rounded-md overflow-x-auto">
          <pre className="text-sm text-secondary-800">{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
    }
    
    return <p className="text-secondary-700">{String(data)}</p>;
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-secondary-900">Activity Details</h1>
            <Link
              href="/history"
              className="inline-flex items-center px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5 text-secondary-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Back to History
            </Link>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {isLoading ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="h-8 w-1/3 bg-secondary-200 animate-pulse rounded mb-4"></div>
                  <div className="h-4 w-full bg-secondary-100 animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-full bg-secondary-100 animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-secondary-100 animate-pulse rounded"></div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <svg
                      className="h-6 w-6 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <h3 className="ml-2 text-lg font-medium text-secondary-900">Error</h3>
                  </div>
                  <div className="mt-2 text-sm text-secondary-500">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={fetchActivityDetail}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            ) : activity ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-secondary-900">
                        {activity.tool?.name || 'Unknown Tool'}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-secondary-500">
                        {activity.tool?.description}
                      </p>
                    </div>
                    <StatusBadge status={activity.status} />
                  </div>
                </div>
                <div className="border-t border-secondary-200">
                  <dl>
                    <div className="bg-secondary-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-secondary-500">Started At</dt>
                      <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                        {formatDate(activity.started_at)}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-secondary-500">Completed At</dt>
                      <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                        {activity.completed_at ? formatDate(activity.completed_at) : 'In progress'}
                      </dd>
                    </div>
                    <div className="bg-secondary-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-secondary-500">Status</dt>
                      <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                        {activity.status.replace('_', ' ')}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-secondary-500">Input Data</dt>
                      <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                        {renderInputData(activity.input_data)}
                      </dd>
                    </div>
                    <div className="bg-secondary-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-secondary-500">Result Data</dt>
                      <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                        {renderResultData(activity.result_data)}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {activity.status === 'COMPLETED' && (
                  <div className="px-4 py-3 bg-secondary-50 text-right sm:px-6 border-t border-secondary-200">
                    <Link
                      href={`/tools/${activity.tool_id}?reuse=${activity.id}`}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Use Same Settings Again
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-secondary-900">No activity found</h3>
                  <p className="mt-1 text-sm text-secondary-500">This activity may have been deleted or you don't have access to it.</p>
                </div>
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