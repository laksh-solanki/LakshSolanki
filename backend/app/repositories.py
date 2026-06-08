from __future__ import annotations

from collections.abc import Callable
import re
from copy import deepcopy
from typing import Any

from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .utils import generate_id, normalize_email, now_iso


MAX_CONVERSATION_MESSAGES = 80


class RepositoryError(RuntimeError):
    def __init__(self, message: str, status_code: int, *, data_key: str | None = None, data: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.data_key = data_key
        self.data = data


def _normalize_course_name(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip()).lower()


def _normalize_media_key(value: str = "") -> str:
    return re.sub(r"\s+", " ", value.strip()).lower()


def _normalize_snippet_content(value: str = "") -> str:
    return str(value).strip()


def _normalize_conversation_title(value: str = "") -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def _normalize_message_text(value: str = "") -> str:
    return str(value or "").strip()


def _document_id(value: Any) -> str:
    return str(value) if value is not None else ""


def _to_public_document(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if not document:
        return None
    public = deepcopy(document)
    object_id = public.pop("_id", None)
    public.pop("normalizedName", None)
    if object_id is not None:
        public["id"] = _document_id(object_id)
    return public


def _to_public_media(document: dict[str, Any] | None) -> dict[str, Any] | None:
    public = _to_public_document(document)
    if public is None:
        return None
    for key in ("data", "binary", "bytes", "buffer"):
        public.pop(key, None)
    return public


def _to_public_snippet(document: dict[str, Any] | None) -> dict[str, Any] | None:
    public = _to_public_document(document)
    if public is None:
        return None
    public.pop("ownerKey", None)
    public.pop("normalizedContent", None)
    return public


def _sanitize_messages(messages: list[dict[str, Any]] | None) -> list[dict[str, str]]:
    safe_messages: list[dict[str, str]] = []
    for message in messages or []:
        text = _normalize_message_text(message.get("text", ""))
        if not text:
            continue
        safe_messages.append(
            {
                "role": "assistant" if message.get("role") == "assistant" else "user",
                "text": text,
                "createdAt": message.get("createdAt") or now_iso(),
            }
        )
    return safe_messages[-MAX_CONVERSATION_MESSAGES:]


def _compact_title(value: str = "", fallback: str = "New chat") -> str:
    normalized = _normalize_conversation_title(value)
    if not normalized:
        return fallback
    return f"{normalized[:117]}..." if len(normalized) > 120 else normalized


def _derive_title(title: str = "", messages: list[dict[str, str]] | None = None) -> str:
    normalized = _compact_title(title, "")
    if normalized:
        return normalized
    messages = messages or []
    first_user = next((item["text"] for item in messages if item["role"] == "user"), messages[0]["text"] if messages else "")
    return _compact_title(first_user, "New chat")


def _to_public_conversation_summary(document: dict[str, Any] | None) -> dict[str, Any] | None:
    public = _to_public_document(document)
    if public is None:
        return None
    messages = public.pop("messages", []) or []
    public.pop("ownerUid", None)
    public.pop("ownerEmail", None)
    public.pop("ownerName", None)
    public["messageCount"] = len(messages)
    public["lastMessageAt"] = messages[-1].get("createdAt") if messages else public.get("updatedAt") or public.get("createdAt")
    return public


def _to_public_conversation(document: dict[str, Any] | None) -> dict[str, Any] | None:
    public = _to_public_document(document)
    if public is None:
        return None
    public.pop("ownerUid", None)
    public.pop("ownerEmail", None)
    public.pop("ownerName", None)
    public["messages"] = [
        {
            "role": "assistant" if message.get("role") == "assistant" else "user",
            "text": str(message.get("text", "")),
            "createdAt": message.get("createdAt") or now_iso(),
        }
        for message in (public.get("messages") or [])
    ]
    return public


class Repositories:
    def __init__(self, db: Database | Callable[[], Database | None] | None) -> None:
        self._db_provider = db if callable(db) else lambda: db
        self.memory: dict[str, list[dict[str, Any]]] = {
            "courses": [],
            "media": [],
            "subscriptions": [],
            "tts_snippets": [],
            "ai_conversations": [],
        }

    def _collection(self, name: str) -> Collection | None:
        db = self._db_provider()
        return db[name] if db is not None else None

    def list_courses(self, *, search: str = "", limit: int = 50, sort: str = "asc") -> list[dict[str, Any]]:
        normalized_search = search.strip()
        direction = 1 if sort != "desc" else -1
        collection = self._collection("courses")
        if collection is not None:
            query = {"name": {"$regex": re.escape(normalized_search), "$options": "i"}} if normalized_search else {}
            return [_to_public_document(item) for item in collection.find(query).sort("name", direction).limit(limit)]

        lowered = normalized_search.lower()
        items = [
            deepcopy(item)
            for item in self.memory["courses"]
            if not normalized_search or lowered in item["name"].lower()
        ]
        items.sort(key=lambda item: item["name"].lower(), reverse=direction == -1)
        return items[:limit]

    def add_course(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = now_iso()
        name = re.sub(r"\s+", " ", payload["name"].strip())
        course = {
            "name": name,
            "normalizedName": _normalize_course_name(name),
            "category": (payload.get("category") or "").strip() or None,
            "level": (payload.get("level") or "").strip() or None,
            "durationHours": payload.get("durationHours"),
            "tags": [str(tag).strip() for tag in payload.get("tags", []) if str(tag).strip()],
            "createdAt": now,
            "updatedAt": now,
        }

        collection = self._collection("courses")
        if collection is not None:
            existing = collection.find_one(
                {
                    "$or": [
                        {"normalizedName": course["normalizedName"]},
                        {"name": {"$regex": f"^{re.escape(course['name'])}$", "$options": "i"}},
                    ]
                }
            )
            if existing:
                raise RepositoryError("Course already exists", 409, data_key="data", data=_to_public_document(existing))
            try:
                result = collection.insert_one(course)
            except DuplicateKeyError:
                duplicate = collection.find_one({"normalizedName": course["normalizedName"]})
                raise RepositoryError("Course already exists", 409, data_key="data", data=_to_public_document(duplicate))
            return _to_public_document({"_id": result.inserted_id, **course}) or {}

        existing = next((item for item in self.memory["courses"] if item["normalizedName"] == course["normalizedName"]), None)
        if existing:
            raise RepositoryError("Course already exists", 409, data_key="data", data=_to_public_document(existing))
        record = {"id": generate_id(), **course}
        self.memory["courses"].append(record)
        return _to_public_document(record) or {}

    def list_media(self, *, media_type: str = "", limit: int = 50, sort: str = "desc") -> list[dict[str, Any]]:
        normalized_type = media_type.strip().lower()
        direction = 1 if sort == "asc" else -1
        collection = self._collection("media")
        if collection is not None:
            query = {"type": normalized_type} if normalized_type else {}
            return [_to_public_media(item) for item in collection.find(query).sort("createdAt", direction).limit(limit)]

        items = [
            deepcopy(item)
            for item in self.memory["media"]
            if not normalized_type or item["type"] == normalized_type
        ]
        items.sort(key=lambda item: item.get("createdAt", ""), reverse=direction == -1)
        return [_to_public_media(item) or {} for item in items[:limit]]

    def add_media(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = now_iso()
        url = str(payload["url"]).strip()
        name = re.sub(r"\s+", " ", str(payload.get("name", "")).strip())
        media = {
            "name": name or None,
            "url": url,
            "type": str(payload.get("type", "generic") or "generic").strip().lower() or "generic",
            "alt": str(payload.get("alt", "")).strip(),
            "tags": [str(tag).strip() for tag in payload.get("tags", []) if str(tag).strip()],
            "normalizedKey": _normalize_media_key(url or name),
            "createdAt": now,
            "updatedAt": now,
        }

        collection = self._collection("media")
        if collection is not None:
            existing = collection.find_one({"normalizedKey": media["normalizedKey"]})
            if existing:
                raise RepositoryError("Media already exists", 409, data_key="data", data=_to_public_media(existing))
            try:
                result = collection.insert_one(media)
            except DuplicateKeyError:
                duplicate = collection.find_one({"normalizedKey": media["normalizedKey"]})
                raise RepositoryError("Media already exists", 409, data_key="data", data=_to_public_media(duplicate))
            return _to_public_media({"_id": result.inserted_id, **media}) or {}

        existing = next((item for item in self.memory["media"] if item["normalizedKey"] == media["normalizedKey"]), None)
        if existing:
            raise RepositoryError("Media already exists", 409, data_key="data", data=_to_public_media(existing))
        record = {"id": generate_id(), **media}
        self.memory["media"].append(record)
        return _to_public_media(record) or {}

    def list_tts_snippets(self, *, owner_key: str, limit: int = 6) -> list[dict[str, Any]]:
        owner = owner_key.strip()
        safe_limit = max(1, min(20, limit))
        collection = self._collection("tts_snippets")
        if collection is not None:
            return [
                _to_public_snippet(item)
                for item in collection.find({"ownerKey": owner}).sort("createdAt", -1).limit(safe_limit)
            ]
        items = [deepcopy(item) for item in self.memory["tts_snippets"] if item["ownerKey"] == owner]
        items.sort(key=lambda item: item.get("createdAt", ""), reverse=True)
        return [_to_public_snippet(item) or {} for item in items[:safe_limit]]

    def add_tts_snippet(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = now_iso()
        content = _normalize_snippet_content(payload["content"])
        title = re.sub(r"\s+", " ", str(payload.get("title", "")).strip())
        snippet = {
            "id": generate_id(),
            "ownerKey": str(payload["ownerKey"]).strip(),
            "title": title or f"{content[:56]}{'...' if len(content) > 56 else ''}",
            "content": content,
            "normalizedContent": content,
            "createdAt": now,
            "updatedAt": now,
        }

        collection = self._collection("tts_snippets")
        if collection is not None:
            existing = collection.find_one(
                {"ownerKey": snippet["ownerKey"], "normalizedContent": snippet["normalizedContent"]}
            )
            if existing:
                raise RepositoryError("Snippet already exists", 409, data_key="data", data=_to_public_snippet(existing))
            try:
                collection.insert_one(snippet)
            except DuplicateKeyError:
                duplicate = collection.find_one(
                    {"ownerKey": snippet["ownerKey"], "normalizedContent": snippet["normalizedContent"]}
                )
                raise RepositoryError("Snippet already exists", 409, data_key="data", data=_to_public_snippet(duplicate or snippet))
            return _to_public_snippet(snippet) or {}

        existing = next(
            (
                item
                for item in self.memory["tts_snippets"]
                if item["ownerKey"] == snippet["ownerKey"] and item["normalizedContent"] == snippet["normalizedContent"]
            ),
            None,
        )
        if existing:
            raise RepositoryError("Snippet already exists", 409, data_key="data", data=_to_public_snippet(existing))
        self.memory["tts_snippets"].append(snippet)
        return _to_public_snippet(snippet) or {}

    def remove_tts_snippet(self, *, owner_key: str, snippet_id: str) -> bool:
        collection = self._collection("tts_snippets")
        if collection is not None:
            result = collection.delete_one({"ownerKey": owner_key.strip(), "id": snippet_id.strip()})
            return result.deleted_count > 0
        before = len(self.memory["tts_snippets"])
        self.memory["tts_snippets"] = [
            item
            for item in self.memory["tts_snippets"]
            if not (item["ownerKey"] == owner_key.strip() and item["id"] == snippet_id.strip())
        ]
        return len(self.memory["tts_snippets"]) < before

    def list_ai_conversations(self, *, owner_uid: str, limit: int = 30) -> list[dict[str, Any]]:
        safe_limit = max(1, min(50, limit))
        collection = self._collection("ai_conversations")
        if collection is not None:
            return [
                _to_public_conversation_summary(item)
                for item in collection.find({"ownerUid": owner_uid.strip()}).sort("updatedAt", -1).limit(safe_limit)
            ]
        items = [deepcopy(item) for item in self.memory["ai_conversations"] if item["ownerUid"] == owner_uid.strip()]
        items.sort(key=lambda item: item.get("updatedAt", ""), reverse=True)
        return [_to_public_conversation_summary(item) or {} for item in items[:safe_limit]]

    def get_ai_conversation(self, *, owner_uid: str, conversation_id: str) -> dict[str, Any] | None:
        collection = self._collection("ai_conversations")
        if collection is not None:
            return _to_public_conversation(collection.find_one({"ownerUid": owner_uid.strip(), "id": conversation_id.strip()}))
        item = next(
            (
                item
                for item in self.memory["ai_conversations"]
                if item["ownerUid"] == owner_uid.strip() and item["id"] == conversation_id.strip()
            ),
            None,
        )
        return _to_public_conversation(item)

    def upsert_ai_conversation(
        self,
        *,
        owner_uid: str,
        owner_email: str = "",
        owner_name: str = "",
        conversation_id: str = "",
        title: str = "",
        messages: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        owner_uid = owner_uid.strip()
        conversation_id = conversation_id.strip() or generate_id()
        normalized_messages = _sanitize_messages(messages)
        now = now_iso()
        conversation_title = _derive_title(title, normalized_messages)

        collection = self._collection("ai_conversations")
        if collection is not None:
            existing = collection.find_one({"ownerUid": owner_uid, "id": conversation_id})
            if existing:
                collection.update_one(
                    {"ownerUid": owner_uid, "id": conversation_id},
                    {
                        "$set": {
                            "ownerEmail": owner_email.strip().lower(),
                            "ownerName": owner_name.strip(),
                            "title": conversation_title,
                            "messages": normalized_messages,
                            "updatedAt": now,
                        }
                    },
                )
            else:
                collection.insert_one(
                    {
                        "id": conversation_id,
                        "ownerUid": owner_uid,
                        "ownerEmail": owner_email.strip().lower(),
                        "ownerName": owner_name.strip(),
                        "title": conversation_title,
                        "messages": normalized_messages,
                        "createdAt": now,
                        "updatedAt": now,
                    }
                )
            return _to_public_conversation(collection.find_one({"ownerUid": owner_uid, "id": conversation_id})) or {}

        existing = next(
            (
                item
                for item in self.memory["ai_conversations"]
                if item["ownerUid"] == owner_uid and item["id"] == conversation_id
            ),
            None,
        )
        if existing:
            existing.update(
                {
                    "ownerEmail": owner_email.strip().lower(),
                    "ownerName": owner_name.strip(),
                    "title": conversation_title,
                    "messages": normalized_messages,
                    "updatedAt": now,
                }
            )
            return _to_public_conversation(existing) or {}

        record = {
            "id": conversation_id,
            "ownerUid": owner_uid,
            "ownerEmail": owner_email.strip().lower(),
            "ownerName": owner_name.strip(),
            "title": conversation_title,
            "messages": normalized_messages,
            "createdAt": now,
            "updatedAt": now,
        }
        self.memory["ai_conversations"].append(record)
        return _to_public_conversation(record) or {}

    def remove_ai_conversation(self, *, owner_uid: str, conversation_id: str) -> bool:
        collection = self._collection("ai_conversations")
        if collection is not None:
            result = collection.delete_one({"ownerUid": owner_uid.strip(), "id": conversation_id.strip()})
            return result.deleted_count > 0
        before = len(self.memory["ai_conversations"])
        self.memory["ai_conversations"] = [
            item
            for item in self.memory["ai_conversations"]
            if not (item["ownerUid"] == owner_uid.strip() and item["id"] == conversation_id.strip())
        ]
        return len(self.memory["ai_conversations"]) < before

    def subscribe(
        self,
        *,
        email: str,
        name: str = "",
        source: str = "web",
        ip: str = "",
        user_agent: str = "",
    ) -> dict[str, Any]:
        normalized = normalize_email(email)
        now = now_iso()
        collection = self._collection("subscriptions")
        if collection is not None:
            existing = collection.find_one({"normalizedEmail": normalized})
            if existing and existing.get("status") == "active":
                return {"status": "already_subscribed", "subscription": _to_public_document(existing)}
            if existing:
                collection.update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "status": "active",
                            "name": name or existing.get("name", ""),
                            "source": source,
                            "ip": ip,
                            "userAgent": user_agent,
                            "updatedAt": now,
                            "unsubscribedAt": None,
                        }
                    },
                )
                return {
                    "status": "reactivated",
                    "subscription": _to_public_document(collection.find_one({"_id": existing["_id"]})),
                }
            subscription = {
                "email": normalized,
                "normalizedEmail": normalized,
                "name": name.strip(),
                "source": source,
                "status": "active",
                "ip": ip,
                "userAgent": user_agent,
                "createdAt": now,
                "updatedAt": now,
                "unsubscribedAt": None,
            }
            try:
                result = collection.insert_one(subscription)
            except DuplicateKeyError:
                return {"status": "already_subscribed", "subscription": None}
            return {"status": "created", "subscription": _to_public_document({"_id": result.inserted_id, **subscription})}

        existing = next((item for item in self.memory["subscriptions"] if item["normalizedEmail"] == normalized), None)
        if existing and existing["status"] == "active":
            return {"status": "already_subscribed", "subscription": deepcopy(existing)}
        if existing:
            existing.update(
                {
                    "status": "active",
                    "name": name or existing.get("name", ""),
                    "source": source,
                    "ip": ip,
                    "userAgent": user_agent,
                    "updatedAt": now,
                    "unsubscribedAt": None,
                }
            )
            return {"status": "reactivated", "subscription": deepcopy(existing)}
        subscription = {
            "id": generate_id(),
            "email": normalized,
            "normalizedEmail": normalized,
            "name": name.strip(),
            "source": source,
            "status": "active",
            "ip": ip,
            "userAgent": user_agent,
            "createdAt": now,
            "updatedAt": now,
            "unsubscribedAt": None,
        }
        self.memory["subscriptions"].append(subscription)
        return {"status": "created", "subscription": deepcopy(subscription)}

    def get_subscription_status(self, *, email: str) -> dict[str, Any]:
        normalized = normalize_email(email)
        collection = self._collection("subscriptions")
        if collection is not None:
            subscription = collection.find_one({"normalizedEmail": normalized})
            if not subscription:
                return {"exists": False, "subscribed": False, "status": "not_found", "subscription": None}
            return {
                "exists": True,
                "subscribed": subscription.get("status") == "active",
                "status": subscription.get("status"),
                "subscription": _to_public_document(subscription),
            }
        subscription = next((item for item in self.memory["subscriptions"] if item["normalizedEmail"] == normalized), None)
        if not subscription:
            return {"exists": False, "subscribed": False, "status": "not_found", "subscription": None}
        return {
            "exists": True,
            "subscribed": subscription["status"] == "active",
            "status": subscription["status"],
            "subscription": deepcopy(subscription),
        }

    def unsubscribe(self, *, email: str) -> dict[str, Any]:
        normalized = normalize_email(email)
        now = now_iso()
        collection = self._collection("subscriptions")
        if collection is not None:
            subscription = collection.find_one({"normalizedEmail": normalized})
            if not subscription:
                return {"status": "not_found", "subscription": None}
            if subscription.get("status") == "unsubscribed":
                return {"status": "already_unsubscribed", "subscription": _to_public_document(subscription)}
            collection.update_one(
                {"_id": subscription["_id"]},
                {"$set": {"status": "unsubscribed", "updatedAt": now, "unsubscribedAt": now}},
            )
            return {
                "status": "unsubscribed",
                "subscription": _to_public_document(collection.find_one({"_id": subscription["_id"]})),
            }
        subscription = next((item for item in self.memory["subscriptions"] if item["normalizedEmail"] == normalized), None)
        if not subscription:
            return {"status": "not_found", "subscription": None}
        if subscription["status"] == "unsubscribed":
            return {"status": "already_unsubscribed", "subscription": deepcopy(subscription)}
        subscription.update({"status": "unsubscribed", "updatedAt": now, "unsubscribedAt": now})
        return {"status": "unsubscribed", "subscription": deepcopy(subscription)}
