"""Smart Event Management Platform — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.core.database import check_db_connection
from app.api.router import api_router


app = FastAPI(
    title=settings.app_title,
    description=settings.app_description,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============================================================
# CORS
# ============================================================

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://smart-event-management-platform-beta.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression for responses > 1KB for ultra-fast payload transfer
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(
    api_router,
    prefix=settings.api_prefix,
)


# ============================================================
# HEALTH / ROOT
# ============================================================

@app.get("/", tags=["Health"])
def root():
    """Root health check."""
    return {
        "service": settings.app_title,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    """Health check including database connectivity."""
    db_ok = check_db_connection()

    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "version": settings.app_version,
    }