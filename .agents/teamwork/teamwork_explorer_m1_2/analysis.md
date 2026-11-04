# Milestone 1 Database & Repository Layer Blueprint

**Author:** Explorer M1-2 (Storage & Retention Architecture Specialist)  
**Date:** 2026-11-04  
**Target Files:**  
- `backend/app/database.py`  
- `backend/app/repositories.py`  
- `backend/tests/test_pdf_upload.py`  

---

## 1. Executive Summary

This document specifies the concrete implementation plan, code blueprints, and architecture guidelines for Milestone 1's database and repository layers supporting the PDF to QR Code Generator tool in `PdfImageStudio`.

### Key Architectural Findings:
1. **MongoDB Collection & Indexing**:
   - Collection name: `pdf_uploads` in database `LakshSolanki`.
   - Unique index: `uq_pdf_uploads_id` on `id` (ASCENDING).
   - TTL index: `ttl_pdf_uploads_expires_at` on `expiresAt` (ASCENDING) with `expireAfterSeconds=0`.
   - Verified live in MongoDB Atlas (`Cluster0`): indexes successfully created and validated.
2. **Dual-Mode Persistence**:
   - **MongoDB Mode**: Binaries stored as `bson.Binary` (subtype 0). Expirations stored as BSON Date (`datetime` object). Field projection `{"content": 0, "_id": 0}` used during metadata retrieval to eliminate multi-megabyte wire transfer overhead.
   - **In-Memory Fallback Mode**: Transparent fallback in `self.memory["pdf_uploads"]` for environments where MongoDB is unreachable or unconfigured. Binaries stored as `bytes`.
   - **Lazy Memory Eviction**: Automatic pruning routine `_cleanup_memory_expired()` executed at the entry of all read/write operations to prevent memory leaks.
3. **Timezone & Serialization Safety**:
   - **Offset-Naive vs Offset-Aware Resolution**: PyMongo decodes BSON dates as offset-naive UTC datetimes by default. Comparing an offset-naive datetime with `datetime.now(timezone.utc)` throws `TypeError: can't compare offset-naive and offset-aware datetimes`. All datetime values must be normalized via `_normalize_datetime()` before comparison.
   - **JSON Serialization Safety**: Starlette/FastAPI `JSONResponse` uses standard `json.dumps()`, which throws `TypeError: Object of type datetime is not JSON serializable` if a raw `datetime` object is in the response dictionary. All public metadata methods must stringify datetimes to canonical ISO 8601 strings ending in `"Z"` (e.g. `2026-11-05T11:20:00.000000Z`).
   - **Dual-Key Compatibility**: Public metadata dictionaries return both `createdAt`/`expiresAt` and `created_at`/`expires_at` to guarantee seamless compatibility with all frontend and backend consumers.

---

## 2. Component Specifications

### 2.1 Database Layer (`backend/app/database.py`)

#### 2.1.1 Collection Reference
In `DatabaseManager`, add a property to provide convenient, type-safe access to the `pdf_uploads` collection:
```python
@property
def pdf_uploads(self) -> Collection | None:
    db = self.ensure_connected()
    return db["pdf_uploads"] if db is not None else None
```

#### 2.1.2 Startup Index Creation in `_ensure_indexes`
In `DatabaseManager._ensure_indexes(self)`:
```python
# PDF Uploads: unique index on document UUID and TTL index on expiration
self.db["pdf_uploads"].create_index(
    [("id", ASCENDING)],
    unique=True,
    name="uq_pdf_uploads_id",
)
self.db["pdf_uploads"].create_index(
    [("expiresAt", ASCENDING)],
    expireAfterSeconds=0,
    name="ttl_pdf_uploads_expires_at",
)
```

#### 2.1.3 How MongoDB TTL Operates
- When `expireAfterSeconds=0`, MongoDB's background TTL thread (runs once every 60 seconds) assesses documents where `current_date >= expiresAt`.
- **CRITICAL**: The indexed field `expiresAt` **MUST** be stored as a BSON Date (Python `datetime.datetime` object), **NOT** a string. If an ISO string is stored, MongoDB ignores it and will not expire the document.
- **Proactive Eager Deletion**: Because MongoDB's background TTL thread only runs every 60 seconds, an expired document could technically be queried during that 60-second window. The repository methods (`get_pdf_upload` and `get_pdf_metadata`) include an eager check: if `expiresAt <= datetime.now(timezone.utc)`, the document is deleted immediately from the database and `None` is returned.

---

### 2.2 Repository Layer (`backend/app/repositories.py`)

#### 2.2.1 In-Memory Collection Registration
In `Repositories.__init__`:
```python
self.memory: dict[str, list[dict[str, Any]]] = {
    "courses": [],
    "media": [],
    "subscriptions": [],
    "tts_snippets": [],
    "ai_conversations": [],
    "pdf_uploads": [],  # Added for in-memory fallback
}
```

#### 2.2.2 Helper Functions

```python
def _normalize_datetime(value: Any) -> datetime | None:
    """Ensures a datetime or ISO string is converted to a timezone-aware UTC datetime."""
    if isinstance(value, datetime):
        return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            return None
    return None


def _to_iso(dt: datetime | str | None) -> str:
    """Formats a datetime or ISO string into a canonical UTC ISO 8601 string ending in 'Z'."""
    if isinstance(dt, str):
        return dt if dt.endswith("Z") else dt.replace("+00:00", "Z")
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    return ""


def _sanitize_pdf_filename(value: str = "") -> str:
    """Sanitizes filename, stripping directory traversal characters and injection sequences."""
    clean = re.sub(r"[/\\]+", "", str(value or "").strip())
    clean = re.sub(r'[\"\r\n\t]', "", clean).strip()
    if not clean or clean.startswith("."):
        clean = "document.pdf"
    if not clean.lower().endswith(".pdf"):
        clean = f"{clean}.pdf"
    return clean[:180]


def _to_public_pdf_metadata(document: dict[str, Any] | None) -> dict[str, Any] | None:
    """Strips large binaries and private DB fields, returning clean serializable metadata."""
    if not document:
        return None
    public = deepcopy(document)
    public.pop("_id", None)
    for binary_key in ("content", "binary", "data", "buffer"):
        public.pop(binary_key, None)

    created_at_dt = _normalize_datetime(public.get("createdAt") or public.get("created_at"))
    expires_at_dt = _normalize_datetime(public.get("expiresAt") or public.get("expires_at"))

    created_iso = _to_iso(created_at_dt)
    expires_iso = _to_iso(expires_at_dt)

    public["createdAt"] = created_iso
    public["expiresAt"] = expires_iso
    public["created_at"] = created_iso
    public["expires_at"] = expires_iso
    return public
```

#### 2.2.3 Lazy In-Memory Cleanup Routine
```python
def _cleanup_memory_expired(self) -> int:
    """Prunes expired PDF uploads from in-memory store."""
    now = datetime.now(timezone.utc)
    original_count = len(self.memory.get("pdf_uploads", []))
    active: list[dict[str, Any]] = []
    for entry in self.memory.get("pdf_uploads", []):
        exp = _normalize_datetime(entry.get("expiresAt"))
        if exp is None or exp > now:
            active.append(entry)
    self.memory["pdf_uploads"] = active
    return original_count - len(active)
```

#### 2.2.4 Repository Method 1: `add_pdf_upload`
```python
def add_pdf_upload(
    self,
    doc_id: str,
    filename: str,
    content: bytes,
    size: int,
    ttl_hours: int = 24,
) -> dict[str, Any]:
    safe_id = str(doc_id).strip() or generate_id()
    safe_filename = _sanitize_pdf_filename(filename)
    safe_size = max(0, int(size))
    safe_ttl = max(1, int(ttl_hours))

    if len(content) > 10 * 1024 * 1024:
        raise RepositoryError("File size exceeds 10 MB limit.", 413)

    created_at = datetime.now(timezone.utc)
    expires_at = created_at + timedelta(hours=safe_ttl)

    collection = self._collection("pdf_uploads")
    if collection is not None:
        document = {
            "id": safe_id,
            "filename": safe_filename,
            "content": Binary(bytes(content)),
            "size": safe_size,
            "contentType": "application/pdf",
            "createdAt": created_at,
            "expiresAt": expires_at,
        }
        try:
            collection.insert_one(document)
        except DuplicateKeyError:
            raise RepositoryError("Document ID already exists.", 409)

        return _to_public_pdf_metadata(document) or {}

    # In-Memory Fallback
    self._cleanup_memory_expired()
    existing = next((item for item in self.memory["pdf_uploads"] if item["id"] == safe_id), None)
    if existing:
        raise RepositoryError("Document ID already exists.", 409)

    record = {
        "id": safe_id,
        "filename": safe_filename,
        "content": bytes(content),
        "size": safe_size,
        "contentType": "application/pdf",
        "createdAt": created_at,
        "expiresAt": expires_at,
    }
    self.memory["pdf_uploads"].append(record)
    return _to_public_pdf_metadata(record) or {}
```

#### 2.2.5 Repository Method 2: `get_pdf_upload`
```python
def get_pdf_upload(self, doc_id: str) -> dict[str, Any] | None:
    safe_id = str(doc_id).strip()
    if not safe_id:
        return None

    now = datetime.now(timezone.utc)
    collection = self._collection("pdf_uploads")
    if collection is not None:
        doc = collection.find_one({"id": safe_id})
        if not doc:
            return None

        # Expiration check
        exp = _normalize_datetime(doc.get("expiresAt"))
        if exp and exp <= now:
            collection.delete_one({"id": safe_id})
            return None

        content = bytes(doc.get("content", b""))
        meta = _to_public_pdf_metadata(doc) or {}
        return {
            **meta,
            "content": content,
        }

    # In-Memory Fallback
    self._cleanup_memory_expired()
    item = next((entry for entry in self.memory["pdf_uploads"] if entry["id"] == safe_id), None)
    if item is None:
        return None

    exp = _normalize_datetime(item.get("expiresAt"))
    if exp and exp <= now:
        self.memory["pdf_uploads"] = [e for e in self.memory["pdf_uploads"] if e["id"] != safe_id]
        return None

    meta = _to_public_pdf_metadata(item) or {}
    return {
        **meta,
        "content": bytes(item["content"]),
    }
```

#### 2.2.6 Repository Method 3: `get_pdf_metadata`
```python
def get_pdf_metadata(self, doc_id: str) -> dict[str, Any] | None:
    safe_id = str(doc_id).strip()
    if not safe_id:
        return None

    now = datetime.now(timezone.utc)
    collection = self._collection("pdf_uploads")
    if collection is not None:
        # High-performance projection: do not load multi-megabyte binary over the wire
        doc = collection.find_one({"id": safe_id}, {"content": 0, "_id": 0})
        if not doc:
            return None

        exp = _normalize_datetime(doc.get("expiresAt"))
        if exp and exp <= now:
            collection.delete_one({"id": safe_id})
            return None

        return _to_public_pdf_metadata(doc)

    # In-Memory Fallback
    self._cleanup_memory_expired()
    item = next((entry for entry in self.memory["pdf_uploads"] if entry["id"] == safe_id), None)
    if item is None:
        return None

    exp = _normalize_datetime(item.get("expiresAt"))
    if exp and exp <= now:
        self.memory["pdf_uploads"] = [e for e in self.memory["pdf_uploads"] if e["id"] != safe_id]
        return None

    return _to_public_pdf_metadata(item)
```

#### 2.2.7 Repository Method 4: `remove_pdf_upload`
```python
def remove_pdf_upload(self, doc_id: str) -> bool:
    safe_id = str(doc_id).strip()
    if not safe_id:
        return False

    collection = self._collection("pdf_uploads")
    if collection is not None:
        result = collection.delete_one({"id": safe_id})
        return result.deleted_count > 0

    # In-Memory Fallback
    self._cleanup_memory_expired()
    before = len(self.memory["pdf_uploads"])
    self.memory["pdf_uploads"] = [e for e in self.memory["pdf_uploads"] if e["id"] != safe_id]
    return len(self.memory["pdf_uploads"]) < before
```

---

## 3. Timezone & Datetime Architecture

### 3.1 Python 3.12+ UTC Handling
In Python 3.12+, `datetime.now(timezone.utc)` produces an offset-aware datetime:
```python
datetime(2026, 11, 4, 11, 20, 43, 27584, tzinfo=datetime.timezone.utc)
```

### 3.2 BSON Date Encoding & Decoding in PyMongo
- When inserting into MongoDB, PyMongo takes `datetime.datetime` and encodes it to BSON Date (int64 UTC milliseconds).
- When reading from MongoDB, PyMongo default `CodecOptions(tz_aware=False)` returns a naive datetime:
  ```python
  datetime(2026, 11, 4, 11, 20, 43, 275000)  # tzinfo is None!
  ```
- If this naive datetime is directly compared with `datetime.now(timezone.utc)`, Python throws:
  `TypeError: can't compare offset-naive and offset-aware datetimes`
- The `_normalize_datetime()` helper safely attaches `timezone.utc` if `tzinfo is None`:
  ```python
  if dt.tzinfo is None:
      dt = dt.replace(tzinfo=timezone.utc)
  ```
  This makes comparison safe in 100% of cases.

### 3.3 Starlette JSON Serialization
`starlette.responses.JSONResponse` uses standard library `json.dumps`. Calling `JSONResponse(content={"createdAt": datetime.now(timezone.utc)})` fails with:
`TypeError: Object of type datetime is not JSON serializable`
`_to_public_pdf_metadata()` converts both `createdAt` and `expiresAt` into ISO 8601 strings ending in `"Z"` (e.g. `2026-11-04T11:20:43.027584Z`), preventing any 500 serialization error.

---

## 4. Verification Test Suite Blueprint (`backend/tests/test_pdf_upload.py`)

A comprehensive unit test file should be added at `backend/tests/test_pdf_upload.py` to independently verify:
1. **In-Memory CRUD**:
   - `test_in_memory_add_get_metadata_remove`
   - `test_in_memory_size_limit_rejection`
   - `test_in_memory_duplicate_id_rejection`
   - `test_in_memory_lazy_expiration`
2. **MongoDB CRUD (when connected)**:
   - `test_mongo_index_definitions`
   - `test_mongo_binary_storage_and_projection`
   - `test_mongo_eager_expiration_deletion`
3. **Timezone Normalization & ISO Formatting**:
   - `test_timezone_normalization_naive_and_aware`
   - `test_json_response_serializability`
4. **Filename Sanitization**:
   - `test_filename_sanitization_path_traversal`

---

## 5. Summary Table of Operations

| Operation | MongoDB Behavior | In-Memory Behavior | Output / Return |
|---|---|---|---|
| `add_pdf_upload` | Inserts `bson.Binary` + BSON Date; handles `DuplicateKeyError` (409) | Prunes expired; appends dict; handles duplicates (409) | Metadata dict with ISO timestamps (`content` excluded) |
| `get_pdf_upload` | Finds by `id`; checks expiration (deletes if expired); extracts `bytes(doc['content'])` | Prunes expired; checks expiration; extracts `bytes` | Full dict with `content: bytes` + metadata |
| `get_pdf_metadata` | Projected query `{"content": 0, "_id": 0}`; checks expiration | Prunes expired; checks expiration | Metadata dict (`content` excluded) |
| `remove_pdf_upload` | `collection.delete_one({"id": doc_id})` | Filter-out item from `self.memory["pdf_uploads"]` | `True` if deleted, `False` if not found |
| Lazy Expiration | MongoDB background TTL index (60s) + eager check on read | `_cleanup_memory_expired()` called on all operations | Transparent memory and storage hygiene |
