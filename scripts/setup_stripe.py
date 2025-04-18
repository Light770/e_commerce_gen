#!/usr/bin/env python3
"""
Set up Stripe products and prices for subscription plans.
This script should be run once during initial setup to create
the products and prices in Stripe that match our database plans.
"""

import os
import sys
import json
import stripe
from dotenv import load_dotenv
import argparse
import mysql.connector
from mysql.connector import Error

# Load environment variables
load_dotenv()

# Initialize Stripe with API key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Parse arguments
parser = argparse.ArgumentParser(description='Set up Stripe products and prices for subscription plans')
parser.add_argument('--dry-run', action='store_true', help='Print what would be done without making changes')
args = parser.parse_args()

def connect_to_database():
    """Connect to the database and return the connection."""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'appdb'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', os.getenv('MYSQL_ROOT_PASSWORD')),
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
        sys.exit(1)

def get_subscription_plans(connection):
    """Get all subscription plans from the database."""
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM subscription_plans")
    plans = cursor.fetchall()
    cursor.close()
    return plans

def create_stripe_product(plan_name, plan_description, plan_features):
    """Create a Stripe product for a subscription plan."""
    print(f"Creating Stripe product for {plan_name}...")
    
    # Skip creation if this is a dry run
    if args.dry_run:
        print(f"[DRY RUN] Would create product: {plan_name}")
        return {"id": "dry_run_product_id"}
    
    product = stripe.Product.create(
        name=plan_name,
        description=plan_description,
        metadata={
            "features": json.dumps(plan_features)
        }
    )
    print(f"Created product: {product.id}")
    return product

def create_stripe_price(product_id, plan_name, price_monthly, price_yearly):
    """Create monthly and yearly prices for a product."""
    print(f"Creating Stripe prices for {plan_name}...")
    
    # Skip creation if this is a dry run
    if args.dry_run:
        print(f"[DRY RUN] Would create monthly price: ${price_monthly}/month")
        print(f"[DRY RUN] Would create yearly price: ${price_yearly}/year")
        return {
            "monthly": "dry_run_price_monthly",
            "yearly": "dry_run_price_yearly"
        }
    
    # Create monthly price
    monthly_price = stripe.Price.create(
        product=product_id,
        unit_amount=int(price_monthly * 100),  # Convert to cents
        currency="usd",
        recurring={"interval": "month"},
        metadata={"plan_name": plan_name}
    )
    
    # Create yearly price
    yearly_price = stripe.Price.create(
        product=product_id,
        unit_amount=int(price_yearly * 100),  # Convert to cents
        currency="usd",
        recurring={"interval": "year"},
        metadata={"plan_name": plan_name}
    )
    
    print(f"Created monthly price: {monthly_price.id}")
    print(f"Created yearly price: {yearly_price.id}")
    
    return {
        "monthly": monthly_price.id,
        "yearly": yearly_price.id
    }

def update_plan_with_stripe_ids(connection, plan_id, monthly_price_id, yearly_price_id):
    """Update the subscription plan with Stripe price IDs."""
    cursor = connection.cursor()
    
    # Skip update if this is a dry run
    if args.dry_run:
        print(f"[DRY RUN] Would update plan {plan_id} with price IDs")
        return
    
    query = """
    UPDATE subscription_plans
    SET stripe_price_id_monthly = %s, stripe_price_id_yearly = %s
    WHERE id = %s
    """
    cursor.execute(query, (monthly_price_id, yearly_price_id, plan_id))
    connection.commit()
    cursor.close()
    print(f"Updated plan {plan_id} with Stripe price IDs")

def main():
    """Main function to run the script."""
    print("Starting Stripe setup...")
    
    # Connect to the database
    connection = connect_to_database()
    
    # Get all subscription plans
    plans = get_subscription_plans(connection)
    print(f"Found {len(plans)} subscription plans")
    
    # Process each plan
    for plan in plans:
        # Skip the free plan since we don't need Stripe products for it
        if plan['name'] == 'Free':
            print("Skipping Free plan - no Stripe product needed")
            continue
        
        # Parse features from JSON
        features = json.loads(plan['features']) if plan['features'] else []
        
        # Create Stripe product
        product = create_stripe_product(plan['name'], plan['description'], features)
        
        # Create Stripe prices
        prices = create_stripe_price(
            product['id'], 
            plan['name'], 
            plan['price_monthly'], 
            plan['price_yearly']
        )
        
        # Update the plan with Stripe price IDs
        update_plan_with_stripe_ids(
            connection,
            plan['id'],
            prices['monthly'],
            prices['yearly']
        )
    
    # Close the database connection
    if connection.is_connected():
        connection.close()
    
    print("Stripe setup completed successfully!")

if __name__ == "__main__":
    main()