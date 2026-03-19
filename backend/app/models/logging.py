from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ActionType(str, enum.Enum):
    create = "create"
    update = "update"
    delete = "delete"
    login = "login"
    logout = "logout"
    import_data = "import_data"
    export_data = "export_data"


class EntityType(str, enum.Enum):
    case = "case"
    signal = "signal"
    user = "user"
    behandelplan = "behandelplan"
    reserve = "reserve"
    timeline = "timeline"
    system = "system"


class LogEntry(Base):
    __tablename__ = "logging"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Actor
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    username = Column(String(100))  # Denormalized for audit trail
    
    # Action details
    action = Column(SQLEnum(ActionType), nullable=False, index=True)
    entity_type = Column(SQLEnum(EntityType), nullable=False, index=True)
    entity_id = Column(Integer, index=True)
    
    # Change summary
    summary = Column(String(500))
    details = Column(Text)  # JSON string with before/after values
    
    # Request context
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    request_id = Column(String(100), index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="log_entries")
    
    def __repr__(self):
        return f"<LogEntry {self.action} on {self.entity_type} by {self.username}>"
