from __future__ import annotations

import time
from dataclasses import dataclass

from pymongo import ASCENDING, DESCENDING, MongoClient
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

    def _ensure_indexes(self) -> None:
        if self.db is None:
            return

        try:
            self.db["courses"].create_index([("name", ASCENDING)], name="idx_course_name")
            self.db["courses"].create_index(
                [("normalizedName", ASCENDING)],
                unique=True,
                partialFilterExpression={"normalizedName": {"$type": "string"}},
                name="uq_course_normalized_name",
            )
            self.db["media"].create_index(
                [("normalizedKey", ASCENDING)],
                unique=True,
                partialFilterExpression={"normalizedKey": {"$type": "string"}},
                name="uq_media_normalized_key",
            )
            self.db["media"].create_index([("type", ASCENDING), ("createdAt", DESCENDING)], name="idx_media_type_created")
            self.db["subscriptions"].create_index(
                [("normalizedEmail", ASCENDING)],
                unique=True,
                name="uq_subscription_normalized_email",
            )
            self.db["subscriptions"].create_index(
                [("status", ASCENDING), ("createdAt", DESCENDING)],
                name="idx_subscription_status_created",
            )
            self.db["tts_snippets"].create_index(
                [("ownerKey", ASCENDING), ("createdAt", DESCENDING)],
                name="idx_tts_snippets_owner_created",
            )
            self.db["tts_snippets"].create_index(
                [("ownerKey", ASCENDING), ("normalizedContent", ASCENDING)],
                unique=True,
                name="uq_tts_snippets_owner_content",
            )
            self.db["ai_conversations"].create_index(
                [("ownerUid", ASCENDING), ("updatedAt", DESCENDING)],
                name="idx_ai_conversations_owner_updated",
            )
            self.db["ai_conversations"].create_index(
                [("ownerUid", ASCENDING), ("id", ASCENDING)],
                unique=True,
                name="uq_ai_conversations_owner_id",
            )
        except PyMongoError:
            # Matching the JS backend: index issues should not prevent the app from starting.
            pass

    def close(self) -> None:
        if self.client is not None:
            self.client.close()
