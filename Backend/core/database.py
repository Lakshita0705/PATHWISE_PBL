"""
Async SQLAlchemy setup for Supabase PostgreSQL.
Uses asyncpg driver for non-blocking I/O.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from config import get_settings

settings = get_settings()

# Only create engine when DATABASE_URL is set (avoids asyncpg import when running training without DB).
DATABASE_URL = settings.database_url
if DATABASE_URL and DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

async_engine = None
AsyncSessionLocal = None
if DATABASE_URL:
    async_engine = create_async_engine(
        DATABASE_URL,
        echo=settings.database_echo,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

Base = declarative_base()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not configured (DATABASE_URL not set)")
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create tables if they do not exist. Call on startup."""
    if async_engine is None:
        return
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
