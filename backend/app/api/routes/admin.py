from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Any, List
from datetime import datetime, timedelta

from app.core.security import get_current_admin_user, get_password_hash
from app.db.session import get_db
from app.models.models import User, Role, Tool, ToolUsage, SystemLog
from app.schemas.user import User as UserSchema
from app.schemas.tool import Tool as ToolSchema

router = APIRouter()

@router.get("/stats", response_model=dict)
async def read_admin_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get admin dashboard statistics.
    """
    # Count total users
    total_users = db.query(User).count()
    
    # Count active users (users who have used a tool in the last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = db.query(User.id).join(ToolUsage).filter(
        ToolUsage.started_at >= thirty_days_ago
    ).distinct().count()
    
    # Count total tools
    total_tools = db.query(Tool).count()
    
    # Count total tool usages
    total_usage = db.query(ToolUsage).count()
    
    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "totalTools": total_tools,
        "totalUsage": total_usage,
    }

@router.get("/users", response_model=List[UserSchema])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve users.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/users/{user_id}/activate", response_model=UserSchema)
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Activate a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/deactivate", response_model=UserSchema)
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Deactivate a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if trying to deactivate self or another admin
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    if user.is_admin():
        raise HTTPException(status_code=400, detail="Cannot deactivate another admin")
    
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/make-admin", response_model=UserSchema)
async def make_user_admin(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Make a user an admin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already an admin
    if user.is_admin():
        raise HTTPException(status_code=400, detail="User is already an admin")
    
    # Get admin role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        raise HTTPException(status_code=500, detail="Admin role not found")
    
    user.roles.append(admin_role)
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/remove-admin", response_model=UserSchema)
async def remove_user_admin(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Remove admin role from a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if trying to remove admin from self
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove admin role from yourself")
    
    # Get admin role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        raise HTTPException(status_code=500, detail="Admin role not found")
    
    if admin_role in user.roles:
        user.roles.remove(admin_role)
        db.commit()
        db.refresh(user)
    else:
        raise HTTPException(status_code=400, detail="User is not an admin")
    
    return user

@router.get("/tools", response_model=List[ToolSchema])
async def read_admin_tools(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve all tools including inactive ones.
    """
    tools = db.query(Tool).offset(skip).limit(limit).all()
    return tools

@router.post("/tools", response_model=ToolSchema)
async def create_tool(
    name: str = Body(...),
    description: str = Body(...),
    icon: str = Body(...),
    is_active: bool = Body(True),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Create a new tool.
    """
    tool = Tool(
        name=name,
        description=description,
        icon=icon,
        is_active=is_active
    )
    
    db.add(tool)
    db.commit()
    db.refresh(tool)
    
    return tool

@router.put("/tools/{tool_id}", response_model=ToolSchema)
async def update_tool(
    tool_id: int,
    name: str = Body(None),
    description: str = Body(None),
    icon: str = Body(None),
    is_active: bool = Body(None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Update a tool.
    """
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    if name is not None:
        tool.name = name
    if description is not None:
        tool.description = description
    if icon is not None:
        tool.icon = icon
    if is_active is not None:
        tool.is_active = is_active
    
    db.commit()
    db.refresh(tool)
    
    return tool

@router.get("/tools/usage", response_model=List[dict])
async def read_tool_usage_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get tool usage statistics.
    """
    # Count usage for each tool
    tool_usage_stats = db.query(
        Tool.name.label("name"),
        func.count(ToolUsage.id).label("usage")
    ).join(
        ToolUsage, Tool.id == ToolUsage.tool_id
    ).group_by(
        Tool.name
    ).order_by(
        desc("usage")
    ).all()
    
    return [{"name": stat.name, "usage": stat.usage} for stat in tool_usage_stats]

@router.get("/users/activity", response_model=List[dict])
async def read_user_activity_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get user activity statistics.
    """
    # Get the top 10 most active users
    user_activity = db.query(
        User.email.label("name"),
        func.count(ToolUsage.id).label("usage")
    ).join(
        ToolUsage, User.id == ToolUsage.user_id
    ).group_by(
        User.email
    ).order_by(
        desc("usage")
    ).limit(10).all()
    
    return [{"name": stat.name, "usage": stat.usage} for stat in user_activity]

@router.get("/logs", response_model=List[dict])
async def read_system_logs(
    skip: int = 0,
    limit: int = 100,
    level: str = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve system logs.
    """
    query = db.query(SystemLog)
    
    if level:
        query = query.filter(SystemLog.level == level)
    
    logs = query.order_by(SystemLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return [{"id": log.id, "level": log.level, "message": log.message, 
             "source": log.source, "created_at": log.created_at,
             "additional_data": log.additional_data} for log in logs]