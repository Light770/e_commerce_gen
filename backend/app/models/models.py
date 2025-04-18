from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Table, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta

from app.db.base_class import Base

# Association table for user roles
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('assigned_at', DateTime, default=func.now())
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255))
    verification_token_expires = Column(DateTime)
    reset_password_token = Column(String(255))
    reset_token_expires = Column(DateTime)
    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    tool_usages = relationship("ToolUsage", back_populates="user")
    saved_progresses = relationship("SavedProgress", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")

    def has_role(self, role_name: str) -> bool:
        return any(role.name == role_name for role in self.roles)

    def is_admin(self) -> bool:
        return self.has_role("admin")
    
    def get_active_subscription(self):
        """Get the user's active subscription if any."""
        now = datetime.utcnow()
        for sub in self.subscriptions:
            if sub.status == "active" and (sub.end_date is None or sub.end_date > now):
                return sub
        return None
    
    def get_subscription_plan(self):
        """Get the user's current subscription plan."""
        sub = self.get_active_subscription()
        if sub:
            return sub.plan
        return None


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=func.now())

    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")


class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50))
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    usage_limit_free = Column(Integer, default=3)  # Number of uses for free tier
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    tool_usages = relationship("ToolUsage", back_populates="tool")
    saved_progresses = relationship("SavedProgress", back_populates="tool")
    plan_tools = relationship("PlanTool", back_populates="tool")


class ToolUsage(Base):
    __tablename__ = "tool_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)
    status = Column(String(20), default="STARTED", nullable=False)  # STARTED, IN_PROGRESS, COMPLETED, FAILED
    input_data = Column(JSON)
    result_data = Column(JSON)
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="tool_usages")
    tool = relationship("Tool", back_populates="tool_usages")


class SavedProgress(Base):
    __tablename__ = "saved_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)
    form_data = Column(JSON, nullable=False)
    saved_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="saved_progresses")
    tool = relationship("Tool", back_populates="saved_progresses")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now())
    device_info = Column(String(255))
    ip_address = Column(String(45))
    is_revoked = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(10), nullable=False, index=True)
    message = Column(Text, nullable=False)
    source = Column(String(100))
    created_at = Column(DateTime, default=func.now(), index=True)
    additional_data = Column(JSON)


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price_monthly = Column(Float, nullable=False)
    price_yearly = Column(Float, nullable=False)
    stripe_price_id_monthly = Column(String(255))
    stripe_price_id_yearly = Column(String(255))
    features = Column(JSON)  # JSON array of feature descriptions
    tool_limit = Column(Integer, default=-1)  # -1 means unlimited
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")
    plan_tools = relationship("PlanTool", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    stripe_subscription_id = Column(String(255), unique=True)
    status = Column(String(50), default="active")  # active, canceled, past_due, etc.
    billing_interval = Column(String(20), default="monthly")  # monthly or yearly
    start_date = Column(DateTime, default=func.now())
    end_date = Column(DateTime, nullable=True)
    trial_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")


class PlanTool(Base):
    __tablename__ = "plan_tools"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)
    usage_limit = Column(Integer, default=-1)  # -1 means unlimited
    created_at = Column(DateTime, default=func.now())

    # Relationships
    plan = relationship("SubscriptionPlan", back_populates="plan_tools")
    tool = relationship("Tool", back_populates="plan_tools")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    stripe_payment_id = Column(String(255), unique=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(50), default="pending")  # pending, succeeded, failed
    payment_method = Column(String(50))
    payment_details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")
    subscription = relationship("Subscription")