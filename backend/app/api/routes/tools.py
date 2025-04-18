from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Any, List, Dict, Optional
from datetime import datetime, timedelta

from app.core.security import get_current_user, get_current_active_user
from app.db.session import get_db
from app.models.models import User, Tool, ToolUsage, SavedProgress, Subscription, SubscriptionPlan, PlanTool
from app.schemas.tool import Tool as ToolSchema, ToolUsage as ToolUsageSchema, SavedProgress as SavedProgressSchema
from app.core.config import settings

router = APIRouter()

async def check_tool_access(user: User, tool_id: int, db: Session):
    """
    Check if user has access to the tool based on their subscription.
    Returns (has_access, reason, remaining_uses).
    """
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        return (False, "Tool not found", 0)
    
    # If tool is not premium, everyone has access
    if not tool.is_premium:
        return (True, None, -1)  # -1 indicates unlimited
    
    # Check user's subscription
    subscription = user.get_active_subscription()
    
    if not subscription:
        # Free tier user - check usage limits
        # Count uses in the current month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        usage_count = db.query(func.count(ToolUsage.id)).filter(
            ToolUsage.user_id == user.id,
            ToolUsage.tool_id == tool_id,
            ToolUsage.started_at >= start_of_month
        ).scalar()
        
        remaining = tool.usage_limit_free - usage_count
        
        if remaining <= 0:
            return (False, "Free tier usage limit reached for this tool this month", 0)
        
        return (True, None, remaining)
    
    # User has subscription - check plan access
    plan = subscription.plan
    
    # Check if the tool is in the plan
    plan_tool = db.query(PlanTool).filter(
        PlanTool.plan_id == plan.id,
        PlanTool.tool_id == tool_id
    ).first()
    
    if not plan_tool:
        return (False, f"This tool is not included in your {plan.name} plan", 0)
    
    # Check usage limits for the tool in this plan
    if plan_tool.usage_limit != -1:
        # Count uses in the current month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        usage_count = db.query(func.count(ToolUsage.id)).filter(
            ToolUsage.user_id == user.id,
            ToolUsage.tool_id == tool_id,
            ToolUsage.started_at >= start_of_month
        ).scalar()
        
        remaining = plan_tool.usage_limit - usage_count
        
        if remaining <= 0:
            return (False, f"You've reached the usage limit for this tool in your {plan.name} plan", 0)
        
        return (True, None, remaining)
    
    # Unlimited usage
    return (True, None, -1)

@router.get("/", response_model=List[Dict])
async def read_tools(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve tools with access information.
    """
    tools = db.query(Tool).filter(Tool.is_active == True).offset(skip).limit(limit).all()
    
    # Get the user's subscription plan
    subscription = current_user.get_active_subscription()
    plan = subscription.plan if subscription else None
    
    # Get tool usage counts for the current month
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    usage_counts = {}
    for usage in db.query(ToolUsage).filter(
        ToolUsage.user_id == current_user.id,
        ToolUsage.started_at >= start_of_month
    ).all():
        if usage.tool_id not in usage_counts:
            usage_counts[usage.tool_id] = 0
        usage_counts[usage.tool_id] += 1
    
    result = []
    for tool in tools:
        # Determine access and limits
        has_access = True
        reason = None
        remaining_uses = -1  # -1 means unlimited
        
        if tool.is_premium:
            if not plan:
                # Free tier
                usage_count = usage_counts.get(tool.id, 0)
                remaining_uses = tool.usage_limit_free - usage_count
                has_access = remaining_uses > 0
                if not has_access:
                    reason = "Free tier usage limit reached"
            else:
                # Paid subscription
                plan_tool = db.query(PlanTool).filter(
                    PlanTool.plan_id == plan.id,
                    PlanTool.tool_id == tool.id
                ).first()
                
                if not plan_tool:
                    has_access = False
                    reason = f"Not included in your {plan.name} plan"
                elif plan_tool.usage_limit != -1:
                    usage_count = usage_counts.get(tool.id, 0)
                    remaining_uses = plan_tool.usage_limit - usage_count
                    has_access = remaining_uses > 0
                    if not has_access:
                        reason = f"Usage limit reached in your {plan.name} plan"
        
        tool_dict = {
            "id": tool.id,
            "name": tool.name,
            "description": tool.description,
            "icon": tool.icon,
            "is_active": tool.is_active,
            "is_premium": tool.is_premium,
            "created_at": tool.created_at,
            "updated_at": tool.updated_at,
            "access": {
                "has_access": has_access,
                "reason": reason,
                "remaining_uses": remaining_uses if remaining_uses != -1 else "unlimited"
            }
        }
        
        result.append(tool_dict)
    
    return result

@router.get("/{tool_id}", response_model=Dict)
async def read_tool(
    tool_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get tool by ID with access information.
    """
    tool = db.query(Tool).filter(Tool.id == tool_id, Tool.is_active == True).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    has_access, reason, remaining_uses = await check_tool_access(current_user, tool_id, db)
    
    tool_dict = {
        "id": tool.id,
        "name": tool.name,
        "description": tool.description,
        "icon": tool.icon,
        "is_active": tool.is_active,
        "is_premium": tool.is_premium,
        "created_at": tool.created_at,
        "updated_at": tool.updated_at,
        "access": {
            "has_access": has_access,
            "reason": reason,
            "remaining_uses": remaining_uses if remaining_uses != -1 else "unlimited"
        }
    }
    
    return tool_dict

@router.post("/{tool_id}/usage", response_model=ToolUsageSchema)
async def start_tool_usage(
    tool_id: int,
    input_data: dict = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Start using a tool and record usage.
    """
    # Check if user has access to the tool
    has_access, reason, _ = await check_tool_access(current_user, tool_id, db)
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=reason or "You don't have access to this tool"
        )
    
    tool = db.query(Tool).filter(Tool.id == tool_id, Tool.is_active == True).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    tool_usage = ToolUsage(
        user_id=current_user.id,
        tool_id=tool_id,
        status="STARTED",
        input_data=input_data,
        started_at=datetime.utcnow()
    )
    
    db.add(tool_usage)
    db.commit()
    db.refresh(tool_usage)
    
    return tool_usage

@router.put("/{tool_id}/usage/{usage_id}", response_model=ToolUsageSchema)
async def update_tool_usage(
    tool_id: int,
    usage_id: int,
    status: str = Body(...),
    result_data: dict = Body(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Update tool usage status and results.
    """
    tool_usage = db.query(ToolUsage).filter(
        ToolUsage.id == usage_id,
        ToolUsage.tool_id == tool_id,
        ToolUsage.user_id == current_user.id
    ).first()
    
    if not tool_usage:
        raise HTTPException(status_code=404, detail="Tool usage not found")
    
    if status not in ["STARTED", "IN_PROGRESS", "COMPLETED", "FAILED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    tool_usage.status = status
    
    if result_data:
        tool_usage.result_data = result_data
    
    if status in ["COMPLETED", "FAILED"]:
        tool_usage.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(tool_usage)
    
    return tool_usage

@router.post("/{tool_id}/save-progress", response_model=SavedProgressSchema)
async def save_tool_progress(
    tool_id: int,
    form_data: dict = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Save progress on a tool form.
    """
    # Check if user has access to the tool
    has_access, reason, _ = await check_tool_access(current_user, tool_id, db)
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=reason or "You don't have access to this tool"
        )
    
    tool = db.query(Tool).filter(Tool.id == tool_id, Tool.is_active == True).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Check if there's already saved progress for this tool
    saved_progress = db.query(SavedProgress).filter(
        SavedProgress.tool_id == tool_id,
        SavedProgress.user_id == current_user.id
    ).first()
    
    if saved_progress:
        # Update existing saved progress
        saved_progress.form_data = form_data
        saved_progress.saved_at = datetime.utcnow()
    else:
        # Create new saved progress
        saved_progress = SavedProgress(
            user_id=current_user.id,
            tool_id=tool_id,
            form_data=form_data,
            saved_at=datetime.utcnow()
        )
        db.add(saved_progress)
    
    db.commit()
    db.refresh(saved_progress)
    
    return saved_progress

@router.get("/{tool_id}/saved-progress", response_model=SavedProgressSchema)
async def get_saved_progress(
    tool_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get saved progress for a tool.
    """
    saved_progress = db.query(SavedProgress).filter(
        SavedProgress.tool_id == tool_id,
        SavedProgress.user_id == current_user.id
    ).first()
    
    if not saved_progress:
        raise HTTPException(status_code=404, detail="No saved progress found")
    
    return saved_progress

@router.get("/usage-stats", response_model=Dict)
async def get_usage_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get usage statistics for the current user.
    """
    # Get the current month's start date
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get count of tool usages by tool in the current month
    tool_usage_counts = {}
    usages = db.query(ToolUsage).filter(
        ToolUsage.user_id == current_user.id,
        ToolUsage.started_at >= start_of_month
    ).all()
    
    for usage in usages:
        if usage.tool_id not in tool_usage_counts:
            tool_usage_counts[usage.tool_id] = 0
        tool_usage_counts[usage.tool_id] += 1
    
    # Get all active tools
    tools = db.query(Tool).filter(Tool.is_active == True).all()
    
    # Get user's subscription and plan
    subscription = current_user.get_active_subscription()
    plan = subscription.plan if subscription else None
    
    # Build the response
    result = {
        "subscription": {
            "plan": plan.name if plan else "Free",
            "status": subscription.status if subscription else "N/A",
            "renewal_date": subscription.end_date if subscription and subscription.end_date else None
        },
        "usage_this_month": [],
        "total_usage_count": len(usages)
    }
    
    # Add usage stats for each tool
    for tool in tools:
        usage_count = tool_usage_counts.get(tool.id, 0)
        
        # Determine limit based on subscription
        if tool.is_premium:
            if not plan:
                # Free tier
                limit = tool.usage_limit_free
                remaining = limit - usage_count
            else:
                # Check plan_tool for limit
                plan_tool = db.query(PlanTool).filter(
                    PlanTool.plan_id == plan.id,
                    PlanTool.tool_id == tool.id
                ).first()
                
                if plan_tool:
                    limit = plan_tool.usage_limit
                    remaining = limit - usage_count if limit != -1 else -1
                else:
                    limit = 0
                    remaining = 0
        else:
            # Non-premium tool
            limit = -1
            remaining = -1
        
        result["usage_this_month"].append({
            "tool_id": tool.id,
            "tool_name": tool.name,
            "usage_count": usage_count,
            "limit": "Unlimited" if limit == -1 else limit,
            "remaining": "Unlimited" if remaining == -1 else remaining,
            "is_premium": tool.is_premium
        })
    
    return result

@router.post("/production-checklist/save", response_model=ToolUsageSchema)
async def save_checklist_progress(
    checklist_data: List = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Save production checklist progress.
    """
    try:
        # Find the Production Checklist tool
        tool = db.query(Tool).filter(Tool.name == "Production Checklist").first()
        if not tool:
            raise HTTPException(status_code=404, detail="Production Checklist tool not found")
        
        # Check if user has access to the tool
        has_access, reason, _ = await check_tool_access(current_user, tool.id, db)
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=reason or "You don't have access to this tool"
            )
        
        # Check if there's an existing usage record
        tool_usage = db.query(ToolUsage).filter(
            ToolUsage.user_id == current_user.id,
            ToolUsage.tool_id == tool.id,
            ToolUsage.status.in_(["STARTED", "IN_PROGRESS"])
        ).order_by(ToolUsage.started_at.desc()).first()
        
        if not tool_usage:
            # Create a new usage record
            tool_usage = ToolUsage(
                user_id=current_user.id,
                tool_id=tool.id,
                status="IN_PROGRESS",
                input_data={"checklist": checklist_data},
                started_at=datetime.utcnow()
            )
            db.add(tool_usage)
        else:
            # Update existing record
            tool_usage.input_data = {"checklist": checklist_data}
            tool_usage.status = "IN_PROGRESS"
        
        db.commit()
        db.refresh(tool_usage)
        
        # Also save to SavedProgress for compatibility
        saved_progress = db.query(SavedProgress).filter(
            SavedProgress.tool_id == tool.id,
            SavedProgress.user_id == current_user.id
        ).first()
        
        if saved_progress:
            saved_progress.form_data = {"checklist": checklist_data}
            saved_progress.saved_at = datetime.utcnow()
        else:
            saved_progress = SavedProgress(
                user_id=current_user.id,
                tool_id=tool.id,
                form_data={"checklist": checklist_data},
                saved_at=datetime.utcnow()
            )
            db.add(saved_progress)
        
        db.commit()
        
        return tool_usage
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving checklist: {str(e)}")

@router.post("/production-checklist/complete", response_model=ToolUsageSchema)
async def complete_checklist(
    checklist_data: List = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Mark production checklist as completed.
    """
    try:
        # Find the Production Checklist tool
        tool = db.query(Tool).filter(Tool.name == "Production Checklist").first()
        if not tool:
            raise HTTPException(status_code=404, detail="Production Checklist tool not found")
        
        # Check if user has access to the tool
        has_access, reason, _ = await check_tool_access(current_user, tool.id, db)
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=reason or "You don't have access to this tool"
            )
        
        # Check if there's an existing usage record
        tool_usage = db.query(ToolUsage).filter(
            ToolUsage.user_id == current_user.id,
            ToolUsage.tool_id == tool.id,
            ToolUsage.status.in_(["STARTED", "IN_PROGRESS"])
        ).order_by(ToolUsage.started_at.desc()).first()
        
        if not tool_usage:
            # Create a new usage record and mark it as completed
            tool_usage = ToolUsage(
                user_id=current_user.id,
                tool_id=tool.id,
                status="COMPLETED",
                input_data={"checklist": checklist_data},
                result_data={"completed": True},
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow()
            )
            db.add(tool_usage)
        else:
            # Update existing record and mark as completed
            tool_usage.input_data = {"checklist": checklist_data}
            tool_usage.result_data = {"completed": True}
            tool_usage.status = "COMPLETED"
            tool_usage.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(tool_usage)
        
        # Also update SavedProgress
        saved_progress = db.query(SavedProgress).filter(
            SavedProgress.tool_id == tool.id,
            SavedProgress.user_id == current_user.id
        ).first()
        
        if saved_progress:
            saved_progress.form_data = {"checklist": checklist_data, "completed": True}
            saved_progress.saved_at = datetime.utcnow()
            db.commit()
        
        return tool_usage
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error completing checklist: {str(e)}")