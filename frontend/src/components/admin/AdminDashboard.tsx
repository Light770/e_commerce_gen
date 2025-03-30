import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/apiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  totalTools: number;
  totalUsage: number;
}

interface UsageData {
  name: string;
  usage: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalTools: 0,
    totalUsage: 0,
  });
  const [toolUsage, setToolUsage] = useState<UsageData[]>([]);
  const [userActivity, setUserActivity] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch admin stats
        const statsResponse = await apiService.get<StatsData>('/api/admin/stats');
        setStats(statsResponse.data);
        
        // Fetch tool usage stats
        const toolUsageResponse = await apiService.get<UsageData[]>('/api/admin/tools/usage');
        setToolUsage(toolUsageResponse.data);
        
        // Fetch user activity stats
        const userActivityResponse = await apiService.get<UsageData[]>('/api/admin/users/activity');
        setUserActivity(userActivityResponse.data);
        
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdminData();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stats cards */}
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          isLoading={isLoading}
          icon={
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
        />
        
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          isLoading={isLoading}
          icon={
            <svg
              className="h-6 w-6 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        
        <StatCard
          title="Total Tools"
          value={stats.totalTools}
          isLoading={isLoading}
          icon={
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
                d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"
              />
            </svg>
          }
        />
        
        <StatCard
          title="Total Usage"
          value={stats.totalUsage}
          isLoading={isLoading}
          icon={
            <svg
              className="h-6 w-6 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          }
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tool Usage Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-secondary-900 mb-4">Tool Usage</h3>
          {isLoading ? (
            <div className="h-64 w-full bg-secondary-200 animate-pulse rounded"></div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={toolUsage}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="usage" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* User Activity Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-secondary-900 mb-4">User Activity</h3>
          {isLoading ? (
            <div className="h-64 w-full bg-secondary-200 animate-pulse rounded"></div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userActivity}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="usage" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, isLoading }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-secondary-500 truncate">{title}</dt>
            <dd>
              {isLoading ? (
                <div className="h-8 w-16 bg-secondary-200 animate-pulse rounded mt-1"></div>
              ) : (
                <div className="text-lg font-semibold text-secondary-900">{value}</div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;