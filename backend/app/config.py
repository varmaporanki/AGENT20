"""
Configuration settings for Agent 20 backend application.
Utilizes pydantic-settings to validate and parse environment variables.
"""

from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # Database Settings
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/acadagents",
        description="PostgreSQL connection string",
    )
    DB_POOL_MIN_SIZE: int = Field(default=2, description="Minimum database pool connections")
    DB_POOL_MAX_SIZE: int = Field(default=10, description="Maximum database pool connections")
    DB_TIMEOUT_SECONDS: int = Field(default=5, description="Connection timeout in seconds")

    # Analytics Defaults
    EVALUATION_DATE: str = Field(
        default="2024-12-31",
        description="Default point-in-time evaluation date for scoring calculations",
    )

    # Gemini AI Service Configuration
    GEMINI_API_KEY: Optional[str] = Field(
        default=None,
        description="Google Gemini API Key (keep in .env, never commit)",
    )
    GEMINI_MODEL: str = Field(
        default="gemini-2.0-flash",
        description="Google Gemini Model ID (e.g., gemini-2.0-flash, gemini-1.5-flash)",
    )
    GEMINI_TIMEOUT: float = Field(
        default=30.0,
        description="Timeout in seconds for Gemini API requests",
    )
    GEMINI_MAX_OUTPUT_TOKENS: int = Field(
        default=2048,
        description="Maximum output tokens for generated explanations",
    )

    # CORS and Security
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:5173,http://localhost:4173,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:4173,http://127.0.0.1:8080",
        description="Comma-separated allowed origins for CORS",
    )

    # Server Settings
    ENVIRONMENT: str = Field(default="development", description="Current execution environment")
    DEBUG: bool = Field(default=True, description="Debug mode flag")
    PORT: int = Field(default=8000, description="Server port")
    HOST: str = Field(default="0.0.0.0", description="Server host binding")

    @property
    def cors_origins(self) -> List[str]:
        """Returns the list of allowed CORS origins."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    def sanitized_database_url(self) -> str:
        """Returns the database URL with the password redacted for safe logging."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(self.DATABASE_URL)
            if parsed.password:
                netloc = f"{parsed.username}:***@{parsed.hostname}"
                if parsed.port:
                    netloc += f":{parsed.port}"
                return parsed._replace(netloc=netloc).geturl()
            return self.DATABASE_URL
        except Exception:
            return "postgresql://***:***@.../acadagents"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton instance of application settings."""
    return Settings()
