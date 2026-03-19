import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.v1 import api_router
import logging

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="EYE on Claims API with AI-assisted workflow",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Include API router
app.include_router(api_router, prefix="/api/v1")


def _get_static_dir() -> str | None:
    """Resolve the path to the built React app.

    - Frozen (PyInstaller): files are extracted to sys._MEIPASS/static
    - Normal run: backend/static (populated by the CI build step)
    """
    if getattr(sys, "frozen", False):
        candidate = os.path.join(sys._MEIPASS, "static")
    else:
        candidate = os.path.join(os.path.dirname(__file__), "..", "static")
        candidate = os.path.abspath(candidate)
    return candidate if os.path.isdir(candidate) else None


_static_dir = _get_static_dir()
if _static_dir:
    # Serve JS/CSS/image assets (Vite puts them in assets/)
    assets_path = os.path.join(_static_dir, "assets")
    if os.path.isdir(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Serve static files when they exist, otherwise serve the React SPA."""
        file_path = os.path.join(_static_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_static_dir, "index.html"))


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Demo mode: {settings.DEMO_MODE}")
    logger.info(f"API Documentation: /docs")

    # Auto-create tables and seed database if empty (used in demo/packaged build)
    if settings.DEMO_MODE:
        from app.core.database import engine
        import app.models  # noqa: ensure all models are registered
        from app.core.database import Base
        Base.metadata.create_all(bind=engine)

        from app.core.database import SessionLocal
        from app.models.user import User
        db = SessionLocal()
        try:
            if db.query(User).count() == 0:
                logger.info("Empty database — seeding demo data...")
                from app.scripts.seed_data import main as seed_main
                seed_main()
                logger.info("Demo data seeded successfully.")
        except Exception as seed_err:
            logger.error(f"Failed to seed demo data: {seed_err}", exc_info=True)
        finally:
            db.close()


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    logger.info(f"Shutting down {settings.APP_NAME}")
