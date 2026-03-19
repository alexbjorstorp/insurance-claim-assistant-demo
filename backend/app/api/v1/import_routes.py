"""
Import API endpoints for Excel file uploads.
"""
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict
import tempfile
import os
from pathlib import Path

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.services.import_service import ExcelImportService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/cases", response_model=Dict)
async def import_cases(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import cases from an Excel file.
    
    Expected columns:
    - case_number (required)
    - claim_number
    - policy_number
    - status (new/in_progress/pending_review/approved/rejected/closed)
    - priority (low/medium/high/critical)
    - sla_risk (none/low/medium/high)
    - incident_date (YYYY-MM-DD)
    - report_date (YYYY-MM-DD)
    - due_date (YYYY-MM-DD)
    - claimant_name
    - claimant_contact
    - description
    - category
    - subcategory
    - claim_amount
    - estimated_reserve
    - source
    
    Only admins and handlers can import data.
    """
    # Check permissions
    if current_user.role not in [UserRole.admin, UserRole.handler]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and handlers can import data"
        )
    
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files (.xlsx, .xls) are supported"
        )
    
    # Save uploaded file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        logger.info(f"User {current_user.username} uploading file: {file.filename}")
        
        # Import the file
        import_service = ExcelImportService(db)
        result = import_service.import_cases_file(tmp_file_path, user_id=current_user.id)
        
        logger.info(f"Import completed: {result}")
        
        return result
        
    except Exception as e:
        logger.error(f"Import error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing file: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)


@router.get("/template")
async def download_template(
    current_user: User = Depends(get_current_user)
):
    """
    Download an Excel template for case imports.
    """
    from fastapi.responses import FileResponse
    
    # Return template info
    return {
        "message": "Use the generate_sample_excel.py script to create a template",
        "columns": [
            "case_number", "claim_number", "policy_number", "status", "priority",
            "sla_risk", "incident_date", "report_date", "due_date", "claimant_name",
            "claimant_contact", "description", "category", "subcategory",
            "claim_amount", "estimated_reserve", "source"
        ],
        "example_values": {
            "status": "new, in_progress, pending_review, approved, rejected, closed",
            "priority": "low, medium, high, critical",
            "sla_risk": "none, low, medium, high",
            "dates": "YYYY-MM-DD format"
        }
    }
