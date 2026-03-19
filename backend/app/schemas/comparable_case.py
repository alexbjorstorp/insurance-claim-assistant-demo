from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ComparableCaseBase(BaseModel):
    reference_case_number: Optional[str] = None
    reference_case_id: Optional[int] = None
    similarity_score: Optional[float] = None
    similarity_factors: Optional[str] = None
    summary: Optional[str] = None
    outcome: Optional[str] = None
    settlement_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class ComparableCaseCreate(ComparableCaseBase):
    case_id: int
    created_by_id: Optional[int] = None


class ComparableCaseInDB(ComparableCaseBase):
    id: int
    case_id: int
    created_by_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ComparableCase(ComparableCaseInDB):
    pass
