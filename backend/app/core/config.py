from pydantic import AnyHttpUrl, EmailStr, Field, validator
from pydantic_settings import BaseSettings
from typing import List, Optional, Union, Dict, Any
import os
from dotenv import load_dotenv
import json

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Core settings
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "development-secret-key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://user:password@db:3306/appdb")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # Admin user creation
    ADMIN_EMAIL: EmailStr = os.getenv("ADMIN_EMAIL", "admin@example.com")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin-password-change-me")
    
    # Email settings
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_PORT: Optional[int] = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAIL_FROM: Optional[EmailStr] = os.getenv("EMAIL_FROM")
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_AUTH_PER_MINUTE: int = 5
    
    # Stripe settings
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    # Subscription settings
    TRIAL_DAYS: int = int(os.getenv("TRIAL_DAYS", "14"))
    FREE_TIER_TOOL_LIMIT: int = int(os.getenv("FREE_TIER_TOOL_LIMIT", "3"))
    
    # Frontend URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    SUBSCRIPTION_SUCCESS_URL: str = f"{FRONTEND_URL}/subscription/success"
    SUBSCRIPTION_CANCEL_URL: str = f"{FRONTEND_URL}/subscription/cancel"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()