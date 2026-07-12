"""
Application configuration.

We centralise every environment-driven setting in ONE place using
pydantic-settings. Any code that needs a value (DB URL, JWT secret,
Groq API key) imports the shared `settings` object instead of reading
os.environ directly. This makes the app easy to configure and test.

Values are read from environment variables or a local `.env` file.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "KPi-Tech Bus Ticketing API"
    API_V1_PREFIX: str = "/api"

    # --- Database ---
    # SQLite lives in a single file next to the backend, so there is
    # zero setup for the demo. Swap this URL for Postgres in production.
    DATABASE_URL: str = "sqlite:///./bus_ticketing.db"

    # --- Auth / JWT ---
    # In production this MUST come from the environment and be secret.
    JWT_SECRET: str = "change-me-in-production-please"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # --- AI search (Groq) ---
    # Groq exposes an OpenAI-compatible API, so we reuse the OpenAI SDK and
    # just point it at Groq's base URL. If GROQ_API_KEY is empty, the AI
    # service falls back to a deterministic rule-based parser, so the app
    # always runs. (Note: Groq != xAI's "Grok" - different service/URL.)
    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # --- CORS ---
    # The React dev server runs on 5173 (Vite). Allow it to call the API.
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# A single shared instance imported across the app.
settings = Settings()
