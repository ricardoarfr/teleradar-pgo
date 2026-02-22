from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Banco de dados
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/teleradar"

    # Segurança JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Ambiente
    ENVIRONMENT: str = "development"

    # Email (Resend)
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Teleradar PGO <noreply@teleradar-pgo.com.br>"
    ADMIN_MASTER_EMAIL: str = ""

    # Google OAuth2
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    # Rate limit
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCK_DURATION_MINUTES: int = 15

    # Bootstrap MASTER
    BOOTSTRAP_SECRET: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080"

    # Render Free Tier — monitoramento
    DB_CREATED_AT: str = ""
    DB_STORAGE_ALERT_MB: int = 800

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
