"""
Database session and dependency injection.
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from ..core import get_settings
from .base import Base

# Import models so Base.metadata knows them
from ..models import ChatHistory, Document, User  # noqa: F401


def get_engine():
    settings = get_settings()
    url = settings.get_database_url()
    return create_engine(url, pool_pre_ping=True, echo=False)


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all tables. Safe to call on startup."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yield a DB session and close after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
