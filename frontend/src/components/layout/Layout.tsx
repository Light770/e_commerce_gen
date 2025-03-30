'use client';

import React, { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-secondary-50">
      {/* Sidebar for larger screens */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;