from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User as UserModel
from app.models.case import Case as CaseModel
from app.models.behandelplan import Behandelplan as BehandelplanModel
from app.schemas.behandelplan import Behandelplan, BehandelplanCreate, BehandelplanUpdate
from app.services.llm_service import generate_all_summaries
from app.services.html_service import generate_behandelplan_html

router = APIRouter()


@router.get("/{case_id}", response_model=Behandelplan)
async def get_behandelplan(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Get treatment plan for a case."""
    plan = db.query(BehandelplanModel).filter(BehandelplanModel.case_id == case_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    return plan


@router.post("", response_model=Behandelplan, status_code=201)
async def create_behandelplan(
    plan: BehandelplanCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Create a treatment plan."""
    # Check if plan already exists
    existing = db.query(BehandelplanModel).filter(BehandelplanModel.case_id == plan.case_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Treatment plan already exists for this case")
    
    db_plan = BehandelplanModel(**plan.dict())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    
    return db_plan


@router.put("/{case_id}", response_model=Behandelplan)
async def update_behandelplan(
    case_id: int,
    plan_update: BehandelplanUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Update a treatment plan."""
    plan = db.query(BehandelplanModel).filter(BehandelplanModel.case_id == case_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    
    update_data = plan_update.dict(exclude_unset=True)
    
    # If approving, record who approved
    if update_data.get("is_approved") and not plan.is_approved:
        plan.approved_by_id = current_user.id
    
    for field, value in update_data.items():
        setattr(plan, field, value)
    
    db.commit()
    db.refresh(plan)
    
    return plan


@router.post("/{case_id}/generate-summaries", response_model=Behandelplan)
async def generate_summaries(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Generate AI summaries for all behandelplan sections."""
    plan = db.query(BehandelplanModel).filter(BehandelplanModel.case_id == case_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    
    # Get case data
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Prepare data for LLM
    behandelplan_data = {
        "toedracht": plan.toedracht,
        "causaliteitsvraag": plan.causaliteitsvraag,
        "dekking": plan.dekking,
        "percentage_aansprakelijkheid": plan.percentage_aansprakelijkheid,
        "datum_aansprakelijkheid": plan.datum_aansprakelijkheid,
        "percentage_eigen_schuld": plan.percentage_eigen_schuld,
        "regres_mogelijk": plan.regres_mogelijk,
        "alle_of_niets_dossier": plan.alle_of_niets_dossier,
        "letselsoort": plan.letselsoort,
        "letselspecificatie": plan.letselspecificatie,
        "letsel_zijde": plan.letsel_zijde,
        "dominante_zijde_beinvloedt": plan.dominante_zijde_beinvloedt,
        "klachten": plan.klachten,
        "diagnose": plan.diagnose,
        "beperkingen": plan.beperkingen,
        "bijzonderheden_pre_existente": plan.bijzonderheden_pre_existente,
        "hersteld": plan.hersteld,
        "datum_eindsituatie": plan.datum_eindsituatie,
        "medisch_advies": plan.medisch_advies,
        "beroep": plan.beroep,
        "dienstverband": plan.dienstverband,
        "omvang_dienstverband": plan.omvang_dienstverband,
        "netto_inkomen": plan.netto_inkomen,
        "nu_arbeidsongeschikt": plan.nu_arbeidsongeschikt,
        "percentage_arbeidsongeschikt": plan.percentage_arbeidsongeschikt,
        "arbeidsongeschiktheid_startdatum": plan.arbeidsongeschiktheid_startdatum,
        "arbeidsongeschiktheid_einddatum": plan.arbeidsongeschiktheid_einddatum,
        "interventies": plan.interventies,
        "prognose": plan.prognose,
        "arbeid_overweging": plan.arbeid_overweging,
        "samenstelling_huishouden": plan.samenstelling_huishouden,
        "aantal_kinderen": plan.aantal_kinderen,
        "aandeel_huishoudelijke_taken": plan.aandeel_huishoudelijke_taken,
        "aandeel_zelfwerkzaamheid": plan.aandeel_zelfwerkzaamheid,
        "nu_beperkt": plan.nu_beperkt,
        "sociaal_startdatum": plan.sociaal_startdatum,
        "sociaal_overweging": plan.sociaal_overweging,
        "reden_lopend_dossier": plan.reden_lopend_dossier,
        "oplossingsrichting": plan.oplossingsrichting,
        "scenarios": plan.scenarios,
        "vervolgstappen": plan.vervolgstappen,
        "motivering": plan.motivering
    }
    
    case_info = {
        "case_number": case.case_number,
        "claimant_name": case.claimant_name,
        "claim_amount": case.claim_amount,
        "status": case.status.value if case.status else None
    }
    
    # Generate summaries
    summaries = generate_all_summaries(behandelplan_data, case_info)
    
    # Update plan with summaries
    for key, value in summaries.items():
        setattr(plan, key, value)
    
    db.commit()
    db.refresh(plan)
    
    return plan


@router.get("/{case_id}/export-pdf")
async def export_pdf(
    case_id: int,
    dark_mode: bool = False,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Export behandelplan as HTML with AI summaries."""
    plan = db.query(BehandelplanModel).filter(BehandelplanModel.case_id == case_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    
    # Get case data
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Check if summaries exist, if not generate them
    if not plan.ai_summary_overall:
        # Prepare data and generate summaries
        behandelplan_data = {k: v for k, v in plan.__dict__.items() if not k.startswith('_')}
        case_info = {
            "case_number": case.case_number,
            "claimant_name": case.claimant_name,
            "claim_amount": case.claim_amount,
            "status": case.status.value if case.status else None
        }
        
        summaries = generate_all_summaries(behandelplan_data, case_info)
        
        # Update plan with summaries
        for key, value in summaries.items():
            setattr(plan, key, value)
        
        db.commit()
        db.refresh(plan)
    
    # Prepare data for PDF
    case_data = {
        "case_number": case.case_number,
        "claimant_name": case.claimant_name,
        "claim_amount": case.claim_amount,
        "incident_date": case.incident_date,
        "status": case.status.value if case.status else None
    }
    
    behandelplan_data = {k: v for k, v in plan.__dict__.items() if not k.startswith('_')}
    
    summaries = {
        "ai_summary_dossierverloop": plan.ai_summary_dossierverloop,
        "ai_summary_medisch": plan.ai_summary_medisch,
        "ai_summary_arbeid": plan.ai_summary_arbeid,
        "ai_summary_sociaal": plan.ai_summary_sociaal,
        "ai_summary_strategie": plan.ai_summary_strategie,
        "ai_summary_overall": plan.ai_summary_overall
    }
    
    # Generate HTML
    html_content = generate_behandelplan_html(case_data, behandelplan_data, summaries, dark_mode)
    
    # Return HTML as response
    return Response(
        content=html_content,
        media_type="text/html",
        headers={
            "Content-Disposition": f'inline; filename="behandelplan_{case.case_number}.html"'
        }
    )

