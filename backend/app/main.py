"""
Application entry point.

Responsibilities:
  * create the FastAPI app + metadata (title, docs),
  * enable CORS for the React dev server,
  * create database tables on startup,
  * mount every router under the /api prefix,
  * expose a /health check.

Run with:  uvicorn app.main:app --reload
Docs at:   http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401  (imported so tables register on Base)
from app.routers import admin, auth, bookings, buses, search


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # For this assignment we create tables directly. In production you would
    # use Alembic migrations instead of create_all.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Bus ticketing platform with AI-powered natural-language search.",
    lifespan=lifespan,
)

# Allow the React frontend (different origin) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers. Each already carries its own sub-prefix (e.g. /auth).
prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=prefix)
app.include_router(buses.router, prefix=prefix)
app.include_router(bookings.router, prefix=prefix)
app.include_router(search.router, prefix=prefix)
app.include_router(admin.router, prefix=prefix)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "app": settings.APP_NAME}
