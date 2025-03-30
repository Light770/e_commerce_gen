from fastapi import APIRouter, Body, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Any

from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
    generate_verification_token,
    generate_password_reset_token,
    get_current_user,
)
from app.core.config import settings
from app.db.session import get_db
from app.models.models import User, RefreshToken, Role
from app.schemas.auth import (
    Token,
    UserLogin,
    TokenRefresh,
    PasswordResetRequest,
    PasswordReset,
    VerifyEmail,
)
from app.schemas.user import UserCreate, User as UserSchema
from app.utils.email import send_verification_email, send_password_reset_email

router = APIRouter()

from fastapi.responses import Response

@router.options("login")
async def login_options():
    return Response(status_code=204, headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization"})

@router.post("login", response_model=Token)
async def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    # Get user roles
    user_roles = [role.name for role in user.roles]
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires,
        additional_data={"roles": user_roles, "email": user.email}
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(user_id=user.id, db=db)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.options("refresh")
async def refresh_options():
    return Response(status_code=204, headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization"})

@router.post("refresh", response_model=Token)
async def refresh_token(
    token_data: TokenRefresh = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Refresh access token.
    """
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == token_data.refresh_token,
        RefreshToken.is_revoked == False,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    user = db.query(User).filter(User.id == refresh_token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # Get user roles
    user_roles = [role.name for role in user.roles]
    
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires,
        additional_data={"roles": user_roles, "email": user.email}
    )
    
    # Create new refresh token and invalidate old one
    new_refresh_token = create_refresh_token(user_id=user.id, db=db)
    refresh_token.is_revoked = True
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.options("register")
async def register_options():
    return Response(status_code=204, headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization"})

@router.post("register", response_model=UserSchema)
async def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    request: Request = None,
) -> Any:
    """
    Register a new user.
    """
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create verification token
    verification_token = generate_verification_token()
    verification_token_expires = datetime.utcnow() + timedelta(days=1)
    
    # Create new user
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
        is_verified=False,
        verification_token=verification_token,
        verification_token_expires=verification_token_expires,
    )
    
    # Add user role
    user_role = db.query(Role).filter(Role.name == "user").first()
    if user_role:
        user.roles.append(user_role)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email
    base_url = str(request.base_url)
    send_verification_email(user.email, verification_token, base_url)
    
    return user

@router.options("verify-email")
async def verify_email_options():
    return Response(status_code=204, headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization"})

@router.post("verify-email", response_model=UserSchema)
async def verify_email(
    verify_data: VerifyEmail,
    db: Session = Depends(get_db),
) -> Any:
    """
    Verify user email using the token sent to their email.
    """
    user = db.query(User).filter(
        User.verification_token == verify_data.token,
        User.verification_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )
    
    # Update user
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    
    db.commit()
    db.refresh(user)
    
    return user

@router.options("password-reset-request")
async def password_reset_request_options():
    return Response(status_code=204, headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization"})

@router.post("password-reset-request")
async def request_password_reset(
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db),
    request: Request = None,
) -> Any:
    """
    Request password reset email.
    """
    user = db.query(User).filter(User.email == reset_request.email).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    # Generate password reset token
    reset_token = generate_password_reset_token()
    reset_token_expires = datetime.utcnow() + timedelta(hours=24)
    
    # Update user
    user.reset_password_token = reset_token
    user.reset_token_expires = reset_token_expires
    
    db.commit()
    
    # Send password reset email
    base_url = str(request.base_url)
    send_password_reset_email(user.email, reset_token, base_url)
    
    return {"message": "If your email is registered, you will receive a password reset link"}

@router.options("reset-password")
async def reset_password_options():
    return Response(status_code=204, headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization"})

@router.post("reset-password")
async def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db),
) -> Any:
    """
    Reset password using token sent to email.
    """
    user = db.query(User).filter(
        User.reset_password_token == reset_data.token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    
    # Update user password
    user.hashed_password = get_password_hash(reset_data.new_password)
    user.reset_password_token = None
    user.reset_token_expires = None
    
    # Revoke all refresh tokens
    for token in user.refresh_tokens:
        token.is_revoked = True
    
    db.commit()
    
    return {"message": "Password has been reset successfully"}

@router.options("logout")
async def logout_options():
    return Response(status_code=204, headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization"})

@router.post("logout")
async def logout(
    token_data: TokenRefresh = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Logout and revoke refresh token.
    """
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == token_data.refresh_token,
        RefreshToken.user_id == current_user.id
    ).first()
    
    if refresh_token:
        refresh_token.is_revoked = True
        db.commit()
    
    return {"message": "Successfully logged out"}