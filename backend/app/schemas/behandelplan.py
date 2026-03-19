from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class BehandelplanBase(BaseModel):
    # ===== DOSSIERVERLOOP SECTION =====
    toedracht: Optional[str] = None
    causaliteitsvraag: Optional[str] = None
    dekking: Optional[bool] = None
    percentage_aansprakelijkheid: Optional[Decimal] = None
    datum_aansprakelijkheid: Optional[date] = None
    percentage_eigen_schuld: Optional[Decimal] = None
    regres_mogelijk: Optional[bool] = None
    alle_of_niets_dossier: Optional[bool] = None
    
    # ===== MEDISCHE INFORMATIE SECTION =====
    letselsoort: Optional[str] = None
    letselspecificatie: Optional[str] = None
    letsel_zijde: Optional[str] = None
    dominante_zijde_beinvloedt: Optional[bool] = None
    klachten: Optional[str] = None
    diagnose: Optional[str] = None
    beperkingen: Optional[str] = None
    bijzonderheden_pre_existente: Optional[bool] = None
    hersteld: Optional[bool] = None
    datum_eindsituatie: Optional[date] = None
    medisch_advies: Optional[str] = None
    
    # ===== ARBEIDSONGESCHIKTHEID & WERK SECTION =====
    beroep: Optional[str] = None
    dienstverband: Optional[str] = None
    omvang_dienstverband: Optional[int] = None
    netto_inkomen: Optional[Decimal] = None
    nu_arbeidsongeschikt: Optional[bool] = None
    percentage_arbeidsongeschikt: Optional[Decimal] = None
    arbeidsongeschiktheid_startdatum: Optional[date] = None
    arbeidsongeschiktheid_einddatum: Optional[date] = None
    interventies: Optional[str] = None
    prognose: Optional[str] = None
    arbeid_overweging: Optional[str] = None
    
    # ===== PRIVESITUATIE & SOCIALE OMSTANDIGHEDEN SECTION =====
    samenstelling_huishouden: Optional[str] = None
    aantal_kinderen: Optional[int] = None
    aandeel_huishoudelijke_taken: Optional[Decimal] = None
    aandeel_zelfwerkzaamheid: Optional[Decimal] = None
    nu_beperkt: Optional[bool] = None
    sociaal_startdatum: Optional[date] = None
    sociaal_overweging: Optional[str] = None
    
    # ===== STRATEGIE & SCENARIO SECTION =====
    reden_lopend_dossier: Optional[str] = None
    oplossingsrichting: Optional[str] = None
    scenarios: Optional[str] = None
    vervolgstappen: Optional[str] = None
    motivering: Optional[str] = None
    
    # ===== AI GENERATED SUMMARIES =====
    ai_summary_dossierverloop: Optional[str] = None
    ai_summary_medisch: Optional[str] = None
    ai_summary_arbeid: Optional[str] = None
    ai_summary_sociaal: Optional[str] = None
    ai_summary_strategie: Optional[str] = None
    ai_summary_overall: Optional[str] = None
    
    # ===== LEGACY FIELDS =====
    treatment_plan: Optional[str] = None
    expected_duration_days: Optional[int] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    provider_name: Optional[str] = None
    provider_contact: Optional[str] = None
    provider_specialty: Optional[str] = None
    notes: Optional[str] = None


class BehandelplanCreate(BehandelplanBase):
    case_id: int


class BehandelplanUpdate(BehandelplanBase):
    actual_end_date: Optional[date] = None
    is_approved: Optional[bool] = None
    approved_date: Optional[date] = None


class BehandelplanInDB(BehandelplanBase):
    id: int
    case_id: int
    actual_end_date: Optional[date] = None
    is_approved: Optional[bool] = None
    approved_date: Optional[date] = None
    approved_by_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Behandelplan(BehandelplanInDB):
    pass

