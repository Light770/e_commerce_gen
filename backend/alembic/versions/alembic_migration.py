"""Add subscription and payment models

Revision ID: 12345abcdef
Revises: previous_revision_id_here
Create Date: 2025-04-18

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '12345abcdef'
down_revision = 'previous_revision_id_here'  # Replace with your actual last migration ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add stripe_customer_id to users table
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(255), nullable=True, unique=True))
    
    # Add is_premium and usage_limit_free to tools table
    op.add_column('tools', sa.Column('is_premium', sa.Boolean(), default=False))
    op.add_column('tools', sa.Column('usage_limit_free', sa.Integer(), default=3))
    
    # Create subscription_plans table
    op.create_table(
        'subscription_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_monthly', sa.Float(), nullable=False),
        sa.Column('price_yearly', sa.Float(), nullable=False),
        sa.Column('stripe_price_id_monthly', sa.String(255), nullable=True),
        sa.Column('stripe_price_id_yearly', sa.String(255), nullable=True),
        sa.Column('features', sa.JSON(), nullable=True),
        sa.Column('tool_limit', sa.Integer(), default=-1),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=True, unique=True),
        sa.Column('status', sa.String(50), default='active'),
        sa.Column('billing_interval', sa.String(20), default='monthly'),
        sa.Column('start_date', sa.DateTime(), default=sa.func.now()),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('trial_end', sa.DateTime(), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['plan_id'], ['subscription_plans.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create plan_tools table (for mapping which tools are available in which plans)
    op.create_table(
        'plan_tools',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('tool_id', sa.Integer(), nullable=False),
        sa.Column('usage_limit', sa.Integer(), default=-1),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.ForeignKeyConstraint(['plan_id'], ['subscription_plans.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tool_id'], ['tools.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column('stripe_payment_id', sa.String(255), nullable=True, unique=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(3), default='USD'),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('payment_details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_subscription_user', 'subscriptions', ['user_id'])
    op.create_index('idx_subscription_status', 'subscriptions', ['status'])
    op.create_index('idx_payment_user', 'payments', ['user_id'])
    op.create_index('idx_plan_tool', 'plan_tools', ['plan_id', 'tool_id'], unique=True)


def downgrade() -> None:
    # Drop tables
    op.drop_table('payments')
    op.drop_table('plan_tools')
    op.drop_table('subscriptions')
    op.drop_table('subscription_plans')
    
    # Drop columns
    op.drop_column('tools', 'usage_limit_free')
    op.drop_column('tools', 'is_premium')
    op.drop_column('users', 'stripe_customer_id')