"""
SQLAlchemy declarative base and table creation.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base for all ORM models."""

    pass
