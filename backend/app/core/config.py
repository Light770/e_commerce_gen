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
    
    # CORS settings
    # CORS_ORIGINS: List[AnyHttpUrl] = []
    
    # # Modify the CORS_ORIGINS definition and validator in config.py
    # CORS_ORIGINS: List[str] = []  # Set a default value

    # @validator("CORS_ORIGINS", pre=True)
    # def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
    #     if isinstance(v, str):
    #         if v.startswith("[") and v.endswith("]"):
    #             # JSON format
    #             try:
    #                 return json.loads(v)
    #             except json.JSONDecodeError as e:
    #                 raise ValueError(f"Invalid JSON format for CORS_ORIGINS: {e}") from e
    #         # Comma-separated format
    #         return [i.strip() for i in v.split(",") if i.strip()]
    #     if isinstance(v, list):
    #         return v
    #     # Default if empty or invalid
    #     return ["http://localhost:3000"]
    
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
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()