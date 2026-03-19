from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class SignalCategory(str, enum.Enum):
    communicatie = "communicatie"
    taken = "taken"
    datakwaliteit = "datakwaliteit"
    financieel = "financieel"
    proces = "proces"


class SignalSeverity(str, enum.Enum):
    info = "info"
    warning = "warning"
    high = "high"
    error = "error"
    critical = "critical"
    urgent = "urgent"


class Signal(Base):
    __tablename__ = "signals"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Signal properties
    category = Column(SQLEnum(SignalCategory), nullable=False, index=True)
    severity = Column(SQLEnum(SignalSeverity), nullable=False, default=SignalSeverity.info, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Status
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by_id = Column(Integer, ForeignKey("users.id"))
    
    # Action tracking
    action_type = Column(String(100))  # Type of action taken
    action_data = Column(Text)  # JSON string for action-specific data
    action_notes = Column(Text)  # User notes about the action
    action_taken_at = Column(DateTime(timezone=True))
    
    # Deadline
    deadline = Column(DateTime(timezone=True))
    
    # Metadata
    source = Column(String(100))  # e.g., "system", "rule_engine", "manual"
    signal_metadata = Column("metadata", Text)  # JSON string for additional data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    case = relationship("Case", back_populates="signals")
    
    def __repr__(self):
        return f"<Signal {self.category} - {self.severity} for Case {self.case_id}>"
