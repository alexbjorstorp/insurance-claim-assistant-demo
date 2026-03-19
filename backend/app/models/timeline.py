from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class TimelineEventType(str, enum.Enum):
    case_created = "case_created"
    status_changed = "status_changed"
    assignment_changed = "assignment_changed"
    note_added = "note_added"
    document_uploaded = "document_uploaded"
    signal_generated = "signal_generated"
    contact_made = "contact_made"
    payment_made = "payment_made"
    communicatie = "Communicatie"
    other = "other"


class TimelineEntry(Base):
    __tablename__ = "timeline"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Event details
    event_type = Column(String(50), nullable=False)  # Changed from SQLEnum to String for flexibility
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Actor
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_by_name = Column(String(255))  # Denormalized for historical record
    
    # Metadata
    event_metadata = Column("metadata", Text)  # JSON string for event-specific data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    case = relationship("Case", back_populates="timeline_entries")
    
    def __repr__(self):
        return f"<TimelineEntry {self.event_type} for Case {self.case_id}>"
