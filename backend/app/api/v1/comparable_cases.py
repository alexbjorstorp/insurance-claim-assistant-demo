from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User as UserModel
from app.models.comparable_case import ComparableCase as ComparableCaseModel
from app.schemas.comparable_case import ComparableCase, ComparableCaseCreate

router = APIRouter()


@router.get("", response_model=List[ComparableCase])
async def list_comparable_cases(
    case_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """List comparable cases."""
    cases = db.query(ComparableCaseModel).filter(
        ComparableCaseModel.case_id == case_id
    ).order_by(ComparableCaseModel.similarity_score.desc()).offset(skip).limit(limit).all()
    
    return cases


@router.post("", response_model=ComparableCase, status_code=201)
async def create_comparable_case(
    comparable: ComparableCaseCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Add a comparable case reference."""
    if not comparable.created_by_id:
        comparable.created_by_id = current_user.id
    
    db_comparable = ComparableCaseModel(**comparable.dict())
    db.add(db_comparable)
    db.commit()
    db.refresh(db_comparable)
    
    return db_comparable


@router.delete("/{comparable_id}", status_code=204)
async def delete_comparable_case(
    comparable_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Delete a comparable case reference."""
    comparable = db.query(ComparableCaseModel).filter(ComparableCaseModel.id == comparable_id).first()
    if not comparable:
        raise HTTPException(status_code=404, detail="Comparable case not found")
    
    db.delete(comparable)
    db.commit()
    
    return None
