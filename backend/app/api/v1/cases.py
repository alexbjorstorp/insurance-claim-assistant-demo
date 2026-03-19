from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Tuple
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User as UserModel
from app.models.case import Case as CaseModel
from app.models.signal import Signal as SignalModel
from app.schemas.case import Case, CaseCreate, CaseUpdate

router = APIRouter()


def is_signal_urgent(signal: SignalModel) -> bool:
    """
    Determine if a signal is urgent based on business logic:
    1. Severity is 'critical' or 'urgent'
    2. Signal is past deadline
    3. Contains medical report keywords
    """
    # Check severity
    if signal.severity in ['critical', 'urgent']:
        return True
    
    # Check if past deadline
    if signal.deadline and signal.deadline < datetime.now():
        return True
    
    # Check for medical report keywords
    signal_text = f"{signal.title} {signal.description or ''}".lower()
    medical_keywords = ['medisch rapport', 'medisch advies', 'letselrapport', 
                       'medische beoordeling', 'medische rapportage']
    if any(keyword in signal_text for keyword in medical_keywords):
        return True
    
    return False


def get_uitgelicht_reason(case: CaseModel, db: Session) -> Tuple[bool, Optional[str], int]:
    """
    Determine if a case is "uitgelicht" (featured) based on business rules:
    1. High number of open signals (>= 3)
    2. Signal is past deadline (> 30 days old)
    3. High impact medical advice
    4. Signal with inactief dossier
    5. VSO binnengekomen
    
    Returns: (is_uitgelicht, reason, priority_order)
    Priority order determines which reason takes precedence (lower = higher priority)
    """
    # Get all unresolved signals for this case
    signals = db.query(SignalModel).filter(
        SignalModel.case_id == case.id,
        SignalModel.is_resolved == False
    ).all()
    
    if not signals:
        return False, None, 99
    
    # Check all rules and return the first match with priority
    
    # Rule 5: VSO binnengekomen (highest priority to ensure it shows)
    for signal in signals:
        signal_text = f"{signal.title}".lower()
        if 'vso' in signal_text or 'vaststellingsovereenkomst' in signal_text:
            return True, "VSO binnengekomen", 5
    
    # Rule 4: Inactief dossier
    for signal in signals:
        signal_text = f"{signal.title}".lower()
        if 'inactief' in signal_text:
            return True, "Inactief dossier", 4
    
    # Rule 3: High impact medical advice
    for signal in signals:
        signal_text = f"{signal.title} {signal.description}".lower()
        medical_keywords = ['medisch advies', 'ic opname', 'blijvend letsel', 
                           'hersenletsel', 'arbeidsongeschikt']
        if any(keyword in signal_text for keyword in medical_keywords):
            return True, "Medisch advies (hoge impact)", 3
    
    # Rule 2: Signal is past deadline (> 30 days old)
    for signal in signals:
        if signal.created_at:
            days_open = (datetime.now() - signal.created_at).days
            if days_open > 30:
                return True, f"Deadline overschreden ({days_open} dagen)", 2
    
    # Rule 1: High number of open signals (>= 3)
    if len(signals) >= 3:
        return True, f"Veel openstaande signalen ({len(signals)})", 1
    
    return False, None, 99


def get_uitgelicht_cases_for_handler(cases: list, handler_id: int, db: Session) -> list:
    """
    Get exactly 5 uitgelichte cases for a specific handler, ensuring each of the 5 
    business rules is represented by a different case.
    """
    # Filter cases for this handler
    handler_cases = [c for c in cases if c.assigned_to_id == handler_id]
    
    # Categorize cases by their uitgelicht reason
    cases_by_reason = {
        1: [],  # Veel openstaande signalen
        2: [],  # Deadline overschreden
        3: [],  # Medisch advies
        4: [],  # Inactief dossier
        5: [],  # VSO binnengekomen
    }
    
    for case in handler_cases:
        is_uitgelicht, reason, priority = get_uitgelicht_reason(case, db)
        if is_uitgelicht and priority <= 5:
            cases_by_reason[priority].append((case, reason))
    
    # Select one case per reason category (5 different cases for 5 reasons)
    selected_cases = []
    used_case_ids = set()
    
    # Go through each reason category and pick one case
    for priority in [1, 2, 3, 4, 5]:
        for case, reason in cases_by_reason[priority]:
            if case.id not in used_case_ids:
                selected_cases.append((case, reason, priority))
                used_case_ids.add(case.id)
                break
    
    return selected_cases


@router.get("/search", response_model=List[Case])
async def search_cases(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Search cases across all handlers by case number, victim name, description, etc."""
    search_pattern = f"%{q}%"
    
    # Search across multiple fields, include cases from ALL handlers
    query = db.query(CaseModel).filter(
        or_(
            CaseModel.case_number.ilike(search_pattern),
            CaseModel.claimant_name.ilike(search_pattern),
            CaseModel.description.ilike(search_pattern),
            CaseModel.category.ilike(search_pattern),
            CaseModel.schade_oorzaak.ilike(search_pattern),
            CaseModel.product.ilike(search_pattern)
        )
    ).limit(limit)
    
    cases = query.all()
    
    result_cases = []
    for case in cases:
        case_dict = Case.from_orm(case).dict()
        
        # Get all signals for this case
        all_signals = db.query(SignalModel).filter(SignalModel.case_id == case.id).all()
        unresolved_signals = [s for s in all_signals if not s.is_resolved]
        urgent_signals = [s for s in unresolved_signals if is_signal_urgent(s)]
        
        # Set signal counts
        case_dict['signal_count'] = len(unresolved_signals)
        case_dict['urgent_signal_count'] = len(urgent_signals)
        
        # Check if uitgelicht and get reason
        is_uitgelicht, reason, _ = get_uitgelicht_reason(case, db)
        case_dict['is_uitgelicht'] = is_uitgelicht
        case_dict['uitgelicht_reason'] = reason
        
        result_cases.append(Case(**case_dict))
    
    return result_cases


@router.get("", response_model=List[Case])
async def list_cases(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    uitgelicht_only: bool = Query(False, description="Only return featured cases"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """List cases with optional filtering."""
    query = db.query(CaseModel)
    
    if status:
        query = query.filter(CaseModel.status == status)
    if priority:
        query = query.filter(CaseModel.priority == priority)
    if assigned_to_id:
        query = query.filter(CaseModel.assigned_to_id == assigned_to_id)
    
    cases = query.offset(skip).limit(limit).all()
    
    # If uitgelicht_only, use the new logic to get exactly 5 cases per handler
    if uitgelicht_only:
        # Get uitgelichte cases for the current user's handler
        selected_cases = get_uitgelicht_cases_for_handler(cases, current_user.id, db)
        
        result_cases = []
        for case, reason, priority_order in selected_cases:
            case_dict = Case.from_orm(case).dict()
            
            # Get all signals for this case
            all_signals = db.query(SignalModel).filter(SignalModel.case_id == case.id).all()
            unresolved_signals = [s for s in all_signals if not s.is_resolved]
            urgent_signals = [s for s in unresolved_signals if is_signal_urgent(s)]
            
            # Set signal counts
            case_dict['signal_count'] = len(unresolved_signals)
            case_dict['urgent_signal_count'] = len(urgent_signals)
            case_dict['is_uitgelicht'] = True
            case_dict['uitgelicht_reason'] = reason
            
            result_cases.append(Case(**case_dict))
        
        return result_cases
    
    # Regular case listing (not uitgelicht_only)
    result_cases = []
    for case in cases:
        case_dict = Case.from_orm(case).dict()
        
        # Get all signals for this case
        all_signals = db.query(SignalModel).filter(SignalModel.case_id == case.id).all()
        unresolved_signals = [s for s in all_signals if not s.is_resolved]
        urgent_signals = [s for s in unresolved_signals if is_signal_urgent(s)]
        
        # Set signal counts
        case_dict['signal_count'] = len(unresolved_signals)
        case_dict['urgent_signal_count'] = len(urgent_signals)
        
        # Check if uitgelicht and get reason
        is_uitgelicht, reason, _ = get_uitgelicht_reason(case, db)
        case_dict['is_uitgelicht'] = is_uitgelicht
        case_dict['uitgelicht_reason'] = reason
        
        result_cases.append(Case(**case_dict))
    
    return result_cases


@router.post("", response_model=Case, status_code=201)
async def create_case(
    case: CaseCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Create a new case."""
    # Check if case number already exists
    existing = db.query(CaseModel).filter(CaseModel.case_number == case.case_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Case number already exists")
    
    db_case = CaseModel(**case.dict())
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    
    return db_case


@router.get("/{case_id}", response_model=Case)
async def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Get case by ID."""
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Add is_uitgelicht flag and signal counts
    case_dict = Case.from_orm(case).dict()
    
    # Get all signals for this case
    all_signals = db.query(SignalModel).filter(SignalModel.case_id == case.id).all()
    unresolved_signals = [s for s in all_signals if not s.is_resolved]
    urgent_signals = [s for s in unresolved_signals if is_signal_urgent(s)]
    
    # Set signal counts
    case_dict['signal_count'] = len(unresolved_signals)
    case_dict['urgent_signal_count'] = len(urgent_signals)
    
    # Check if uitgelicht and get reason
    is_uitgelicht, reason, _ = get_uitgelicht_reason(case, db)
    case_dict['is_uitgelicht'] = is_uitgelicht
    case_dict['uitgelicht_reason'] = reason
    
    return Case(**case_dict)


@router.put("/{case_id}", response_model=Case)
async def update_case(
    case_id: int,
    case_update: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Update a case."""
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    update_data = case_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)
    
    db.commit()
    db.refresh(case)
    
    return case


@router.delete("/{case_id}", status_code=204)
async def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Delete a case."""
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Only admin can delete
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete cases")
    
    db.delete(case)
    db.commit()
    
    return None
