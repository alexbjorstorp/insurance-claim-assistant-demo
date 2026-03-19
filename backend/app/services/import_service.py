import pandas as pd
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.case import Case, CaseStatus, Priority, SLARisk
from app.models.signal import Signal, SignalCategory, SignalSeverity
from app.models.logging import LogEntry, ActionType, EntityType
import logging

logger = logging.getLogger(__name__)


class ExcelImportService:
    """Service for importing Excel files into the database."""
    
    def __init__(self, db: Session):
        self.db = db
        self.stats = {
            "total_rows": 0,
            "cases_created": 0,
            "cases_updated": 0,
            "signals_created": 0,
            "errors": []
        }
    
    def calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA256 hash of file for idempotency."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def import_cases_file(self, file_path: str, user_id: Optional[int] = None) -> Dict:
        """
        Import cases from an Excel file.
        
        Expected columns:
        - case_number (required)
        - claim_number
        - policy_number
        - status
        - priority
        - sla_risk
        - incident_date
        - report_date
        - due_date
        - claimant_name
        - claimant_contact
        - description
        - category
        - subcategory
        - claim_amount
        - estimated_reserve
        """
        try:
            file_hash = self.calculate_file_hash(file_path)
            file_name = Path(file_path).name
            
            # Check if already imported
            existing_import = self.db.query(LogEntry).filter(
                LogEntry.action == ActionType.import_data,
                LogEntry.details.contains(file_hash)
            ).first()
            
            if existing_import:
                logger.warning(f"File {file_name} already imported (hash: {file_hash[:8]}...)")
                return {
                    "status": "skipped",
                    "message": "File already imported",
                    "file_hash": file_hash,
                    "stats": self.stats
                }
            
            # Read Excel file
            df = pd.read_excel(file_path, engine='openpyxl')
            self.stats["total_rows"] = len(df)
            
            logger.info(f"Importing {len(df)} rows from {file_name}")
            
            # Proces each row
            for idx, row in df.iterrows():
                try:
                    self._import_case_row(row)
                except Exception as e:
                    error_msg = f"Row {idx + 2}: {str(e)}"
                    self.stats["errors"].append(error_msg)
                    logger.error(error_msg)
            
            # Commit transaction
            self.db.commit()
            
            # Log import
            log_entry = LogEntry(
                user_id=user_id,
                action=ActionType.import_data,
                entity_type=EntityType.case,
                summary=f"Imported {file_name}",
                details=f'{{"file_hash": "{file_hash}", "file_name": "{file_name}", "stats": {self.stats}}}'
            )
            self.db.add(log_entry)
            self.db.commit()
            
            logger.info(f"Import completed: {self.stats}")
            
            return {
                "status": "success",
                "file_hash": file_hash,
                "stats": self.stats
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Import failed: {str(e)}")
            raise
    
    def _import_case_row(self, row: pd.Series):
        """Import a single case row with validation and normalization."""
        # Validate required fields
        if pd.isna(row.get('case_number')):
            raise ValueError("case_number is required")
        
        case_number = str(row['case_number']).strip()
        external_id = f"import_{case_number}"
        
        # Check if case exists (by case_number or external_id)
        existing_case = self.db.query(Case).filter(
            (Case.case_number == case_number) | (Case.external_id == external_id)
        ).first()
        
        # Normalize data
        case_data = {
            "case_number": case_number,
            "claim_number": self._get_string(row, 'claim_number'),
            "policy_number": self._get_string(row, 'policy_number'),
            "status": self._get_enum(row, 'status', CaseStatus, CaseStatus.new),
            "priority": self._get_enum(row, 'priority', Priority, Priority.medium),
            "sla_risk": self._get_enum(row, 'sla_risk', SLARisk, SLARisk.none),
            "incident_date": self._get_date(row, 'incident_date'),
            "report_date": self._get_date(row, 'report_date'),
            "due_date": self._get_date(row, 'due_date'),
            "claimant_name": self._get_string(row, 'claimant_name'),
            "claimant_contact": self._get_string(row, 'claimant_contact'),
            "description": self._get_string(row, 'description'),
            "category": self._get_string(row, 'category'),
            "subcategory": self._get_string(row, 'subcategory'),
            "claim_amount": self._get_decimal(row, 'claim_amount'),
            "estimated_reserve": self._get_decimal(row, 'estimated_reserve'),
            "source": "excel_import",
            "external_id": external_id
        }
        
        if existing_case:
            # Update existing case
            for key, value in case_data.items():
                if key not in ['case_number', 'external_id']:  # Don't update these
                    setattr(existing_case, key, value)
            self.stats["cases_updated"] += 1
            logger.debug(f"Updated case {case_number}")
        else:
            # Create new case
            new_case = Case(**case_data)
            self.db.add(new_case)
            self.db.flush()  # Get ID without committing
            self.stats["cases_created"] += 1
            logger.debug(f"Created case {case_number}")
            
            # Generate signals for new cases if needed
            self._generate_signals(new_case, row)
    
    def _generate_signals(self, case: Case, row: pd.Series):
        """Generate signals based on case data."""
        signals = []
        
        # Data quality signal if missing critical info
        if not case.claimant_name or not case.incident_date:
            signals.append(Signal(
                case_id=case.id,
                category=SignalCategory.data_quality,
                severity=SignalSeverity.warning,
                title="Incomplete case information",
                description="Missing critical case details",
                source="import_validation"
            ))
        
        # Financial signal for high claim amounts
        if case.claim_amount and case.claim_amount > 50000:
            signals.append(Signal(
                case_id=case.id,
                category=SignalCategory.financial,
                severity=SignalSeverity.warning,
                title="High claim amount",
                description=f"Claim amount: {case.claim_amount}",
                source="import_validation"
            ))
        
        # SLA risk signal
        if case.sla_risk in [SLARisk.high, SLARisk.medium]:
            signals.append(Signal(
                case_id=case.id,
                category=SignalCategory.process,
                severity=SignalSeverity.warning if case.sla_risk == SLARisk.medium else SignalSeverity.error,
                title=f"SLA risk: {case.sla_risk.value}",
                description="Case requires attention to meet SLA",
                source="import_validation"
            ))
        
        for signal in signals:
            self.db.add(signal)
            self.stats["signals_created"] += 1
    
    # Helper methods for data normalization
    def _get_string(self, row: pd.Series, col: str) -> Optional[str]:
        val = row.get(col)
        if pd.isna(val):
            return None
        return str(val).strip() if val else None
    
    def _get_date(self, row: pd.Series, col: str):
        val = row.get(col)
        if pd.isna(val):
            return None
        if isinstance(val, pd.Timestamp):
            return val.date()
        return pd.to_datetime(val).date() if val else None
    
    def _get_decimal(self, row: pd.Series, col: str):
        val = row.get(col)
        if pd.isna(val):
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None
    
    def _get_enum(self, row: pd.Series, col: str, enum_class, default):
        val = row.get(col)
        if pd.isna(val):
            return default
        try:
            val_str = str(val).lower().strip()
            return enum_class(val_str)
        except ValueError:
            return default


def import_excel_file(file_path: str, db: Session, user_id: Optional[int] = None) -> Dict:
    """
    Import an Excel file into the database.
    
    Args:
        file_path: Path to the Excel file
        db: Database session
        user_id: Optional user ID for audit logging
    
    Returns:
        Dictionary with import results
    """
    service = ExcelImportService(db)
    return service.import_cases_file(file_path, user_id)
