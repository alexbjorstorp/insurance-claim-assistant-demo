from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User as UserModel
from app.models.reserve import Reserve as ReserveModel
from app.schemas.reserve import Reserve, ReserveCreate

router = APIRouter()


@router.get("", response_model=List[Reserve])
async def list_reserves(
    case_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """List reserves for a case."""
    reserves = db.query(ReserveModel).filter(
        ReserveModel.case_id == case_id
    ).order_by(ReserveModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return reserves


@router.post("", response_model=Reserve, status_code=201)
async def create_reserve(
    reserve: ReserveCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Create a new reserve entry."""
    # Set creator if not provided
    if not reserve.created_by_id:
        reserve.created_by_id = current_user.id
        reserve.created_by_name = current_user.full_name or current_user.username
    
    db_reserve = ReserveModel(**reserve.dict())
    db.add(db_reserve)
    db.commit()
    db.refresh(db_reserve)
    
    return db_reserve


@router.get("/{reserve_id}", response_model=Reserve)
async def get_reserve(
    reserve_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Get reserve by ID."""
    reserve = db.query(ReserveModel).filter(ReserveModel.id == reserve_id).first()
    if not reserve:
        raise HTTPException(status_code=404, detail="Reserve not found")
    return reserve
