import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/apiService';

interface SystemLog {
  id: number;
  level: string;
  message: string;
  source: string;
  created_at: string;
  additional_data?: any;
}

const SystemMonitoring: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LOGS_PER_PAGE = 20;

  useEffect(() => {
    fetchLogs();
  }, [filter, page]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get<SystemLog[]>(`/admin/logs`, {
        params: {
          level: filter !== 'all' ? filter : undefined,
          skip: (page - 1) * LOGS_PER_PAGE,
          limit: LOGS_PER_PAGE,
        },
      });
      
      if (page === 1) {
        setLogs(response.data);
      } else {
        setLogs(prevLogs => [...prevLogs, ...response.data]);
      }
      
      setHasMore(response.data.length === LOGS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching system logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
    setPage(1);
  };

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  const getLogLevelBadge = (level: string) => {
    let colorClasses = '';
    
    switch (level.toUpperCase()) {
      case 'ERROR':
        colorClasses = 'bg-red-100 text-red-800';
        break;
      case 'WARNING':
        colorClasses = 'bg-yellow-100 text-yellow-800';
        break;
      case 'INFO':
        colorClasses = 'bg-blue-100 text-blue-800';
        break;
      case 'DEBUG':
        colorClasses = 'bg-green-100 text-green-800';
        break;
      default:
        colorClasses = 'bg-secondary-100 text-secondary-800';
    }
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-secondary-900">System Logs</h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="log-filter" className="text-sm font-medium text-secondary-700">
            Filter by level:
          </label>
          <select
            id="log-filter"
            value={filter}
            onChange={handleFilterChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading && page === 1 ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-secondary-500">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-secondary-900">No logs found</h3>
            <p className="mt-1 text-sm text-secondary-500">
              {filter !== 'all'
                ? `No ${filter} level logs are currently available.`
                : 'No system logs are currently available.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
                    >
                      Level
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
                    >
                      Source
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
                    >
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {getLogLevelBadge(log.level)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {log.source || 'System'}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-500">
                        <div className="max-w-lg truncate">{log.message}</div>
                        {log.additional_data && (
                          <details className="mt-1">
                            <summary className="text-xs text-primary-600 cursor-pointer">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs bg-secondary-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.additional_data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="bg-white px-4 py-3 flex items-center justify-center border-t border-secondary-200 sm:px-6">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SystemMonitoring;