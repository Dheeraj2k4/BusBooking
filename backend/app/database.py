"""
Database setup (SQLAlchemy 2.0 style).

This module owns three things that the rest of the app reuses:
  * `engine`      - the low-level connection to SQLite.
  * `SessionLocal`- a factory that creates short-lived DB sessions.
  * `Base`        - the declarative base every ORM model inherits from.

The `get_db` dependency yields one session per request and guarantees
it is closed afterwards (even if the request errors).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# `check_same_thread=False` is required for SQLite + FastAPI because the
# same connection may be used across threads. It is ignored by Postgres.
connect_args = (
    {"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


def get_db():
    """FastAPI dependency: provide a DB session, always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
