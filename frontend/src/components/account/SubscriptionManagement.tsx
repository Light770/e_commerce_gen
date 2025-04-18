import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { subscriptionService } from '@/services/subscriptionService';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface SubscriptionManagementProps {
  user: User;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const router = useRouter();

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleBillingPortal = async () => {
    try {
      setIsLoading(true);
      const response = await subscriptionService.createBillingPortal();
      window.location.href = response.portal_url;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      toast.error('Failed to access billing portal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      await subscriptionService.cancelSubscription(true);
      setShowCancelModal(false);
      toast.success('Your subscription has been cancelled. You will have access until the end of your billing period.');
      // Refresh the page to update subscription status
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  // Free plan or no subscription
  if (!user.active_subscription || user.active_subscription.plan_name === 'Free') {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-secondary-900">Subscription</h3>
          <div className="mt-2 max-w-xl text-sm text-secondary-500">
            <p>You are currently on the Free plan with limited access to premium features.</p>
          </div>
          <div className="mt-5">
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
            >
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-secondary-900">Subscription</h3>
        
        <div className="mt-5 border-t border-secondary-200">
          <dl className="divide-y divide-secondary-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-secondary-500">Current Plan</dt>
              <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                <span className="font-medium text-primary-600">{user.active_subscription.plan_name}</span>
              </dd>
            </div>
            
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-secondary-500">Status</dt>
              <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.active_subscription.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : user.active_subscription.status === 'past_due'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.active_subscription.status.charAt(0).toUpperCase() + user.active_subscription.status.slice(1)}
                </span>
                {user.active_subscription.cancel_at_period_end && (
                  <span className="ml-2 text-xs text-red-600">
                    (Cancels at end of billing period)
                  </span>
                )}
              </dd>
            </div>
            
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-secondary-500">Billing Cycle</dt>
              <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                {user.active_subscription.billing_interval === 'monthly' ? 'Monthly' : 'Yearly'}
              </dd>
            </div>
            
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-secondary-500">Started On</dt>
              <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                {formatDate(user.active_subscription.start_date)}
              </dd>
            </div>
            
            {user.active_subscription.end_date && (
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-secondary-500">Ends On</dt>
                <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                  {formatDate(user.active_subscription.end_date)}
                </dd>
              </div>
            )}
            
            {user.active_subscription.trial_end && (
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-secondary-500">Trial Ends</dt>
                <dd className="mt-1 text-sm text-secondary-900 sm:mt-0 sm:col-span-2">
                  {formatDate(user.active_subscription.trial_end)}
                </dd>
              </div>
            )}
          </dl>
        </div>
        
        <div className="mt-5 flex">
          <button
            type="button"
            onClick={handleBillingPortal}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Manage Billing'
            )}
          </button>
          
          {user.active_subscription.status === 'active' && !user.active_subscription.cancel_at_period_end && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="ml-3 inline-flex items-center px-4 py-2 border border-secondary-300 shadow-sm text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
            >
              Cancel Subscription
            </button>
          )}
          
          {user.active_subscription.cancel_at_period_end && (
            <Link
              href="/pricing"
              className="ml-3 inline-flex items-center px-4 py-2 border border-secondary-300 shadow-sm text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
            >
              Reactivate
            </Link>
          )}
        </div>
      </div>
      
      {/* Cancel subscription modal */}
      {showCancelModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-secondary-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-secondary-900">
                    Cancel Subscription
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-secondary-500">
                      Are you sure you want to cancel your subscription? You will still have access to your current plan until the end of your billing period on {formatDate(user.active_subscription.end_date || user.active_subscription.start_date)}.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleCancelSubscription}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-secondary-700 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setShowCancelModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}