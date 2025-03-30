from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import logging

from app.core.config import settings
from app.db.session import get_db
from app.models.models import User, RefreshToken, Role
import secrets
import string

logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 password bearer for FastAPI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any], 
    expires_delta: Optional[timedelta] = None,
    additional_data: Optional[Dict[str, Any]] = None
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    if additional_data:
        to_encode.update(additional_data)
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(
    user_id: int, 
    db: Session,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None
) -> str:
    """Create a refresh token and store it in the database."""
    token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(64))
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at,
        device_info=device_info,
        ip_address=ip_address
    )
    
    db.add(db_token)
    db.commit()
    
    return token

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current admin user."""
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user

def generate_verification_token() -> str:
    """Generate a verification token."""
    return secrets.token_urlsafe(32)

def generate_password_reset_token() -> str:
    """Generate a password reset token."""
    return secrets.token_urlsafe(32)

async def create_admin_user():
    """Create admin user if it doesn't exist yet."""
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if admin_user:
            logger.info("Admin user already exists")
            return
        
        # Get admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            logger.error("Admin role not found")
            admin_role = Role(name="admin", description="Administrator with full access")
            db.add(admin_role)
            db.flush()
        
        # Create admin user
        admin_user = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            full_name="Admin User",
            is_active=True,
            is_verified=True
        )
        
        admin_user.roles.append(admin_role)
        db.add(admin_user)
        db.commit()
        
        logger.info(f"Admin user created with email: {settings.ADMIN_EMAIL}")
    
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()