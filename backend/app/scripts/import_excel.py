#!/usr/bin/env python3
"""
Import Excel file into the database.
Usage: python -m app.scripts.import_excel [--file PATH]
"""
import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.database import SessionLocal
from app.services.import_service import import_excel_file
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description='Import Excel file into database')
    parser.add_argument(
        '--file',
        type=str,
        default='/data/sample_cases.xlsx',
        help='Path to Excel file (default: /data/sample_cases.xlsx)'
    )
    parser.add_argument(
        '--user-id',
        type=int,
        default=None,
        help='User ID for audit logging'
    )
    
    args = parser.parse_args()
    
    file_path = args.file
    if not Path(file_path).exists():
        logger.error(f"File not found: {file_path}")
        sys.exit(1)
    
    logger.info(f"Importing Excel file: {file_path}")
    
    db = SessionLocal()
    try:
        result = import_excel_file(file_path, db, args.user_id)
        
        logger.info("Import completed!")
        logger.info(f"Status: {result['status']}")
        logger.info(f"Statistics: {result['stats']}")
        
        if result['stats']['errors']:
            logger.warning(f"Errors encountered:")
            for error in result['stats']['errors']:
                logger.warning(f"  - {error}")
    
    except Exception as e:
        logger.error(f"Import failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
