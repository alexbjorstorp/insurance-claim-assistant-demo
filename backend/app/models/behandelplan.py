from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Date, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Behandelplan(Base):
    """Treatment plan for a case."""
    __tablename__ = "behandelplan"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # ===== DOSSIERVERLOOP SECTION =====
    toedracht = Column(Text)  # Description of incident
    causaliteitsvraag = Column(Text)  # Causality question
    dekking = Column(Boolean)  # Coverage (yes/no)
    percentage_aansprakelijkheid = Column(Numeric(5, 2))  # Liability percentage
    datum_aansprakelijkheid = Column(Date)  # Date liability agreed
    percentage_eigen_schuld = Column(Numeric(5, 2))  # Own fault percentage
    regres_mogelijk = Column(Boolean)  # Recourse possible
    alle_of_niets_dossier = Column(Boolean)  # All-or-nothing case
    
    # ===== MEDISCHE INFORMATIE SECTION =====
    letselsoort = Column(String(255))  # Injury type
    letselspecificatie = Column(String(255))  # Injury specification
    letsel_zijde = Column(String(50))  # Injury side (links/rechts/beide/nvt)
    dominante_zijde_beinvloedt = Column(Boolean)  # Dominant side affected
    klachten = Column(Text)  # Complaints
    diagnose = Column(Text)  # Diagnosis
    beperkingen = Column(Text)  # Limitations
    bijzonderheden_pre_existente = Column(Boolean)  # Pre-existing conditions
    hersteld = Column(Boolean)  # Recovered
    datum_eindsituatie = Column(Date)  # Date end situation reached
    medisch_advies = Column(Text)  # Medical advice
    
    # ===== ARBEIDSONGESCHIKTHEID & WERK SECTION =====
    beroep = Column(String(255))  # Occupation
    dienstverband = Column(String(100))  # Employment type (vast/tijdelijk/zzp/nvt)
    omvang_dienstverband = Column(Integer)  # Hours per week
    netto_inkomen = Column(Numeric(10, 2))  # Net monthly income
    nu_arbeidsongeschikt = Column(Boolean)  # Currently unable to work
    percentage_arbeidsongeschikt = Column(Numeric(5, 2))  # Disability percentage
    arbeidsongeschiktheid_startdatum = Column(Date)  # Disability start date
    arbeidsongeschiktheid_einddatum = Column(Date)  # Disability end date
    interventies = Column(Text)  # Interventions
    prognose = Column(Text)  # Prognosis
    arbeid_overweging = Column(Text)  # Work considerations
    
    # ===== PRIVESITUATIE & SOCIALE OMSTANDIGHEDEN SECTION =====
    samenstelling_huishouden = Column(String(100))  # Household composition
    aantal_kinderen = Column(Integer)  # Number of children
    aandeel_huishoudelijke_taken = Column(Numeric(5, 2))  # Household tasks percentage
    aandeel_zelfwerkzaamheid = Column(Numeric(5, 2))  # Self-sufficiency percentage
    nu_beperkt = Column(Boolean)  # Currently limited
    sociaal_startdatum = Column(Date)  # Social limitations start date
    sociaal_overweging = Column(Text)  # Social considerations
    
    # ===== STRATEGIE & SCENARIO SECTION =====
    reden_lopend_dossier = Column(Text)  # Reason ongoing case
    oplossingsrichting = Column(Text)  # Solution direction
    scenarios = Column(Text)  # Scenarios
    vervolgstappen = Column(Text)  # Next steps
    motivering = Column(Text)  # Motivation
    
    # ===== AI GENERATED SUMMARIES =====
    ai_summary_dossierverloop = Column(Text)  # AI summary of case flow
    ai_summary_medisch = Column(Text)  # AI summary of medical info
    ai_summary_arbeid = Column(Text)  # AI summary of work situation
    ai_summary_sociaal = Column(Text)  # AI summary of social situation
    ai_summary_strategie = Column(Text)  # AI summary of strategy
    ai_summary_overall = Column(Text)  # Overall AI summary
    
    # ===== LEGACY FIELDS (kept for backward compatibility) =====
    treatment_plan = Column(Text)
    expected_duration_days = Column(Integer)
    start_date = Column(Date)
    expected_end_date = Column(Date)
    actual_end_date = Column(Date)
    provider_name = Column(String(255))
    provider_contact = Column(String(255))
    provider_specialty = Column(String(100))
    is_approved = Column(Boolean, default=False)
    approved_date = Column(Date)
    approved_by_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    case = relationship("Case", back_populates="behandelplan")
    
    def __repr__(self):
        return f"<Behandelplan for Case {self.case_id}>"
