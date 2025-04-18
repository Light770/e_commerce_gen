from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Subscription Plan Schemas
class SubscriptionPlanBase(BaseModel):
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    features: List[str] = []
    tool_limit: int = -1  # -1 means unlimited
    is_active: bool = True

class SubscriptionPlanCreate(SubscriptionPlanBase):
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None

class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    features: Optional[List[str]] = None
    tool_limit: Optional[int] = None
    is_active: Optional[bool] = None

class SubscriptionPlan(SubscriptionPlanBase):
    id: int
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Subscription Schemas
class SubscriptionBase(BaseModel):
    plan_id: int
    billing_interval: str = "monthly"  # monthly or yearly

class SubscriptionCreate(SubscriptionBase):
    user_id: int
    stripe_subscription_id: Optional[str] = None
    status: str = "active"
    start_date: datetime = datetime.utcnow()
    trial_end: Optional[datetime] = None

class SubscriptionUpdate(BaseModel):
    plan_id: Optional[int] = None
    stripe_subscription_id: Optional[str] = None
    status: Optional[str] = None
    billing_interval: Optional[str] = None
    end_date: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    cancel_at_period_end: Optional[bool] = None

class Subscription(SubscriptionBase):
    id: int
    user_id: int
    stripe_subscription_id: Optional[str] = None
    status: str
    start_date: datetime
    end_date: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    cancel_at_period_end: bool
    created_at: datetime
    updated_at: datetime
    plan: Optional[SubscriptionPlan] = None

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentBase(BaseModel):
    user_id: int
    amount: float
    currency: str = "USD"
    status: str = "pending"

class PaymentCreate(PaymentBase):
    subscription_id: Optional[int] = None
    stripe_payment_id: Optional[str] = None
    payment_method: Optional[str] = None
    payment_details: Optional[Dict[str, Any]] = None

class PaymentUpdate(BaseModel):
    stripe_payment_id: Optional[str] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    payment_details: Optional[Dict[str, Any]] = None

class Payment(PaymentBase):
    id: int
    subscription_id: Optional[int] = None
    stripe_payment_id: Optional[str] = None
    payment_method: Optional[str] = None
    payment_details: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Checkout and Billing Portal Schemas
class CheckoutSessionCreate(BaseModel):
    plan_id: int
    billing_interval: str = "monthly"  # monthly or yearly
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

class CheckoutSessionResponse(BaseModel):
    checkout_url: str

class BillingPortalCreate(BaseModel):
    return_url: Optional[str] = None

class BillingPortalResponse(BaseModel):
    portal_url: str

# Webhook Event Schema
class WebhookEvent(BaseModel):
    event_type: str
    data: Dict[str, Any]