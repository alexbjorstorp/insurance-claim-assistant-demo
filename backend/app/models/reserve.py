from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Date, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ReserveType(str, enum.Enum):
    initial = "initial"
    revision = "revision"
    final = "final"


class Reserve(Base):
    """Financial reserve entries for a case."""
    __tablename__ = "reserves"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Reserve details
    reserve_type = Column(SQLEnum(ReserveType), nullable=False, default=ReserveType.initial)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    
    # Dates
    effective_date = Column(Date, nullable=False)
    
    # Justification
    reason = Column(Text)
    notes = Column(Text)
    
    # Approval
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_by_name = Column(String(255))  # Denormalized
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    case = relationship("Case", back_populates="reserves")
    
    def __repr__(self):
        return f"<Reserve {self.amount} {self.currency} for Case {self.case_id}>"
