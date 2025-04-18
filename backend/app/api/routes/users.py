from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, List, Dict, Optional

from app.core.security import get_current_user, get_current_active_user, get_password_hash, verify_password
from app.db.session import get_db
from app.models.models import User, ToolUsage, Subscription
from app.schemas.user import User as UserSchema, UserUpdate
from sqlalchemy import desc

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def read_current_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get current user information including subscription details.
    """
    # Get user's active subscription
    subscription = current_user.get_active_subscription()
    
    # Create response with subscription info
    user_dict = current_user.__dict__.copy()
    user_dict["active_subscription"] = subscription
    user_dict["roles"] = [role.name for role in current_user.roles]
    
    return user_dict

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
    
    # Get user's active subscription
    subscription = current_user.get_active_subscription()
    
    # Create response with subscription info
    user_dict = current_user.__dict__.copy()
    user_dict["active_subscription"] = subscription
    user_dict["roles"] = [role.name for role in current_user.roles]
    
    return user_dict

@router.get("/me/activity", response_model=List[Dict])
async def read_current_user_activity(
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get current user's activity history.
    """
    activities = db.query(ToolUsage).filter(
        ToolUsage.user_id == current_user.id
    ).order_by(desc(ToolUsage.started_at)).offset(skip).limit(limit).all()
    
    result = []
    for activity in activities:
        # Load the associated tool
        tool = activity.tool
        
        activity_dict = {
            "id": activity.id,
            "tool_id": activity.tool_id,
            "tool_name": tool.name if tool else "Unknown Tool",
            "tool_icon": tool.icon if tool else None,
            "status": activity.status,
            "started_at": activity.started_at,
            "completed_at": activity.completed_at,
            "is_premium": tool.is_premium if tool else False
        }
        result.append(activity_dict)
    
    return result

@router.get("/me/stats", response_model=Dict)
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
    
    # Get subscription details
    subscription = current_user.get_active_subscription()
    subscription_info = None
    if subscription:
        subscription_info = {
            "plan_name": subscription.plan.name,
            "status": subscription.status,
            "billing_interval": subscription.billing_interval,
            "start_date": subscription.start_date,
            "end_date": subscription.end_date,
            "trial_end": subscription.trial_end,
            "cancel_at_period_end": subscription.cancel_at_period_end
        }
    
    return {
        "totalTools": total_tools,
        "completedTools": completed_tools,
        "inProgressTools": in_progress_tools,
        "subscription": subscription_info or {"plan_name": "Free"}
    }

@router.get("/me/activity/{activity_id}", response_model=Dict)
async def get_activity_details(
    activity_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get details of a specific activity.
    """
    # Find the activity
    activity = db.query(ToolUsage).filter(
        ToolUsage.id == activity_id,
        ToolUsage.user_id == current_user.id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    
    # Get the associated tool
    tool = activity.tool
    
    # Create the response
    result = {
        "id": activity.id,
        "tool_id": activity.tool_id,
        "tool": {
            "id": tool.id,
            "name": tool.name,
            "description": tool.description,
            "icon": tool.icon,
            "is_premium": tool.is_premium
        } if tool else None,
        "status": activity.status,
        "input_data": activity.input_data,
        "result_data": activity.result_data,
        "started_at": activity.started_at,
        "completed_at": activity.completed_at
    }
    
    return result