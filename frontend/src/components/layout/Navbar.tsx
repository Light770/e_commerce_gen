'use client';

import React, { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Get the user's plan to display
  const currentPlan = user?.active_subscription?.plan_name || 'Free';
  const isFreePlan = !user?.active_subscription || currentPlan === 'Free';

  return (
    <nav className="bg-white border-b border-secondary-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center lg:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={toggleSidebar}
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="h-6 w-6"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
            <div className="hidden lg:flex lg:items-center lg:ml-6">
              <span className="text-2xl font-bold text-primary-600">ToolHub</span>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Display subscription plan badge */}
            <div className="mr-4">
              <Link 
                href="/pricing"
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  isFreePlan 
                    ? 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200' 
                    : 'bg-primary-100 text-primary-800 hover:bg-primary-200'
                }`}
              >
                {isFreePlan ? 'Free Plan' : currentPlan}
                {isFreePlan && (
                  <span className="ml-1 text-primary-600">
                    ↗ Upgrade
                  </span>
                )}
              </Link>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Profile dropdown */}
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                    </div>
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none z-10">
                    <Menu.Item>
                      {({ active }) => (
                        <div className="px-4 py-2 text-sm text-secondary-700">
                          <p className="font-medium">{user?.full_name || 'User'}</p>
                          <p className="text-secondary-500 truncate">{user?.email}</p>
                        </div>
                      )}
                    </Menu.Item>
                    <hr className="my-1 border-secondary-200" />
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile"
                          className={`${
                            active ? 'bg-secondary-100' : ''
                          } block px-4 py-2 text-sm text-secondary-700`}
                        >
                          Your Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile?tab=subscription"
                          className={`${
                            active ? 'bg-secondary-100' : ''
                          } block px-4 py-2 text-sm text-secondary-700`}
                        >
                          Subscription
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/pricing"
                          className={`${
                            active ? 'bg-secondary-100' : ''
                          } block px-4 py-2 text-sm text-secondary-700`}
                        >
                          Pricing Plans
                        </Link>
                      )}
                    </Menu.Item>
                    <hr className="my-1 border-secondary-200" />
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => logout()}
                          className={`${
                            active ? 'bg-secondary-100' : ''
                          } block w-full text-left px-4 py-2 text-sm text-secondary-700`}
                        >
                          Logout
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};