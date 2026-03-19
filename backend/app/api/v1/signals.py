from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User as UserModel
from app.models.signal import Signal as SignalModel
from app.models.case import Case as CaseModel
from app.schemas.signal import Signal, SignalCreate, SignalUpdate, SignalAction
import json
from datetime import datetime

router = APIRouter()


@router.get("", response_model=List[Signal])
async def list_signals(
    skip: int = 0,
    limit: int = 100,
    case_id: Optional[int] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    my_cases_only: bool = Query(False, description="Only return signals for cases assigned to current user"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """List signals with optional filtering."""
    query = db.query(SignalModel)
    
    # Filter by current user's assigned cases if requested (for home page)
    if my_cases_only:
        user_case_ids = db.query(CaseModel.id).filter(CaseModel.assigned_to_id == current_user.id).all()
        user_case_ids = [c[0] for c in user_case_ids]
        query = query.filter(SignalModel.case_id.in_(user_case_ids))
    
    if case_id:
        query = query.filter(SignalModel.case_id == case_id)
    if category:
        query = query.filter(SignalModel.category == category)
    if severity:
        query = query.filter(SignalModel.severity == severity)
    if is_resolved is not None:
        query = query.filter(SignalModel.is_resolved == is_resolved)
    
    signals = query.offset(skip).limit(limit).all()
    return signals


@router.post("", response_model=Signal, status_code=201)
async def create_signal(
    signal: SignalCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Create a new signal."""
    db_signal = SignalModel(**signal.dict())
    db.add(db_signal)
    db.commit()
    db.refresh(db_signal)
    
    return db_signal


@router.get("/{signal_id}", response_model=Signal)
async def get_signal(
    signal_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Get signal by ID."""
    signal = db.query(SignalModel).filter(SignalModel.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return signal


@router.put("/{signal_id}", response_model=Signal)
async def update_signal(
    signal_id: int,
    signal_update: SignalUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Update a signal."""
    signal = db.query(SignalModel).filter(SignalModel.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    update_data = signal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(signal, field, value)
    
    # If marking as resolved, record who and when
    if update_data.get("is_resolved") and not signal.is_resolved:
        from datetime import datetime
        signal.resolved_at = datetime.utcnow()
        signal.resolved_by_id = current_user.id
    
    db.commit()
    db.refresh(signal)
    
    return signal


@router.delete("/{signal_id}", status_code=204)
async def delete_signal(
    signal_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Delete a signal."""
    signal = db.query(SignalModel).filter(SignalModel.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    db.delete(signal)
    db.commit()
    
    return None


@router.post("/{signal_id}/action", response_model=Signal)
async def perform_signal_action(
    signal_id: int,
    action: SignalAction,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Perform an action on a signal (simulated)."""
    signal = db.query(SignalModel).filter(SignalModel.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    # Store action data
    signal.action_type = action.action_type
    signal.action_data = json.dumps(action.action_data) if action.action_data else None
    signal.action_notes = action.action_notes
    signal.action_taken_at = datetime.utcnow()
    
    # Most actions resolve the signal
    if action.action_type not in ["edit_task", "change_deadline", "escalate"]:
        signal.is_resolved = True
        signal.resolved_at = datetime.utcnow()
        signal.resolved_by_id = current_user.id
    
    db.commit()
    db.refresh(signal)
    
    return signal


@router.post("/{signal_id}/resolve", response_model=Signal)
async def resolve_signal(
    signal_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Resolve a signal manually."""
    signal = db.query(SignalModel).filter(SignalModel.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    signal.is_resolved = True
    signal.resolved_at = datetime.utcnow()
    signal.resolved_by_id = current_user.id
    
    if notes:
        signal.action_notes = notes
        signal.action_type = "manual_resolve"
        signal.action_taken_at = datetime.utcnow()
    
    db.commit()
    db.refresh(signal)
    
    return signal
