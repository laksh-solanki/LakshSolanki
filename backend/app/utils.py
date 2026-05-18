from __future__ import annotations

import re
from datetime import UTC, datetime
from uuid import uuid4


EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def generate_id() -> str:
    return str(uuid4())


def normalize_email(value: str | None) -> str:
    return (value or "").strip().lower()


def is_valid_email(value: str | None) -> bool:
    return bool(EMAIL_REGEX.fullmatch(normalize_email(value)))
