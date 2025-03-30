from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Any, List
from datetime import datetime

from app.core.security import get_current_user, get_current_active_user
from app.db.session import get_db
from app.models.models import User, Tool, ToolUsage, SavedProgress
from app.schemas.tool import Tool as ToolSchema, ToolUsage as ToolUsageSchema, SavedProgress as SavedProgressSchema

router = APIRouter()

@router.get("/", response_model=List[ToolSchema])
async def read_tools(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve tools.
    """
    tools = db.query(Tool).filter(Tool.is_active == True).offset(skip).limit(limit).all()
    return tools

@router.get("/{tool_id}", response_model=ToolSchema)
async def read_tool(
    tool_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get tool by ID.
    """
    tool = db.query(Tool).filter(Tool.id == tool_id, Tool.is_active == True).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool

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