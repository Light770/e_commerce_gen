'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    // Reset loading state after a short delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-secondary-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h2 className="mt-6 text-3xl font-extrabold text-secondary-900">
          Subscription Successful!
        </h2>
        
        <p className="mt-2 text-md text-secondary-600">
          Thank you for subscribing to our service. Your subscription has been activated and you now have access to all the features included in your plan.
        </p>
        
        <div className="mt-8 text-center">
          <div className="inline-block bg-secondary-50 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-secondary-700">Current Plan</p>
            <p className="mt-1 text-xl font-semibold text-primary-600">
              {user?.active_subscription?.plan_name || 'Loading...'}
            </p>
          </div>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/dashboard"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/tools"
            className="w-full flex justify-center py-2 px-4 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Explore Tools
          </Link>
        </div>
        
        <div className="mt-6">
          <p className="text-xs text-secondary-500">
            Need help with your subscription? <Link href="/contact" className="text-primary-600 hover:text-primary-500">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}