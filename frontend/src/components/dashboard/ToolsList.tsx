import React from 'react';
import Link from 'next/link';
import { Tool } from '@/types/tool';

interface ToolsListProps {
  tools: Tool[];
  isLoading: boolean;
}

const ToolsList: React.FC<ToolsListProps> = ({ tools, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-secondary-200">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index}>
              <div className="px-4 py-4 sm:px-6">
                <div className="w-2/3 h-5 bg-secondary-200 animate-pulse rounded mb-3"></div>
                <div className="w-full h-3 bg-secondary-100 animate-pulse rounded mb-2"></div>
                <div className="w-5/6 h-3 bg-secondary-100 animate-pulse rounded"></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
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
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-secondary-900">No tools available</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Contact an administrator to get access to tools.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-secondary-200">
        {tools.map((tool) => (
          <li key={tool.id}>
            <Link 
              href={tool.name === 'Production Checklist' ? '/tools/production-checklist' : `/tools/${tool.id}`}
              className="block hover:bg-secondary-50"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-2">
                    {getToolIcon(tool.icon)}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-secondary-900">{tool.name}</h3>
                    <p className="text-sm text-secondary-500 line-clamp-2">{tool.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {tools.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-secondary-200 text-right sm:px-6">
          <Link
            href="/tools"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            View all tools
          </Link>
        </div>
      )}
    </div>
  );
};

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

export default ToolsList;
