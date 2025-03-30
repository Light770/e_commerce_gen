import React from 'react';
import Link from 'next/link';
import { ToolUsage } from '@/types/tool';

interface RecentActivityProps {
  activity: ToolUsage[];
  isLoading: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activity, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-secondary-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="w-1/3 h-4 bg-secondary-200 animate-pulse rounded"></div>
                  <div className="w-1/4 h-4 bg-secondary-200 animate-pulse rounded"></div>
                </div>
                <div className="mt-2">
                  <div className="w-2/3 h-3 bg-secondary-100 animate-pulse rounded"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (activity.length === 0) {
    return (
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
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-secondary-200">
        {activity.map((item) => (
          <li key={item.id}>
            <Link 
              href={`/history/${item.id}`}
              className="block hover:bg-secondary-50"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary-600 truncate">
                    {item.tool?.name || 'Unknown Tool'}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-secondary-500">
                      {formatDate(item.started_at)}
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
                      {item.completed_at
                        ? `Completed ${formatDate(item.completed_at)}`
                        : 'In progress'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {activity.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-secondary-200 text-right sm:px-6">
          <Link
            href="/history"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            View all activity
          </Link>
        </div>
      )}
    </div>
  );
};

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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default RecentActivity;