from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SpendIQ"
    environment: str = "development"
    database_url: str
    backend_base_url: str = "http://localhost:8000"
    frontend_base_url: str = "http://localhost:5173"
    jwt_secret: str
    google_client_id: str = ""
    google_client_secret: str = ""
    google_client_secrets_file: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"
    gmail_pubsub_topic: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
