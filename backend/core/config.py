"""
Core Configuration Module
Loads settings from environment variables with sensible defaults.
"""

import os
from pathlib import Path
from typing import List
from pydantic import BaseModel

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"


class Settings(BaseModel):
    APP_NAME: str = "RecallGuard API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-Powered Product Recall & Supply Chain Safety Agent with ArmorIQ Governance"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database
    DB_PATH: str = str(os.getenv("DB_FILE", BACKEND_DIR / "recallguard.db"))

    # AI / LLM Keys & Settings
    GEMINI_API_KEY: str = os.getenv(
        "GEMINI_API_KEY",
        "AQ.Ab8RN6ILFXH_KIoFh4suBlgQoue-z7JW7nsROQ0m4_bVFivR_Q"
    )
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

    # ArmorIQ
    ARMOR_IQ_ENABLED: bool = os.getenv("ARMOR_IQ_ENABLED", "true").lower() == "true"
    ARMOR_IQ_STRICT_MODE: bool = os.getenv("ARMOR_IQ_STRICT_MODE", "true").lower() == "true"

    # CORS
    CORS_ORIGINS: List[str] = ["*"]


settings = Settings()
