'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function SubscriptionCancelPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-secondary-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
          <svg
            className="h-6 w-6 text-yellow-600"
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
        </div>
        
        <h2 className="mt-6 text-3xl font-extrabold text-secondary-900">
          Subscription Cancelled
        </h2>
        
        <p className="mt-2 text-md text-secondary-600">
          Your subscription process was cancelled. No changes have been made to your account.
        </p>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/pricing"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            View Pricing Plans
          </Link>
          
          <Link
            href="/dashboard"
            className="w-full flex justify-center py-2 px-4 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Return to Dashboard
          </Link>
        </div>
        
        <div className="mt-6">
          <p className="text-xs text-secondary-500">
            Having trouble? <Link href="/contact" className="text-primary-600 hover:text-primary-500">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}