from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
import re

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str
    confirm_password: str

    @validator("new_password")
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
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v

class TokenRefresh(BaseModel):
    refresh_token: str

class VerifyEmail(BaseModel):
    token: str