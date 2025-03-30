from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Table, Text
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
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    tool_usages = relationship("ToolUsage", back_populates="user")
    saved_progresses = relationship("SavedProgress", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")

    def has_role(self, role_name: str) -> bool:
        return any(role.name == role_name for role in self.roles)

    def is_admin(self) -> bool:
        return self.has_role("admin")


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
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    tool_usages = relationship("ToolUsage", back_populates="tool")
    saved_progresses = relationship("SavedProgress", back_populates="tool")


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