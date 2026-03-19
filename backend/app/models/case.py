from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Numeric, Date, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class CaseStatus(str, enum.Enum):
    new = "new"
    in_progress = "in_progress"
    pending_review = "pending_review"
    approved = "approved"
    rejected = "rejected"
    closed = "closed"


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class SLARisk(str, enum.Enum):
    none = "none"
    low = "low"
    medium = "medium"
    high = "high"


class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    claim_number = Column(String(50), index=True)
    policy_number = Column(String(50), index=True)
    
    # Status and priority
    status = Column(SQLEnum(CaseStatus), nullable=False, default=CaseStatus.new, index=True)
    priority = Column(SQLEnum(Priority), nullable=False, default=Priority.medium, index=True)
    sla_risk = Column(SQLEnum(SLARisk), nullable=False, default=SLARisk.none, index=True)
    
    # Dates
    incident_date = Column(Date)
    report_date = Column(Date)
    due_date = Column(Date)
    closed_date = Column(Date)
    
    # Assignment
    assigned_to_id = Column(Integer, ForeignKey("users.id"))
    
    # Claimant information
    claimant_name = Column(String(255))
    claimant_contact = Column(String(255))
    
    # Case details
    description = Column(Text)
    category = Column(String(100))
    subcategory = Column(String(100))
    schade_oorzaak = Column(String(255))  # Cause of damage
    product = Column(String(100))  # Insurance product
    
    # Financial
    claim_amount = Column(Numeric(12, 2))
    estimated_reserve = Column(Numeric(12, 2))
    
    # Metadata
    source = Column(String(50))  # e.g., "excel_import", "manual_entry", "api"
    external_id = Column(String(100), index=True)  # For idempotent imports
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    assigned_to_user = relationship("User", back_populates="assigned_cases", foreign_keys=[assigned_to_id])
    signals = relationship("Signal", back_populates="case", cascade="all, delete-orphan")
    timeline_entries = relationship("TimelineEntry", back_populates="case", cascade="all, delete-orphan")
    behandelplan = relationship("Behandelplan", back_populates="case", uselist=False, cascade="all, delete-orphan")
    reserves = relationship("Reserve", back_populates="case", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Case {self.case_number} - {self.status}>"
