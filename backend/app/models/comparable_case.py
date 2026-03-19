from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ComparableCase(Base):
    """Reference to similar/comparable cases for analysis."""
    __tablename__ = "comparable_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Reference case information
    reference_case_number = Column(String(50), index=True)
    reference_case_id = Column(Integer, ForeignKey("cases.id", ondelete="SET NULL"))
    
    # Similarity metrics
    similarity_score = Column(Float)  # 0.0 to 1.0
    similarity_factors = Column(Text)  # JSON string describing similarity
    
    # Reference case summary
    summary = Column(Text)
    outcome = Column(String(100))
    settlement_amount = Column(Numeric(12, 2))
    
    # Metadata
    notes = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<ComparableCase {self.reference_case_number} for Case {self.case_id}>"
