from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

# Tool
class ToolBase(BaseModel):
    name: str
    description: str
    icon: str
    is_active: bool = True

class ToolCreate(ToolBase):
    pass

class ToolUpdate(ToolBase):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None

class Tool(ToolBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Tool Usage
class ToolUsageBase(BaseModel):
    tool_id: int
    status: str = "STARTED"  # STARTED, IN_PROGRESS, COMPLETED, FAILED
    input_data: Optional[Dict[str, Any]] = None
    result_data: Optional[Dict[str, Any]] = None

class ToolUsageCreate(ToolUsageBase):
    pass

class ToolUsageUpdate(BaseModel):
    status: Optional[str] = None
    result_data: Optional[Dict[str, Any]] = None

class ToolUsage(ToolUsageBase):
    id: int
    user_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    tool: Optional[Tool] = None

    class Config:
        from_attributes = True

# Saved Progress
class SavedProgressBase(BaseModel):
    tool_id: int
    form_data: Dict[str, Any]

class SavedProgressCreate(SavedProgressBase):
    pass

class SavedProgressUpdate(BaseModel):
    form_data: Dict[str, Any]

class SavedProgress(SavedProgressBase):
    id: int
    user_id: int
    saved_at: datetime
    tool: Optional[Tool] = None

    class Config:
        from_attributes = True