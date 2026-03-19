from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User as UserModel
from app.models.timeline import TimelineEntry as TimelineModel
from app.schemas.timeline import TimelineEntry, TimelineEntryCreate

router = APIRouter()


@router.get("", response_model=List[TimelineEntry])
async def list_timeline_entries(
    case_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """List timeline entries for a case."""
    entries = db.query(TimelineModel).filter(
        TimelineModel.case_id == case_id
    ).order_by(TimelineModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return entries


@router.post("", response_model=TimelineEntry, status_code=201)
async def create_timeline_entry(
    entry: TimelineEntryCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Create a new timeline entry."""
    # Set creator if not provided
    if not entry.created_by_id:
        entry.created_by_id = current_user.id
        entry.created_by_name = current_user.full_name or current_user.username
    
    db_entry = TimelineModel(**entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return db_entry
