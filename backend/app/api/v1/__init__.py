from fastapi import APIRouter
from app.api.v1 import auth, cases, signals, timeline, behandelplan, reserves, comparable_cases, import_routes, system

api_router = APIRouter()

# Auth routes (no /api/v1 prefix here, added in main.py)
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Entity routes
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(signals.router, prefix="/signals", tags=["signals"])
api_router.include_router(timeline.router, prefix="/timeline", tags=["timeline"])
api_router.include_router(behandelplan.router, prefix="/behandelplan", tags=["behandelplan"])
api_router.include_router(reserves.router, prefix="/reserves", tags=["reserves"])
api_router.include_router(comparable_cases.router, prefix="/comparable-cases", tags=["comparable-cases"])

# System routes
api_router.include_router(system.router, prefix="/system", tags=["system"])

# Import routes
api_router.include_router(import_routes.router, prefix="/import", tags=["import"])
