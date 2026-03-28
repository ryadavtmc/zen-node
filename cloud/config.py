# =============================================================================
# ZenNode Cloud — Configuration
# All settings read from environment variables / .env file.
# =============================================================================

import os
from dotenv import load_dotenv

load_dotenv()

# ── Database ──────────────────────────────────────────────────────────────────
# SQLite for dev, PostgreSQL for production.
# Switch by setting DATABASE_URL=postgresql://user:pass@host/dbname
DATABASE_URL: str = os.getenv(
    "DATABASE_URL", "sqlite:///./zennode_cloud.db"
)

# ── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

# ── Server ────────────────────────────────────────────────────────────────────
API_PORT: int = int(os.getenv("API_PORT", "8421"))
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")
