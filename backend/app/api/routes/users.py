from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.security import get_current_user, get_current_active_user, get_password_hash, verify_password
from app.db.session import get_db
from app.models.models import User, ToolUsage
from app.schemas.user import User as UserSchema, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def read_current_user(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user information.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Update own user information.
    """
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    
    if user_in.password is not None and user_in.new_password is not None:
        # Check if current password is correct
        if not verify_password(user_in.password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect password",
            )
        current_user.hashed_password = get_password_hash(user_in.new_password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/activity", response_model=List[dict])
async def read_current_user_activity(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get current user's activity history.
    """
    activities = db.query(ToolUsage).filter(
        ToolUsage.user_id == current_user.id
    ).order_by(ToolUsage.started_at.desc()).limit(10).all()
    
    return [{"id": a.id, "tool_id": a.tool_id, "status": a.status, "started_at": a.started_at, "completed_at": a.completed_at} for a in activities]

@router.get("/me/stats", response_model=dict)
async def read_current_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get current user's usage statistics.
    """
    # Count total tool usages
    total_tools = db.query(ToolUsage).filter(
        ToolUsage.user_id == current_user.id
    ).count()
    
    # Count completed tool usages
    completed_tools = db.query(ToolUsage).filter(
        ToolUsage.user_id == current_user.id,
        ToolUsage.status == "COMPLETED"
    ).count()
    
    # Count in-progress tool usages
    in_progress_tools = db.query(ToolUsage).filter(
        ToolUsage.user_id == current_user.id,
        ToolUsage.status.in_(["STARTED", "IN_PROGRESS"])
    ).count()
    
    return {
        "totalTools": total_tools,
        "completedTools": completed_tools,
        "inProgressTools": in_progress_tools,
    }