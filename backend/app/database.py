from __future__ import annotations

import time
from dataclasses import dataclass

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import PyMongoError

from .config import Settings
from .utils import now_iso


@dataclass(frozen=True)
class DatabaseStatus:
    mode: str
    enabled: bool
    connected: bool
    reason: str
    updatedAt: str

    def to_dict(self) -> dict[str, object]:
        return {
            "mode": self.mode,
            "enabled": self.enabled,
            "connected": self.connected,
            "reason": self.reason,
            "updatedAt": self.updatedAt,
        }


class DatabaseManager:
    RECONNECT_INTERVAL_SECONDS = 15

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client: MongoClient | None = None
        self.db: Database | None = None
        self._last_connect_attempt = 0.0
        self.status = DatabaseStatus(
            mode="memory",
            enabled=False,
            connected=False,
            reason="MONGODB_URI not configured",
            updatedAt=now_iso(),
        )
        self._connect()

    def _connect(self) -> None:
        if not self.settings.mongodb_uri:
            return

        self._last_connect_attempt = time.monotonic()
        try:
            self.client = MongoClient(
                self.settings.mongodb_uri,
                serverSelectionTimeoutMS=self.settings.mongodb_server_selection_timeout_ms,
                connectTimeoutMS=self.settings.mongodb_connect_timeout_ms,
            )
            self.client.admin.command("ping")
            self.db = self.client[self.settings.mongodb_db_name]
            self._ensure_indexes()
            self.status = DatabaseStatus(
                mode="mongo",
                enabled=True,
                connected=True,
                reason="",
                updatedAt=now_iso(),
            )
        except PyMongoError:
            if self.client is not None:
                self.client.close()
            self.client = None
            self.db = None
            self.status = DatabaseStatus(
                mode="memory",
                enabled=False,
                connected=False,
                reason="MongoDB connection failed",
                updatedAt=now_iso(),
            )

    def ensure_connected(self) -> Database | None:
        if self.db is not None:
            return self.db
        if not self.settings.mongodb_uri:
            return None
        if time.monotonic() - self._last_connect_attempt >= self.RECONNECT_INTERVAL_SECONDS:
            self._connect()
        return self.db

    @property
    def pdf_uploads(self) -> Collection | None:
        db = self.ensure_connected()
        return db["pdf_uploads"] if db is not None else None

    def _ensure_indexes(self) -> None:
        if self.db is None:
            return

        indexes = [
            ("courses", [("name", ASCENDING)], {"name": "idx_course_name"}),
            (
                "courses",
                [("normalizedName", ASCENDING)],
                {
                    "unique": True,
                    "partialFilterExpression": {"normalizedName": {"$type": "string"}},
                    "name": "uq_course_normalized_name",
                },
            ),
            (
                "media",
                [("normalizedKey", ASCENDING)],
                {
                    "unique": True,
                    "partialFilterExpression": {"normalizedKey": {"$type": "string"}},
                    "name": "uq_media_normalized_key",
                },
            ),
            ("media", [("type", ASCENDING), ("createdAt", DESCENDING)], {"name": "idx_media_type_created"}),
            (
                "subscriptions",
                [("normalizedEmail", ASCENDING)],
                {"unique": True, "name": "uq_subscription_normalized_email"},
            ),
            (
                "subscriptions",
                [("status", ASCENDING), ("createdAt", DESCENDING)],
                {"name": "idx_subscription_status_created"},
            ),
            (
                "tts_snippets",
                [("ownerKey", ASCENDING), ("createdAt", DESCENDING)],
                {"name": "idx_tts_snippets_owner_created"},
            ),
            (
                "tts_snippets",
                [("ownerKey", ASCENDING), ("normalizedContent", ASCENDING)],
                {"unique": True, "name": "uq_tts_snippets_owner_content"},
            ),
            (
                "ai_conversations",
                [("ownerUid", ASCENDING), ("updatedAt", DESCENDING)],
                {"name": "idx_ai_conversations_owner_updated"},
            ),
            (
                "ai_conversations",
                [("ownerUid", ASCENDING), ("id", ASCENDING)],
                {"unique": True, "name": "uq_ai_conversations_owner_id"},
            ),
            ("pdf_uploads", [("id", ASCENDING)], {"unique": True, "name": "uq_pdf_uploads_id"}),
            (
                "pdf_uploads",
                [("expiresAt", ASCENDING)],
                {"expireAfterSeconds": 0, "name": "ttl_pdf_uploads_expires_at"},
            ),
        ]

        for coll_name, keys, kwargs in indexes:
            try:
                self.db[coll_name].create_index(keys, **kwargs)
            except PyMongoError:
                pass

    def close(self) -> None:
        if self.client is not None:
            try:
                self.client.close()
            except Exception:
                pass
        self.client = None
        self.db = None
        self._last_connect_attempt = 0.0
        self.status = DatabaseStatus(
            mode="memory",
            enabled=False,
            connected=False,
            reason="Database client closed",
            updatedAt=now_iso(),
        )
