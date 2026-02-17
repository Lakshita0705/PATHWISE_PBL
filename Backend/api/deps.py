"""
FastAPI dependencies: database session, optional auth.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield async DB session for route injection."""
    async for session in get_async_session():
        yield session
