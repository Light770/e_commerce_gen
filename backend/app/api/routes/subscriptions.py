from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Body
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from datetime import datetime

from app.core.security import get_current_user, get_current_active_user, get_current_admin_user
from app.db.session import get_db
from app.models.models import User, SubscriptionPlan, Subscription, Payment
from app.schemas.subscription import (
    SubscriptionPlan as SubscriptionPlanSchema,
    SubscriptionPlanCreate,
    SubscriptionPlanUpdate,
    Subscription as SubscriptionSchema,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    BillingPortalCreate,
    BillingPortalResponse,
    WebhookEvent
)
from app.utils.stripe_utils import (
    get_stripe_customer,
    create_checkout_session,
    create_billing_portal_session,
    handle_webhook_event
)
from app.core.config import settings

router = APIRouter()

# Public endpoints
@router.get("/plans", response_model=List[SubscriptionPlanSchema])
async def get_subscription_plans(
    db: Session = Depends(get_db),
) -> Any:
    """
    Get all active subscription plans.
    """
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    return plans

# User endpoints
@router.get("/my-subscription", response_model=SubscriptionSchema)
async def get_my_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get current user's active subscription.
    """
    subscription = current_user.get_active_subscription()
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found",
        )
    return subscription

@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_subscription_checkout(
    checkout_data: CheckoutSessionCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Create a checkout session for a subscription.
    """
    # Get the subscription plan
    plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == checkout_data.plan_id,
        SubscriptionPlan.is_active == True
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found",
        )
    
    # Get or create Stripe customer
    if not current_user.stripe_customer_id:
        customer = get_stripe_customer(current_user.email, current_user.full_name)
        current_user.stripe_customer_id = customer["id"]
        db.commit()
    
    # Get the price ID based on billing interval
    price_id = plan.stripe_price_id_monthly
    if checkout_data.billing_interval == "yearly":
        price_id = plan.stripe_price_id_yearly
    
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No price ID found for {checkout_data.billing_interval} billing interval",
        )
    
    # Create success and cancel URLs
    base_url = str(request.base_url)
    success_url = checkout_data.success_url or f"{settings.SUBSCRIPTION_SUCCESS_URL}?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = checkout_data.cancel_url or settings.SUBSCRIPTION_CANCEL_URL
    
    # Create checkout session
    session = create_checkout_session(
        customer_id=current_user.stripe_customer_id,
        price_id=price_id,
        success_url=success_url,
        cancel_url=cancel_url
    )
    
    return {"checkout_url": session.url}

@router.post("/billing-portal", response_model=BillingPortalResponse)
async def create_subscription_billing_portal(
    portal_data: BillingPortalCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Create a billing portal session for subscription management.
    """
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no associated Stripe customer",
        )
    
    # Get return URL
    return_url = portal_data.return_url or f"{settings.FRONTEND_URL}/dashboard"
    
    # Create billing portal session
    session = create_billing_portal_session(
        customer_id=current_user.stripe_customer_id,
        return_url=return_url
    )
    
    return {"portal_url": session.url}

@router.post("/cancel", response_model=SubscriptionSchema)
async def cancel_subscription(
    at_period_end: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Cancel the current subscription.
    """
    subscription = current_user.get_active_subscription()
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found",
        )
    
    # Update subscription in database
    subscription.cancel_at_period_end = True
    if not at_period_end:
        subscription.status = "canceled"
        subscription.end_date = datetime.utcnow()
    
    db.commit()
    db.refresh(subscription)
    
    return subscription

# Admin endpoints
@router.post("/plans", response_model=SubscriptionPlanSchema)
async def create_subscription_plan(
    plan_data: SubscriptionPlanCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Create a new subscription plan (admin only).
    """
    plan = SubscriptionPlan(**plan_data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return plan

@router.put("/plans/{plan_id}", response_model=SubscriptionPlanSchema)
async def update_subscription_plan(
    plan_id: int,
    plan_data: SubscriptionPlanUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Update a subscription plan (admin only).
    """
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found",
        )
    
    # Update plan fields
    for key, value in plan_data.model_dump(exclude_unset=True).items():
        setattr(plan, key, value)
    
    db.commit()
    db.refresh(plan)
    
    return plan

@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subscription_plan(
    plan_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> None:
    """
    Delete a subscription plan (admin only).
    """
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found",
        )
    
    # Instead of deleting, mark as inactive
    plan.is_active = False
    db.commit()
    
    return None

@router.get("/admin/subscriptions", response_model=List[SubscriptionSchema])
async def get_all_subscriptions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get all subscriptions (admin only).
    """
    query = db.query(Subscription)
    
    if status:
        query = query.filter(Subscription.status == status)
    
    subscriptions = query.offset(skip).limit(limit).all()
    return subscriptions

# Webhook endpoint
@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> Any:
    """
    Handle Stripe webhook events.
    """
    # Get the signature from headers
    signature = request.headers.get("Stripe-Signature")
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stripe signature is missing",
        )
    
    # Get the request body
    payload = await request.body()
    
    try:
        # Verify the event
        event = handle_webhook_event(payload, signature)
        
        # Process the event
        if event["type"] == "customer.subscription.created":
            await handle_subscription_created(event["data"]["object"], db)
        
        elif event["type"] == "customer.subscription.updated":
            await handle_subscription_updated(event["data"]["object"], db)
        
        elif event["type"] == "customer.subscription.deleted":
            await handle_subscription_deleted(event["data"]["object"], db)
        
        elif event["type"] == "invoice.payment_succeeded":
            await handle_invoice_payment_succeeded(event["data"]["object"], db)
        
        elif event["type"] == "invoice.payment_failed":
            await handle_invoice_payment_failed(event["data"]["object"], db)
        
        return {"status": "success"}
    
    except Exception as e:
        # Log the error
        print(f"Error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing webhook: {str(e)}",
        )

# Webhook handlers
async def handle_subscription_created(subscription_data: dict, db: Session) -> None:
    """
    Handle subscription created event.
    """
    # Get the customer ID from the subscription
    customer_id = subscription_data["customer"]
    
    # Find the user by Stripe customer ID
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        print(f"User not found for Stripe customer ID: {customer_id}")
        return
    
    # Get the plan price ID
    price_id = subscription_data["items"]["data"][0]["price"]["id"]
    
    # Find the plan by price ID
    plan = None
    if subscription_data["items"]["data"][0]["plan"]["interval"] == "month":
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.stripe_price_id_monthly == price_id).first()
        billing_interval = "monthly"
    else:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.stripe_price_id_yearly == price_id).first()
        billing_interval = "yearly"
    
    if not plan:
        print(f"Plan not found for price ID: {price_id}")
        return
    
    # Create subscription record
    subscription = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        stripe_subscription_id=subscription_data["id"],
        billing_interval=billing_interval,
        status=subscription_data["status"],
        start_date=datetime.fromtimestamp(subscription_data["current_period_start"]),
    )
    
    # Set trial end if applicable
    if subscription_data.get("trial_end"):
        subscription.trial_end = datetime.fromtimestamp(subscription_data["trial_end"])
    
    db.add(subscription)
    db.commit()

async def handle_subscription_updated(subscription_data: dict, db: Session) -> None:
    """
    Handle subscription updated event.
    """
    # Find subscription by Stripe ID
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_data["id"]
    ).first()
    
    if not subscription:
        print(f"Subscription not found for Stripe ID: {subscription_data['id']}")
        return
    
    # Update subscription status
    subscription.status = subscription_data["status"]
    
    # Update cancel_at_period_end
    subscription.cancel_at_period_end = subscription_data["cancel_at_period_end"]
    
    # Update period timestamps
    subscription.start_date = datetime.fromtimestamp(subscription_data["current_period_start"])
    
    # Set end date if canceled
    if subscription_data["status"] == "canceled":
        subscription.end_date = datetime.utcnow()
    
    # Update plan if changed
    price_id = subscription_data["items"]["data"][0]["price"]["id"]
    
    if subscription_data["items"]["data"][0]["plan"]["interval"] == "month":
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.stripe_price_id_monthly == price_id).first()
        subscription.billing_interval = "monthly"
    else:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.stripe_price_id_yearly == price_id).first()
        subscription.billing_interval = "yearly"
    
    if plan and plan.id != subscription.plan_id:
        subscription.plan_id = plan.id
    
    db.commit()

async def handle_subscription_deleted(subscription_data: dict, db: Session) -> None:
    """
    Handle subscription deleted event.
    """
    # Find subscription by Stripe ID
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_data["id"]
    ).first()
    
    if not subscription:
        print(f"Subscription not found for Stripe ID: {subscription_data['id']}")
        return
    
    # Mark subscription as canceled
    subscription.status = "canceled"
    subscription.end_date = datetime.utcnow()
    
    db.commit()

async def handle_invoice_payment_succeeded(invoice_data: dict, db: Session) -> None:
    """
    Handle invoice payment succeeded event.
    """
    # Check if this is a subscription invoice
    if not invoice_data.get("subscription"):
        return
    
    # Find subscription by Stripe ID
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == invoice_data["subscription"]
    ).first()
    
    if not subscription:
        print(f"Subscription not found for Stripe ID: {invoice_data['subscription']}")
        return
    
    # Create payment record
    payment = Payment(
        user_id=subscription.user_id,
        subscription_id=subscription.id,
        stripe_payment_id=invoice_data["payment_intent"],
        amount=invoice_data["amount_paid"] / 100,  # Convert from cents
        currency=invoice_data["currency"],
        status="succeeded",
        payment_details={
            "invoice_id": invoice_data["id"],
            "invoice_number": invoice_data.get("number"),
            "period_start": invoice_data.get("period_start"),
            "period_end": invoice_data.get("period_end"),
        }
    )
    
    db.add(payment)
    db.commit()

async def handle_invoice_payment_failed(invoice_data: dict, db: Session) -> None:
    """
    Handle invoice payment failed event.
    """
    # Check if this is a subscription invoice
    if not invoice_data.get("subscription"):
        return
    
    # Find subscription by Stripe ID
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == invoice_data["subscription"]
    ).first()
    
    if not subscription:
        print(f"Subscription not found for Stripe ID: {invoice_data['subscription']}")
        return
    
    # Update subscription status
    subscription.status = "past_due"
    
    # Create payment record
    payment = Payment(
        user_id=subscription.user_id,
        subscription_id=subscription.id,
        stripe_payment_id=invoice_data.get("payment_intent"),
        amount=invoice_data["amount_due"] / 100,  # Convert from cents
        currency=invoice_data["currency"],
        status="failed",
        payment_details={
            "invoice_id": invoice_data["id"],
            "invoice_number": invoice_data.get("number"),
            "period_start": invoice_data.get("period_start"),
            "period_end": invoice_data.get("period_end"),
            "attempt_count": invoice_data.get("attempt_count"),
            "next_payment_attempt": invoice_data.get("next_payment_attempt"),
        }
    )
    
    db.add(payment)
    db.commit()