from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.timeline import TimelineEventType


class TimelineEntryBase(BaseModel):
    event_type: TimelineEventType
    title: str
    description: Optional[str] = None
    event_metadata: Optional[str] = None


class TimelineEntryCreate(TimelineEntryBase):
    case_id: int
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None


class TimelineEntryInDB(TimelineEntryBase):
    id: int
    case_id: int
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TimelineEntry(TimelineEntryInDB):
    pass
