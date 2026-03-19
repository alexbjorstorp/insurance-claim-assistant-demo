#!/usr/bin/env python3
"""
Seed the database with demo users and initial data.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.case import Case, CaseStatus, Priority, SLARisk
from app.models.signal import Signal, SignalCategory, SignalSeverity
from datetime import date, datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_demo_users(db: Session):
    """Create demo users."""
    users_data = [
        {
            "email": "admin@insurance.com",
            "username": "admin",
            "password": "admin123",
            "full_name": "Admin User",
            "role": UserRole.admin
        },
        {
            "email": "handler@insurance.com",
            "username": "handler",
            "password": "handler123",
            "full_name": "Case Handler",
            "role": UserRole.handler
        },
        {
            "email": "mjong@insurance.com",
            "username": "mjong",
            "password": "mjong123",
            "full_name": "Marco de Jong",
            "role": UserRole.handler
        },
        {
            "email": "viewer@insurance.com",
            "username": "viewer",
            "password": "viewer123",
            "full_name": "Viewer User",
            "role": UserRole.viewer
        }
    ]
    
    created_users = {}
    for user_data in users_data:
        # Check if user exists
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if existing:
            logger.info(f"User {user_data['username']} already exists")
            created_users[user_data["username"]] = existing
            continue
        
        user = User(
            email=user_data["email"],
            username=user_data["username"],
            hashed_password=get_password_hash(user_data["password"]),
            full_name=user_data["full_name"],
            role=user_data["role"],
            is_active=True
        )
        db.add(user)
        created_users[user_data["username"]] = user
        logger.info(f"Created user: {user_data['username']}")
    
    db.commit()
    return created_users


def create_demo_cases(db: Session, handler_user: User):
    """Create 5 demo cases, each triggering a different uitgelicht rule."""
    today = date.today()

    # Each tuple: (case_data, signal_creator_fn)
    cases_with_signals = [
        # ── Rule 5: VSO binnengekomen ────────────────────────────────────────
        (
            {
                "case_number": "CLM-2026-001",
                "claim_number": "CLAIM-001",
                "policy_number": "POL-12345",
                "status": CaseStatus.in_progress,
                "priority": Priority.critical,
                "sla_risk": SLARisk.high,
                "incident_date": today - timedelta(days=5),
                "report_date": today - timedelta(days=3),
                "due_date": today + timedelta(days=3),
                "assigned_to_id": handler_user.id,
                "claimant_name": "Peter van Dijk",
                "claimant_contact": "p.vandijk@email.com",
                "description": "Ernstig verkeersongeval, verzekerde heeft VSO aangeboden",
                "category": "Auto",
                "subcategory": "Aanrijding",
                "claim_amount": 85000.00,
                "estimated_reserve": 90000.00,
                "source": "manual_entry",
            },
            _signals_vso,
        ),
        # ── Rule 4: Inactief dossier ─────────────────────────────────────────
        (
            {
                "case_number": "CLM-2026-002",
                "claim_number": "CLAIM-002",
                "policy_number": "POL-67890",
                "status": CaseStatus.in_progress,
                "priority": Priority.medium,
                "sla_risk": SLARisk.medium,
                "incident_date": today - timedelta(days=90),
                "report_date": today - timedelta(days=88),
                "due_date": today + timedelta(days=20),
                "assigned_to_id": handler_user.id,
                "claimant_name": "Maria Jansen",
                "claimant_contact": "m.jansen@email.com",
                "description": "Brandschade aan woning, al langere tijd geen voortgang",
                "category": "Opstal",
                "subcategory": "Brand",
                "claim_amount": 42000.00,
                "estimated_reserve": 45000.00,
                "source": "manual_entry",
            },
            _signals_inactief,
        ),
        # ── Rule 3: Medisch advies (hoge impact) ─────────────────────────────
        (
            {
                "case_number": "CLM-2026-003",
                "claim_number": "CLAIM-003",
                "policy_number": "POL-11111",
                "status": CaseStatus.pending_review,
                "priority": Priority.high,
                "sla_risk": SLARisk.medium,
                "incident_date": today - timedelta(days=45),
                "report_date": today - timedelta(days=42),
                "due_date": today + timedelta(days=10),
                "assigned_to_id": handler_user.id,
                "claimant_name": "Thomas de Groot",
                "claimant_contact": "t.degroot@email.com",
                "description": "Letselschade na val op het werk, medisch rapport vereist",
                "category": "Aansprakelijkheid",
                "subcategory": "Letsel",
                "claim_amount": 28000.00,
                "estimated_reserve": 32000.00,
                "source": "manual_entry",
            },
            _signals_medisch,
        ),
        # ── Rule 2: Deadline overschreden ────────────────────────────────────
        (
            {
                "case_number": "CLM-2026-004",
                "claim_number": "CLAIM-004",
                "policy_number": "POL-22222",
                "status": CaseStatus.in_progress,
                "priority": Priority.high,
                "sla_risk": SLARisk.high,
                "incident_date": today - timedelta(days=60),
                "report_date": today - timedelta(days=58),
                "due_date": today + timedelta(days=2),
                "assigned_to_id": handler_user.id,
                "claimant_name": "Sophie Bakker",
                "claimant_contact": "s.bakker@email.com",
                "description": "Waterschade na lekkage, signalen al lang open",
                "category": "Opstal",
                "subcategory": "Waterschade",
                "claim_amount": 19000.00,
                "estimated_reserve": 22000.00,
                "source": "manual_entry",
            },
            _signals_deadline,
        ),
        # ── Rule 1: Veel openstaande signalen ────────────────────────────────
        (
            {
                "case_number": "CLM-2026-005",
                "claim_number": "CLAIM-005",
                "policy_number": "POL-33333",
                "status": CaseStatus.new,
                "priority": Priority.medium,
                "sla_risk": SLARisk.low,
                "incident_date": today - timedelta(days=10),
                "report_date": today - timedelta(days=8),
                "due_date": today + timedelta(days=30),
                "assigned_to_id": handler_user.id,
                "claimant_name": "Lars Visser",
                "claimant_contact": "l.visser@email.com",
                "description": "Inbraakschade aan bedrijfspand, meerdere acties uitstaand",
                "category": "Inboedel",
                "subcategory": "Inbraak",
                "claim_amount": 11000.00,
                "estimated_reserve": 13000.00,
                "source": "manual_entry",
            },
            _signals_veel,
        ),
    ]

    created_cases = []
    for case_data, signal_fn in cases_with_signals:
        existing = db.query(Case).filter(Case.case_number == case_data["case_number"]).first()
        if existing:
            logger.info(f"Case {case_data['case_number']} already exists")
            created_cases.append(existing)
            continue

        case = Case(**case_data)
        db.add(case)
        db.flush()
        signal_fn(db, case)
        created_cases.append(case)
        logger.info(f"Created case: {case_data['case_number']}")

    db.commit()
    return created_cases


# ── Signal creators — one per uitgelicht rule ─────────────────────────────────

def _signals_vso(db: Session, case: Case):
    """Rule 5: VSO binnengekomen."""
    _add(db, case, SignalCategory.proces, SignalSeverity.critical,
         "VSO binnengekomen – beoordeling vereist",
         "Vaststellingsovereenkomst ontvangen, goedkeuring directie vereist.")
    _add(db, case, SignalCategory.taken, SignalSeverity.warning,
         "Juridische toetsing VSO vereist",
         "Concept VSO moet worden getoetst door juridische afdeling.")
    _add(db, case, SignalCategory.communicatie, SignalSeverity.info,
         "Verzekerde wacht op reactie",
         "Verzekerde heeft aangegeven binnen 5 dagen reactie te verwachten.")


def _signals_inactief(db: Session, case: Case):
    """Rule 4: Inactief dossier."""
    _add(db, case, SignalCategory.proces, SignalSeverity.error,
         "Inactief dossier – geen voortgang geboekt",
         "Al 60 dagen geen activiteit op dit dossier.")
    _add(db, case, SignalCategory.taken, SignalSeverity.warning,
         "Opvolging vereist bij inactief dossier",
         "Dossier moet worden opgepakt en voortgang vastgelegd.")
    _add(db, case, SignalCategory.communicatie, SignalSeverity.warning,
         "Geen contact met verzekerde",
         "Laatste contact meer dan 30 dagen geleden.")


def _signals_medisch(db: Session, case: Case):
    """Rule 3: Medisch advies (hoge impact)."""
    _add(db, case, SignalCategory.taken, SignalSeverity.critical,
         "Medisch advies vereist",
         "Letselrapport ontbreekt; medisch advies noodzakelijk voor verdere behandeling.")
    _add(db, case, SignalCategory.proces, SignalSeverity.warning,
         "Behandeling geblokkeerd op medisch advies",
         "Dossier kan niet worden afgerond zonder medische beoordeling.")
    _add(db, case, SignalCategory.communicatie, SignalSeverity.info,
         "Medisch specialist geraadpleegd",
         "Afspraak met specialist staat gepland.")


def _signals_deadline(db: Session, case: Case):
    """Rule 2: Signal past deadline (> 30 days old)."""
    old_date = datetime.now() - timedelta(days=45)
    _add(db, case, SignalCategory.taken, SignalSeverity.error,
         "Actie vereist – reactietermijn overschreden",
         "Reactietermijn is al 45 dagen geleden verstreken.",
         created_at=old_date)
    _add(db, case, SignalCategory.proces, SignalSeverity.warning,
         "Dossierbehandeling vertraagd",
         "Vertraging in dossierbehandeling vereist directe opvolging.")
    _add(db, case, SignalCategory.communicatie, SignalSeverity.info,
         "Rappel verstuurd aan verzekerde",
         "Tweede rappel verstuurd, nog geen reactie ontvangen.")


def _signals_veel(db: Session, case: Case):
    """Rule 1: >= 3 open signals."""
    _add(db, case, SignalCategory.taken, SignalSeverity.warning,
         "Offerte herstelwerkzaamheden ontbreekt",
         "Offerte van aannemer nog niet ontvangen.")
    _add(db, case, SignalCategory.datakwaliteit, SignalSeverity.warning,
         "Polisinformatie onvolledig",
         "Dekking kan niet worden vastgesteld door ontbrekende polisgegevens.")
    _add(db, case, SignalCategory.communicatie, SignalSeverity.info,
         "Getuigenverklaring uitstaand",
         "Verklaring van getuige is aangevraagd maar nog niet ontvangen.")
    _add(db, case, SignalCategory.financieel, SignalSeverity.info,
         "Eigen risico nog niet verrekend",
         "Eigen risico dient te worden verrekend bij schadeafwikkeling.")


def _add(db: Session, case: Case, category, severity, title: str,
         description: str, created_at=None):
    """Helper to add a single unresolved signal."""
    signal = Signal(
        case_id=case.id,
        category=category,
        severity=severity,
        title=title,
        description=description,
        is_resolved=False,
        source="system",
    )
    if created_at:
        signal.created_at = created_at
    db.add(signal)


def main():
    """Main seeding function."""
    logger.info("Starting database seeding...")
    
    db = SessionLocal()
    try:
        # Create users
        logger.info("Creating demo users...")
        users = create_demo_users(db)
        
        # Create cases — assign to Marco de Jong for demo
        logger.info("Creating demo cases...")
        handler = users.get("mjong")
        if handler:
            cases = create_demo_cases(db, handler)
        
        logger.info("Database seeding completed successfully!")
        logger.info("\nDemo credentials:")
        logger.info("  Admin: username=admin, password=admin123")
        logger.info("  Handler: username=handler, password=handler123")
        logger.info("  Viewer: username=viewer, password=viewer123")
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
