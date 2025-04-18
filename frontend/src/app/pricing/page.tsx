'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionPlan } from '@/types/subscription';
import { subscriptionService } from '@/services/subscriptionService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const plansData = await subscriptionService.getPlans();
        // Sort plans by price
        const sortedPlans = plansData.sort((a, b) => a.price_monthly - b.price_monthly);
        setPlans(sortedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load subscription plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: number) => {
    if (!isAuthenticated) {
      // Save the selected plan to localStorage for after login
      localStorage.setItem('selected_plan', planId.toString());
      localStorage.setItem('billing_interval', billingInterval);
      router.push('/login?redirect=/pricing');
      return;
    }

    try {
      // Create a checkout session
      const response = await subscriptionService.createCheckoutSession({
        plan_id: planId,
        billing_interval: billingInterval,
      });

      // Redirect to Stripe checkout
      window.location.href = response.checkout_url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to create checkout session');
    }
  };

  const isCurrentPlan = (planName: string) => {
    if (!user?.active_subscription) return planName === 'Free';
    return user.active_subscription.plan_name === planName;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getButtonLabel = (planName: string) => {
    if (isCurrentPlan(planName)) {
      if (planName === 'Free') return 'Current Plan';
      return 'Manage Subscription';
    }
    
    return planName === 'Free' ? 'Get Started' : 'Subscribe';
  };

  const handlePlanAction = async (plan: SubscriptionPlan) => {
    // For the current paid plan, redirect to billing portal
    if (isCurrentPlan(plan.name) && plan.name !== 'Free') {
      try {
        const response = await subscriptionService.createBillingPortal();
        window.location.href = response.portal_url;
      } catch (error) {
        console.error('Error creating billing portal session:', error);
        toast.error('Failed to access billing portal');
      }
    } else if (!isCurrentPlan(plan.name)) {
      // For other plans, start checkout
      handleSubscribe(plan.id);
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:align-center sm:flex sm:flex-col">
          <h1 className="text-5xl font-bold tracking-tight text-secondary-900 sm:text-center">Pricing Plans</h1>
          <p className="mt-5 text-xl text-secondary-500 sm:text-center">
            Choose the perfect plan for your needs
          </p>
          
          {/* Billing toggle */}
          <div className="relative mt-6 bg-secondary-100 rounded-lg p-0.5 flex self-center">
            <button
              type="button"
              className={`relative py-2 px-6 border-transparent rounded-md text-sm font-medium whitespace-nowrap ${
                billingInterval === 'monthly'
                  ? 'bg-white border-secondary-200 shadow-sm text-secondary-900'
                  : 'border border-transparent text-secondary-700'
              }`}
              onClick={() => setBillingInterval('monthly')}
            >
              Monthly billing
            </button>
            <button
              type="button"
              className={`relative py-2 px-6 border-transparent rounded-md text-sm font-medium whitespace-nowrap ${
                billingInterval === 'yearly'
                  ? 'bg-white border-secondary-200 shadow-sm text-secondary-900'
                  : 'border border-transparent text-secondary-700'
              }`}
              onClick={() => setBillingInterval('yearly')}
            >
              Annual billing
              <span className="ml-1 text-xs text-primary-600 font-bold">Save 17%</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-8 lg:grid-cols-4 lg:gap-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse rounded-lg bg-white shadow-md border border-secondary-200 p-8">
                <div className="h-8 bg-secondary-200 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-secondary-100 rounded w-1/3 mb-6"></div>
                <div className="h-4 bg-secondary-100 rounded mb-2"></div>
                <div className="h-4 bg-secondary-100 rounded mb-2"></div>
                <div className="h-4 bg-secondary-100 rounded mb-2"></div>
                <div className="h-4 bg-secondary-100 rounded mb-6"></div>
                <div className="h-10 bg-secondary-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-4 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-lg shadow-md overflow-hidden border ${
                  isCurrentPlan(plan.name)
                    ? 'border-primary-500 ring-2 ring-primary-500'
                    : 'border-secondary-200'
                }`}
              >
                <div className="p-6">
                  <h2 className="text-lg font-medium text-secondary-900">{plan.name}</h2>
                  <p className="mt-4 text-sm text-secondary-500">{plan.description}</p>
                  <p className="mt-8">
                    <span className="text-4xl font-bold text-secondary-900">
                      {formatPrice(billingInterval === 'monthly' ? plan.price_monthly : plan.price_yearly)}
                    </span>
                    <span className="text-base font-medium text-secondary-500">
                      /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </p>
                  
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-green-500"
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <p className="ml-3 text-sm text-secondary-700">{feature}</p>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-8">
                    <button
                      onClick={() => handlePlanAction(plan)}
                      disabled={isCurrentPlan(plan.name) && plan.name === 'Free'}
                      className={`w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white ${
                        isCurrentPlan(plan.name) && plan.name === 'Free'
                          ? 'bg-secondary-400 cursor-not-allowed'
                          : isCurrentPlan(plan.name)
                          ? 'bg-primary-500 hover:bg-primary-600'
                          : 'bg-primary-600 hover:bg-primary-700'
                      }`}
                    >
                      {getButtonLabel(plan.name)}
                    </button>
                  </div>
                  
                  {isCurrentPlan(plan.name) && (
                    <p className="mt-2 text-xs text-center text-primary-600">
                      Your current plan
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-secondary-900">Enterprise Plan</h3>
          <p className="mt-4 text-lg text-secondary-500 max-w-3xl mx-auto">
            Need a custom solution for your large organization? Contact our sales team for a personalized quote.
          </p>
          <div className="mt-6">
            <button
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              onClick={() => router.push('/contact')}
            >
              Contact Sales
            </button>
          </div>
        </div>

        <div className="mt-16 border-t border-secondary-200 pt-12 text-center">
          <h3 className="text-xl font-bold text-secondary-900">Frequently Asked Questions</h3>
          <div className="mt-8 max-w-3xl mx-auto grid gap-8 md:grid-cols-2">
            {/* FAQ Item 1 */}
            <div className="text-left">
              <h4 className="text-lg font-medium text-secondary-900">Can I cancel my subscription?</h4>
              <p className="mt-2 text-base text-secondary-500">
                Yes, you can cancel your subscription at any time. You will have access to your plan until the end of your billing period.
              </p>
            </div>
            
            {/* FAQ Item 2 */}
            <div className="text-left">
              <h4 className="text-lg font-medium text-secondary-900">How do I change my subscription?</h4>
              <p className="mt-2 text-base text-secondary-500">
                You can upgrade or downgrade your subscription at any time from your account dashboard.
              </p>
            </div>
            
            {/* FAQ Item 3 */}
            <div className="text-left">
              <h4 className="text-lg font-medium text-secondary-900">Is there a trial period?</h4>
              <p className="mt-2 text-base text-secondary-500">
                All paid plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            
            {/* FAQ Item 4 */}
            <div className="text-left">
              <h4 className="text-lg font-medium text-secondary-900">What payment methods do you accept?</h4>
              <p className="mt-2 text-base text-secondary-500">
                We accept all major credit cards and debit cards, including Visa, Mastercard, and American Express.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}