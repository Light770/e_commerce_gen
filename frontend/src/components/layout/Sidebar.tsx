'use client';

import React, { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  adminOnly?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.roles.includes('admin');

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (props) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          {...props}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: 'Tools',
      href: '/tools',
      icon: (props) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          {...props}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: 'Production Checklist',
      href: '/tools/production-checklist',
      icon: (props) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          {...props}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      name: 'History',
      href: '/history',
      icon: (props) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          {...props}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      name: 'Pricing',
      href: '/pricing',
      icon: (props) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          {...props}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: (props) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          {...props}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: (props) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          {...props}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      adminOnly: true,
    },
  ];

  // Render the subscription badge in sidebar
  const SubscriptionBadge = () => {
    const planName = user?.active_subscription?.plan_name || 'Free';
    const bgColor = planName === 'Free' ? 'bg-secondary-100' : 'bg-primary-100';
    const textColor = planName === 'Free' ? 'text-secondary-800' : 'text-primary-800';
    
    return (
      <div className={`px-3 py-2 rounded-md ${bgColor} ${textColor} mb-4 text-sm`}>
        <div className="font-medium">Current Plan: {planName}</div>
        {planName === 'Free' && (
          <div className="mt-1 text-xs">
            <Link href="/pricing" className="text-primary-600 font-medium">
              Upgrade for full access →
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 flex z-40 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-secondary-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <svg
                      className="h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <span className="text-2xl font-bold text-primary-600">
                    ToolHub
                  </span>
                </div>
                <div className="px-4 mt-4">
                  <SubscriptionBadge />
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navigation
                    .filter((item) => !item.adminOnly || (item.adminOnly && isAdmin))
                    .map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          pathname === item.href
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                        } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                      >
                        <item.icon
                          className={`${
                            pathname === item.href
                              ? 'text-primary-600'
                              : 'text-secondary-400 group-hover:text-secondary-500'
                          } mr-4 h-6 w-6`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                </nav>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 border-r border-secondary-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <span className="text-2xl font-bold text-primary-600">
                  ToolHub
                </span>
              </div>
              <div className="px-4 mt-4">
                <SubscriptionBadge />
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation
                  .filter((item) => !item.adminOnly || (item.adminOnly && isAdmin))
                  .map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        pathname === item.href
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <item.icon
                        className={`${
                          pathname === item.href
                            ? 'text-primary-600'
                            : 'text-secondary-400 group-hover:text-secondary-500'
                        } mr-3 h-6 w-6`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-secondary-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                      {user?.full_name
                        ? user.full_name.charAt(0).toUpperCase()
                        : user?.email.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-700 group-hover:text-secondary-900">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs font-medium text-secondary-500 group-hover:text-secondary-700 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;