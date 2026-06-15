"""AnalystFlow — Application Configuration

Settings and environment variable management using Pydantic Settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "AnalystFlow"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # LLM API
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "openai"  # openai | anthropic
    DEFAULT_LLM_MODEL: str = "gpt-4"

    # Database
    DATABASE_URL: str = "sqlite:///./analystflow.db"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()