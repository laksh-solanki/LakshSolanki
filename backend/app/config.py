from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


_BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(_BACKEND_DIR / ".env")


def _to_positive_int(value: str | None, fallback: int) -> int:
    try:
        parsed = int(str(value or "").strip())
    except ValueError:
        return fallback
    return parsed if parsed > 0 else fallback


def _to_float_in_range(value: str | None, fallback: float, *, minimum: float, maximum: float) -> float:
    try:
        parsed = float(str(value or "").strip())
    except ValueError:
        return fallback
    return max(minimum, min(maximum, parsed))


def _to_bool(value: str | None, fallback: bool) -> bool:
    if value is None or not str(value).strip():
        return fallback
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    return fallback


def _parse_csv(value: str | None) -> tuple[str, ...]:
    if not value:
        return ()
    return tuple(item.strip() for item in value.split(",") if item.strip())


def _parse_cors_origins(value: str | None) -> tuple[str, ...]:
    parsed = _parse_csv(value)
    return parsed or ("*",)


def _parse_ai_provider(value: str | None) -> str:
    normalized = str(value or "").strip().lower()
    return normalized if normalized in {"auto", "gemini", "groq", "openai"} else "auto"


@dataclass(frozen=True)
class Settings:
    node_env: str
    host: str
    port: int
    mongodb_uri: str
    mongodb_db_name: str
    mongodb_server_selection_timeout_ms: int
    mongodb_connect_timeout_ms: int
    cors_origins: tuple[str, ...]
    max_request_body_bytes: int
    enable_security_headers: bool
    firebase_project_id: str
    firebase_jwks_url: str
    firebase_auth_test_mode: bool
    gemini_api_key: str
    gemini_chat_model: str
    groq_api_key: str
    groq_api_base: str
    groq_chat_model: str
    openai_api_key: str
    openai_base_url: str
    openai_chat_model: str
    ai_default_provider: str
    ai_system_prompt: str
    ai_temperature: float
    ai_max_output_tokens: int


def load_settings() -> Settings:
    node_env = os.getenv("NODE_ENV", "development").strip() or "development"
    return Settings(
        node_env=node_env,
        host=os.getenv("HOST", "0.0.0.0").strip() or "0.0.0.0",
        port=_to_positive_int(os.getenv("PORT"), 5001),
        mongodb_uri=os.getenv("MONGODB_URI", "").strip(),
        mongodb_db_name=(
            os.getenv("MONGODB_DB_NAME", "").strip()
            or os.getenv("MONGODB_DB", "").strip()
            or os.getenv("DB_NAME", "").strip()
            or "LakshSolanki"
        ),
        mongodb_server_selection_timeout_ms=_to_positive_int(
            os.getenv("MONGODB_SERVER_SELECTION_TIMEOUT_MS"),
            5000,
        ),
        mongodb_connect_timeout_ms=_to_positive_int(
            os.getenv("MONGODB_CONNECT_TIMEOUT_MS"),
            5000,
        ),
        cors_origins=_parse_cors_origins(os.getenv("CORS_ORIGIN")),
        max_request_body_bytes=_to_positive_int(os.getenv("REQUEST_BODY_LIMIT_BYTES"), 262144),
        enable_security_headers=_to_bool(os.getenv("ENABLE_SECURITY_HEADERS"), True),
        firebase_project_id=os.getenv("FIREBASE_PROJECT_ID", "").strip(),
        firebase_jwks_url=(
            os.getenv("FIREBASE_JWKS_URL", "").strip()
            or "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
        ),
        firebase_auth_test_mode=node_env != "production"
        and _to_bool(os.getenv("FIREBASE_AUTH_TEST_MODE"), False),
        gemini_api_key=(os.getenv("GEMINI_API_KEY", "").strip() or os.getenv("GOOGLE_API_KEY", "").strip()),
        gemini_chat_model=os.getenv("GEMINI_CHAT_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash",
        groq_api_key=os.getenv("GROQ_API_KEY", "").strip(),
        groq_api_base=os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1").strip().rstrip("/"),
        groq_chat_model=os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile").strip()
        or "llama-3.3-70b-versatile",
        openai_api_key=(os.getenv("OPENAI_API_KEY", "").strip() or os.getenv("NVIDIA_API_KEY", "").strip()),
        openai_base_url=os.getenv("OPENAI_BASE_URL", "https://integrate.api.nvidia.com/v1").strip().rstrip("/"),
        openai_chat_model=os.getenv("OPENAI_CHAT_MODEL", "meta/llama-3.3-70b-instruct").strip()
        or "meta/llama-3.3-70b-instruct",
        ai_default_provider=_parse_ai_provider(os.getenv("AI_DEFAULT_PROVIDER")),
        ai_system_prompt=(
            os.getenv("AI_SYSTEM_PROMPT", "").strip()
            or "You are Mindlytic AI, an all-in-one assistant. Give practical, structured, and concise answers first, then add implementation details, edge cases, and simple teaching guidance when useful."
        ),
        ai_temperature=_to_float_in_range(os.getenv("AI_TEMPERATURE"), 1.5, minimum=0, maximum=2),
        ai_max_output_tokens=_to_positive_int(os.getenv("AI_MAX_OUTPUT_TOKENS"), 2000),
    )


settings = load_settings()
