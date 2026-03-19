from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from app.models.reserve import ReserveType


class ReserveBase(BaseModel):
    reserve_type: ReserveType = ReserveType.initial
    amount: Decimal
    currency: str = "USD"
    effective_date: date
    reason: Optional[str] = None
    notes: Optional[str] = None


class ReserveCreate(ReserveBase):
    case_id: int
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None


class ReserveInDB(ReserveBase):
    id: int
    case_id: int
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Reserve(ReserveInDB):
    pass
