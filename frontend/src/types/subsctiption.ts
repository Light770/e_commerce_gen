export interface SubscriptionPlan {
    id: number;
    name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
    tool_limit: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface Subscription {
    id: number;
    user_id: number;
    plan_id: number;
    stripe_subscription_id: string | null;
    status: string;
    billing_interval: string;
    start_date: string;
    end_date: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean;
    created_at: string;
    updated_at: string;
    plan?: SubscriptionPlan;
  }
  
  export interface SubscriptionSummary {
    id: number;
    plan_name: string;
    status: string;
    billing_interval: string;
    start_date: string;
    end_date: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean;
  }
  
  export interface CheckoutSessionRequest {
    plan_id: number;
    billing_interval: 'monthly' | 'yearly';
    success_url?: string;
    cancel_url?: string;
  }
  
  export interface CheckoutSessionResponse {
    checkout_url: string;
  }
  
  export interface BillingPortalRequest {
    return_url?: string;
  }
  
  export interface BillingPortalResponse {
    portal_url: string;
  }
  
  export interface ToolAccess {
    has_access: boolean;
    reason: string | null;
    remaining_uses: number | 'unlimited';
  }
  
  export interface ToolUsageStat {
    tool_id: number;
    tool_name: string;
    usage_count: number;
    limit: number | 'Unlimited';
    remaining: number | 'Unlimited';
    is_premium: boolean;
  }
  
  export interface UsageStats {
    subscription: {
      plan: string;
      status: string;
      renewal_date: string | null;
    };
    usage_this_month: ToolUsageStat[];
    total_usage_count: number;
  }