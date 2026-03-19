from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.signal import SignalCategory, SignalSeverity


class SignalBase(BaseModel):
    category: SignalCategory
    severity: SignalSeverity = SignalSeverity.info
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    source: Optional[str] = "manual"
    signal_metadata: Optional[str] = None


class SignalCreate(SignalBase):
    case_id: int


class SignalUpdate(BaseModel):
    severity: Optional[SignalSeverity] = None
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    is_resolved: Optional[bool] = None


class SignalAction(BaseModel):
    action_type: str
    action_data: Optional[dict] = None
    action_notes: Optional[str] = None


class SignalInDB(SignalBase):
    id: int
    case_id: int
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by_id: Optional[int] = None
    action_type: Optional[str] = None
    action_data: Optional[str] = None
    action_notes: Optional[str] = None
    action_taken_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Signal(SignalInDB):
    pass
