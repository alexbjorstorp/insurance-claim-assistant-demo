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
from datetime import date, timedelta
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
    """Create demo cases."""
    today = date.today()
    
    cases_data = [
        {
            "case_number": "CLM-2026-001",
            "claim_number": "CLAIM-001",
            "policy_number": "POL-12345",
            "status": CaseStatus.in_progress,
            "priority": Priority.high,
            "sla_risk": SLARisk.medium,
            "incident_date": today - timedelta(days=15),
            "report_date": today - timedelta(days=10),
            "due_date": today + timedelta(days=5),
            "assigned_to_id": handler_user.id,
            "claimant_name": "John Smith",
            "claimant_contact": "john.smith@email.com",
            "description": "Vehicle collision claim with property damage",
            "category": "Auto",
            "subcategory": "Collision",
            "claim_amount": 15000.00,
            "estimated_reserve": 18000.00,
            "source": "manual_entry"
        },
        {
            "case_number": "CLM-2026-002",
            "claim_number": "CLAIM-002",
            "policy_number": "POL-67890",
            "status": CaseStatus.new,
            "priority": Priority.critical,
            "sla_risk": SLARisk.high,
            "incident_date": today - timedelta(days=3),
            "report_date": today - timedelta(days=2),
            "due_date": today + timedelta(days=3),
            "claimant_name": "Jane Doe",
            "claimant_contact": "jane.doe@email.com",
            "description": "Major property damage from fire",
            "category": "Property",
            "subcategory": "Fire",
            "claim_amount": 75000.00,
            "estimated_reserve": 80000.00,
            "source": "manual_entry"
        },
        {
            "case_number": "CLM-2026-003",
            "claim_number": "CLAIM-003",
            "policy_number": "POL-11111",
            "status": CaseStatus.pending_review,
            "priority": Priority.medium,
            "sla_risk": SLARisk.low,
            "incident_date": today - timedelta(days=30),
            "report_date": today - timedelta(days=28),
            "due_date": today + timedelta(days=15),
            "assigned_to_id": handler_user.id,
            "claimant_name": "Bob Johnson",
            "claimant_contact": "bob.johnson@email.com",
            "description": "Minor injury claim from slip and fall",
            "category": "Liability",
            "subcategory": "Bodily Injury",
            "claim_amount": 5000.00,
            "estimated_reserve": 6000.00,
            "source": "manual_entry"
        }
    ]
    
    created_cases = []
    for case_data in cases_data:
        # Check if case exists
        existing = db.query(Case).filter(Case.case_number == case_data["case_number"]).first()
        if existing:
            logger.info(f"Case {case_data['case_number']} already exists")
            created_cases.append(existing)
            continue
        
        case = Case(**case_data)
        db.add(case)
        db.flush()  # Get ID
        created_cases.append(case)
        logger.info(f"Created case: {case_data['case_number']}")
        
        # Add signals for each case
        create_demo_signals(db, case)
    
    db.commit()
    return created_cases


def create_demo_signals(db: Session, case: Case):
    """Create demo signals for a case.

    Each case gets at least 3 unresolved signals so they all qualify as
    'uitgelicht' (Rule 1: >= 3 open signals).  One case also gets a VSO
    signal and one gets a medisch-advies signal so the other uitgelicht
    rules are represented in the demo.
    """
    signals = []

    # ── Signals shared by every case (guarantees Rule 1: >= 3 open signals) ──
    signals.append(Signal(
        case_id=case.id,
        category=SignalCategory.proces,
        severity=SignalSeverity.warning,
        title="SLA deadline nadert",
        description="Dossier nadert de SLA-deadline en vereist opvolging.",
        is_resolved=False,
        source="system"
    ))
    signals.append(Signal(
        case_id=case.id,
        category=SignalCategory.taken,
        severity=SignalSeverity.warning,
        title="Aanvullende informatie vereist",
        description="Er ontbreekt nog informatie om het dossier af te ronden.",
        is_resolved=False,
        source="system"
    ))
    signals.append(Signal(
        case_id=case.id,
        category=SignalCategory.communicatie,
        severity=SignalSeverity.info,
        title="Contact met verzekerde uitstaand",
        description="Nog geen bevestiging ontvangen van verzekerde.",
        is_resolved=False,
        source="system"
    ))

    # ── Case-specific extra signals for richer demo variety ──────────────────
    if case.priority == Priority.critical:
        signals.append(Signal(
            case_id=case.id,
            category=SignalCategory.proces,
            severity=SignalSeverity.critical,
            title="VSO binnengekomen – beoordeling vereist",
            description="Vaststellingsovereenkomst ontvangen en wacht op goedkeuring.",
            is_resolved=False,
            source="system"
        ))

    if case.claim_amount and case.claim_amount > 50000:
        signals.append(Signal(
            case_id=case.id,
            category=SignalCategory.financieel,
            severity=SignalSeverity.warning,
            title="Medisch advies vereist bij hoge schadelast",
            description=f"Schadelast €{case.claim_amount:,.2f} overschrijdt drempel; medisch advies aanbevolen.",
            is_resolved=False,
            source="system"
        ))

    if case.sla_risk == SLARisk.high:
        signals.append(Signal(
            case_id=case.id,
            category=SignalCategory.taken,
            severity=SignalSeverity.error,
            title="SLA-risico hoog",
            description="Dossier heeft een hoog SLA-risico en vereist directe actie.",
            is_resolved=False,
            source="system"
        ))

    for signal in signals:
        db.add(signal)

    logger.info(f"Created {len(signals)} signals for case {case.case_number}")


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
