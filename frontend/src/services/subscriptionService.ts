import { apiService } from './apiService';
import {
  SubscriptionPlan,
  Subscription,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  BillingPortalRequest,
  BillingPortalResponse,
  UsageStats
} from '@/types/subscription';

export const subscriptionService = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiService.get<{ data: SubscriptionPlan[] }>('/subscriptions/plans');
    return response.data.data || [];
  },
  
  getCurrentSubscription: async (): Promise<Subscription> => {
    const response = await apiService.get<Subscription>('/subscriptions/my-subscription');
    return response.data;
  },
  
  createCheckoutSession: async (data: CheckoutSessionRequest): Promise<CheckoutSessionResponse> => {
    const response = await apiService.post<CheckoutSessionResponse>('/subscriptions/checkout', data);
    return response.data;
  },
  
  createBillingPortal: async (data: BillingPortalRequest = {}): Promise<BillingPortalResponse> => {
    const response = await apiService.post<BillingPortalResponse>('/subscriptions/billing-portal', data);
    return response.data;
  },
  
  cancelSubscription: async (atPeriodEnd: boolean = true): Promise<Subscription> => {
    const response = await apiService.post<Subscription>('/subscriptions/cancel', { at_period_end: atPeriodEnd });
    return response.data;
  },
  
  getUsageStats: async (): Promise<UsageStats> => {
    const response = await apiService.get<UsageStats>('/tools/usage-stats');
    return response.data;
  }
};