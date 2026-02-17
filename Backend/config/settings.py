"""
Application settings loaded from environment variables.
Production-ready with validation and defaults for local development.
"""

import os
from functools import lru_cache
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Centralized application configuration."""

    app_name: str = Field(default="PathWise API", description="Application name")
    debug: bool = Field(default=False, description="Enable debug mode")
    environment: str = Field(default="development", description="Environment name")

    # Database (Supabase PostgreSQL)
    database_url: Optional[str] = Field(
        default=None,
        description="Async PostgreSQL connection string (e.g. postgresql+asyncpg://...)",
    )
    database_echo: bool = Field(default=False, description="Echo SQL statements")

    # Model paths
    model_path: str = Field(
        default="roadmap_model.pt",
        description="Path to saved PyTorch roadmap difficulty model",
    )
    scaler_path: str = Field(
        default="scaler.pt",
        description="Path to saved feature scaler state",
    )

    # Job market (simulated API)
    job_market_api_url: Optional[str] = Field(
        default=None,
        description="Optional external job listings API URL",
    )
    market_trend_decay_days: int = Field(
        default=30,
        description="Days over which trend weight decays",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def default_database_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v
        return os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DATABASE_URL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
