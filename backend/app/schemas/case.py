from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from app.models.case import CaseStatus, Priority, SLARisk


class CaseBase(BaseModel):
    case_number: str
    claim_number: Optional[str] = None
    policy_number: Optional[str] = None
    status: CaseStatus = CaseStatus.new
    priority: Priority = Priority.medium
    sla_risk: SLARisk = SLARisk.none
    incident_date: Optional[date] = None
    report_date: Optional[date] = None
    due_date: Optional[date] = None
    claimant_name: Optional[str] = None
    claimant_contact: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    schade_oorzaak: Optional[str] = None
    product: Optional[str] = None
    claim_amount: Optional[Decimal] = None
    estimated_reserve: Optional[Decimal] = None


class CaseCreate(CaseBase):
    assigned_to_id: Optional[int] = None
    source: str = "manual_entry"
    external_id: Optional[str] = None


class CaseUpdate(BaseModel):
    status: Optional[CaseStatus] = None
    priority: Optional[Priority] = None
    sla_risk: Optional[SLARisk] = None
    due_date: Optional[date] = None
    closed_date: Optional[date] = None
    assigned_to_id: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    schade_oorzaak: Optional[str] = None
    product: Optional[str] = None
    claim_amount: Optional[Decimal] = None
    estimated_reserve: Optional[Decimal] = None


class CaseInDB(CaseBase):
    id: int
    assigned_to_id: Optional[int] = None
    closed_date: Optional[date] = None
    source: Optional[str] = None
    external_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Case(CaseInDB):
    is_uitgelicht: bool = False
    signal_count: int = 0
    urgent_signal_count: int = 0
    uitgelicht_reason: Optional[str] = None