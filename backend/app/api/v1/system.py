"""System and admin endpoints for demo management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User as UserModel
from app.models.signal import Signal as SignalModel
from app.models.reserve import Reserve as ReserveModel
from app.models.case import Case as CaseModel

router = APIRouter()


@router.post("/reset-demo")
async def reset_demo(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Reset all signals to initial demo state (keep historic resolved, clear current actions)."""
    try:
        # Reset unresolved signals: clear actions but keep the signal
        unresolved_signals = db.query(SignalModel).filter(SignalModel.is_resolved == False).all()
        for signal in unresolved_signals:
            signal.action_type = None
            signal.action_data = None
            signal.action_notes = None
            signal.action_taken_at = None
        
        # Keep only the most recent reserve for each case
        # (Delete any reserves created during demo)
        cases = db.query(CaseModel).all()
        for case in cases:
            reserves = db.query(ReserveModel).filter(
                ReserveModel.case_id == case.id
            ).order_by(ReserveModel.created_at.desc()).all()
            
            # Keep only the first (most recent from seed data)
            if len(reserves) > 1:
                for reserve in reserves[1:]:
                    db.delete(reserve)
        
        db.commit()
        
        return {
            "success": True,
            "message": "Demo reset successfully",
            "signals_reset": len(unresolved_signals),
            "cases_checked": len(cases)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting demo: {str(e)}")


@router.get("/db/tables")
async def list_tables(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """List all database tables with row counts."""
    try:
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        
        table_info = {}
        for table_name in tables:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.scalar()
                table_info[table_name] = {
                    "row_count": count,
                    "url": f"/api/v1/system/db/tables/{table_name}"
                }
            except Exception as e:
                table_info[table_name] = {
                    "row_count": "error",
                    "error": str(e)
                }
        
        return {
            "tables": table_info,
            "total_tables": len(tables)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing tables: {str(e)}")


@router.get("/db/tables/{table_name}")
async def get_table_data(
    table_name: str,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Get data from a specific table."""
    try:
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        
        if table_name not in tables:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
        
        # Get total count
        count_result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        total_count = count_result.scalar()
        
        # Get column names
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        
        # Get data with pagination
        query = text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset")
        result = db.execute(query, {"limit": limit, "offset": offset})
        rows = result.fetchall()
        
        # Convert rows to dictionaries
        data = []
        for row in rows:
            data.append(dict(zip(columns, row)))
        
        return {
            "table_name": table_name,
            "columns": columns,
            "total_rows": total_count,
            "returned_rows": len(data),
            "limit": limit,
            "offset": offset,
            "data": data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying table: {str(e)}")
