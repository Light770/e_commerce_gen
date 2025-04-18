import stripe
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from app.core.config import settings

# Initialize Stripe with API key
stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)

def get_stripe_customer(email: str, name: Optional[str] = None) -> Dict[str, Any]:
    """
    Get or create a customer in Stripe.
    """
    try:
        # Search for existing customer by email
        customers = stripe.Customer.list(email=email, limit=1)
        
        if customers.data:
            return customers.data[0]
        
        # Create new customer if not found
        customer = stripe.Customer.create(
            email=email,
            name=name
        )
        return customer
    except Exception as e:
        logger.error(f"Error creating Stripe customer: {e}")
        raise

def create_subscription(
    customer_id: str,
    price_id: str,
    trial_days: Optional[int] = None
) -> Dict[str, Any]:
    """
    Create a subscription for a customer.
    """
    try:
        subscription_data = {
            "customer": customer_id,
            "items": [{"price": price_id}],
            "expand": ["latest_invoice.payment_intent"]
        }
        
        # Add trial period if specified
        if trial_days:
            trial_end = datetime.now() + timedelta(days=trial_days)
            subscription_data["trial_end"] = int(trial_end.timestamp())
        
        subscription = stripe.Subscription.create(**subscription_data)
        return subscription
    except Exception as e:
        logger.error(f"Error creating Stripe subscription: {e}")
        raise

def get_subscription(subscription_id: str) -> Dict[str, Any]:
    """
    Get subscription details.
    """
    try:
        return stripe.Subscription.retrieve(subscription_id)
    except Exception as e:
        logger.error(f"Error retrieving Stripe subscription: {e}")
        raise

def cancel_subscription(subscription_id: str, at_period_end: bool = True) -> Dict[str, Any]:
    """
    Cancel a subscription.
    """
    try:
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=at_period_end
        )
    except Exception as e:
        logger.error(f"Error canceling Stripe subscription: {e}")
        raise

def update_subscription(subscription_id: str, price_id: str) -> Dict[str, Any]:
    """
    Update a subscription with a new price.
    """
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Get the current subscription item ID
        item_id = subscription["items"]["data"][0]["id"]
        
        # Update the subscription
        return stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": item_id,
                "price": price_id,
            }]
        )
    except Exception as e:
        logger.error(f"Error updating Stripe subscription: {e}")
        raise

def create_checkout_session(
    customer_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
    mode: str = "subscription"
) -> Dict[str, Any]:
    """
    Create a Checkout Session for a customer.
    """
    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1
            }],
            mode=mode,
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return session
    except Exception as e:
        logger.error(f"Error creating Stripe checkout session: {e}")
        raise

def create_billing_portal_session(customer_id: str, return_url: str) -> Dict[str, Any]:
    """
    Create a Billing Portal session for a customer.
    """
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url
        )
        return session
    except Exception as e:
        logger.error(f"Error creating Stripe billing portal session: {e}")
        raise

def get_payment_method(payment_method_id: str) -> Dict[str, Any]:
    """
    Get payment method details.
    """
    try:
        return stripe.PaymentMethod.retrieve(payment_method_id)
    except Exception as e:
        logger.error(f"Error retrieving Stripe payment method: {e}")
        raise

def attach_payment_method(customer_id: str, payment_method_id: str) -> Dict[str, Any]:
    """
    Attach a payment method to a customer.
    """
    try:
        return stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id
        )
    except Exception as e:
        logger.error(f"Error attaching Stripe payment method: {e}")
        raise

def detach_payment_method(payment_method_id: str) -> Dict[str, Any]:
    """
    Detach a payment method from a customer.
    """
    try:
        return stripe.PaymentMethod.detach(payment_method_id)
    except Exception as e:
        logger.error(f"Error detaching Stripe payment method: {e}")
        raise

def handle_webhook_event(payload: bytes, sig_header: str) -> Dict[str, Any]:
    """
    Verify and handle a webhook event from Stripe.
    """
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        return event
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid Stripe webhook signature: {e}")
        raise
    except Exception as e:
        logger.error(f"Error handling Stripe webhook: {e}")
        raise