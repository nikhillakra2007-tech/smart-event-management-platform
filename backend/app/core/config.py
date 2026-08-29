"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = (
        "postgresql+psycopg://postgres:password@localhost:5432/smart_event"
    )

    # Application
    app_env: str = "development"
    app_debug: bool = True
    secret_key: str = "change-this-in-production"

    # API
    api_prefix: str = "/api"
    app_title: str = "Smart Event Management Platform"
    app_description: str = (
        "Unified platform for hackathons, tech fests, and conferences. "
        "Handles registration, team formation, judging, leaderboard, and analytics."
    )
    app_version: str = "1.0.0"


settings = Settings()
