"""
Application configuration from environment. No secrets hardcoded.
"""
import os
from pathlib import Path


def _env(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


def _env_int(key: str, default: int = 0) -> int:
    try:
        return int(os.getenv(key, str(default)))
    except ValueError:
        return default


class Settings:
    """Configuration from environment variables."""

    def __init__(self) -> None:
        self.hf_token: str | None = _env("HF_TOKEN") or None
        self.groq_api_key: str | None = _env("GROQ_API_KEY") or None
        self.groq_model: str = _env("GROQ_MODEL") or "llama-3.1-8b-instant"
        self.postgres_db: str = _env("POSTGRES_DB") or "ai_doc_rag"
        self.postgres_user: str = _env("POSTGRES_USER") or "rag_admin"
        self.postgres_password: str = _env("POSTGRES_PASSWORD")
        self.postgres_host: str = _env("POSTGRES_HOST") or "localhost"
        self.postgres_port: int = _env_int("POSTGRES_PORT", 5432)
        self.database_url: str | None = _env("DATABASE_URL") or None
        self.jwt_secret_key: str = _env("JWT_SECRET_KEY")
        self.jwt_refresh_secret_key: str = _env("JWT_REFRESH_SECRET_KEY") or self.jwt_secret_key
        self.jwt_algorithm: str = _env("JWT_ALGORITHM") or "HS256"
        self.access_token_expire_minutes: int = _env_int("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
        self.refresh_token_expire_days: int = _env_int("REFRESH_TOKEN_EXPIRE_DAYS", 14)
        self.storage_path: str = _env("STORAGE_PATH") or "/app/storage"

    def get_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    def get_storage_path(self) -> Path:
        return Path(self.storage_path)


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
