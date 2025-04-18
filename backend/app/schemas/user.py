from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re

from app.schemas.subscription import Subscription

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str
    confirm_password: str

    @validator("password")
    def password_strength(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a digit")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain a special character")
        return v

    @validator("confirm_password")
    def passwords_match(cls, v, values, **kwargs):
        """Validate that passwords match."""
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    new_password: Optional[str] = None

    @validator("new_password")
    def password_strength(cls, v, values, **kwargs):
        """Validate password strength if provided."""
        if v is None:
            return v
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a digit")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain a special character")
        return v

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_verified: bool
    stripe_customer_id: Optional[str] = None
    
    class Config:
        from_attributes = True

# Properties to return to client
class User(UserInDBBase):
    roles: List[str] = []
    active_subscription: Optional[Dict[str, Any]] = None
    
    @validator("active_subscription", pre=True)
    def extract_subscription_info(cls, v, values, **kwargs):
        """Format subscription info for the response."""
        if isinstance(v, Subscription):
            return {
                "id": v.id,
                "plan_name": v.plan.name if v.plan else "Unknown",
                "status": v.status,
                "billing_interval": v.billing_interval,
                "start_date": v.start_date,
                "end_date": v.end_date,
                "trial_end": v.trial_end,
                "cancel_at_period_end": v.cancel_at_period_end
            }
        return v

# Properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str

# Role schema
class Role(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True