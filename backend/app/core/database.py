import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


def _resolve_database_url() -> str:
    """When running as a PyInstaller bundle, store the DB next to the .exe
    so it persists between runs (not inside the temp _MEIPASS directory)."""
    url = settings.DATABASE_URL
    if url.startswith("sqlite:///") and getattr(sys, "frozen", False):
        db_filename = url.replace("sqlite:///", "").lstrip("./")
        db_path = os.path.join(os.path.dirname(sys.executable), db_filename)
        return f"sqlite:///{db_path}"
    return url


database_url = _resolve_database_url()

# SQLite-specific configuration
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
