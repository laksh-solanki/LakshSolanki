# Backend Endpoints & Security Analysis: PDF to QR Code Generator (Milestone 1)

**Agent:** Explorer M1-1 (Backend Endpoints & Security Specialist)  
**Date:** 2026-11-04  
**Target Files:** `backend/app/main.py`, `backend/app/repositories.py`, `backend/app/database.py`, `backend/tests/test_pdf_upload.py`  
**Working Directory:** `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_1`  

---

## 1. Executive Summary

This document provides the definitive implementation plan and production-ready code blueprint for Milestone 1's FastAPI endpoints in `backend/app/main.py`. The design achieves 100% compliance with `ORIGINAL_REQUEST.md` and `PROJECT.md` contracts:
- **`POST /api/pdf/upload`**: Multipart file upload accepting `UploadFile`, stream-safe 10 MB limit enforcement (HTTP 413), PDF MIME validation, strict binary magic-byte (`b"%PDF-"`) header and trailer (`b"%%EOF"` within last 2048 bytes) verification (HTTP 400), sliding-window rate limiting (10 uploads/min per client IP, HTTP 429 with `Retry-After`), dual-mode persistence (MongoDB `bson.Binary` with in-memory fallback), and 24-hour expiration calculation.
- **`GET /api/pdf/{id}`**: Strict UUID4 regex validation defending against path traversal, streaming PDF binary with `Content-Disposition: inline; filename="..."` and `Content-Type: application/pdf` (or HTTP 404).
- **`GET /api/pdf/{id}/file` & `GET /api/pdf/{id}/download`**: Dual-route attachment streaming with `Content-Disposition: attachment; filename="..."` (or HTTP 404).
- **`GET /api/pdf/{id}/metadata`**: Returns clean JSON metadata without binary payload (or HTTP 404).
- **`DELETE /api/pdf/{id}`**: Immediately deletes binary and metadata from storage, invalidating all subsequent access (or HTTP 404).
- **CORS & Security Middleware**: Exposes `Content-Disposition`, `Content-Length`, and `Retry-After`, permitting full frontend communication and file downloads.
- **Critical Exception Handler Fix**: Discovered that `http_exception_handler` in `backend/app/main.py` line 522 omits `headers=exc.headers`. Passing `headers=exc.headers` ensures `Retry-After` headers on HTTP 429 are delivered to clients.

---

## 2. API Contract Specification

### 2.1 Route Matrix

| Method | Path | Request Format | Success Response | Error Responses | Description |
|---|---|---|---|---|---|
| `POST` | `/api/pdf/upload` | `multipart/form-data` (`file`) | `200 OK` JSON | `400` (corrupt/non-PDF)<br>`413` (>10MB)<br>`429` (rate limit) | Validates, stores PDF, returns ID & `/v/{id}` link |
| `GET` | `/api/pdf/{id}` | Path param `id` (UUID4) | `200 OK` Binary stream | `400` (invalid ID)<br>`404` (missing/expired) | Stream PDF binary inline for preview (`pdfjs-dist`) |
| `GET` | `/api/pdf/{id}/file` | Path param `id` (UUID4) | `200 OK` Binary stream | `400` (invalid ID)<br>`404` (missing/expired) | Download PDF as attachment |
| `GET` | `/api/pdf/{id}/download` | Path param `id` (UUID4) | `200 OK` Binary stream | `400` (invalid ID)<br>`404` (missing/expired) | Download PDF as attachment (route alias) |
| `GET` | `/api/pdf/{id}/metadata` | Path param `id` (UUID4) | `200 OK` JSON | `400` (invalid ID)<br>`404` (missing/expired) | Returns JSON metadata without binary |
| `DELETE` | `/api/pdf/{id}` | Path param `id` (UUID4) | `200 OK` JSON | `400` (invalid ID)<br>`404` (not found/deleted) | Immediately deletes document and invalidates links |
| `OPTIONS` | Any `/api/pdf/*` | Preflight HTTP OPTIONS | `200 OK` Headers | N/A | CORS preflight with exposed headers |

### 2.2 Response Payloads

#### `POST /api/pdf/upload` Success (200 OK):
```json
{
  "status": "success",
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "document.pdf",
  "size": 1048576,
  "url": "/v/123e4567-e89b-12d3-a456-426614174000",
  "expires_at": "2026-11-05T11:20:00.000Z"
}
```

#### `GET /api/pdf/{id}/metadata` Success (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "document.pdf",
  "size": 1048576,
  "created_at": "2026-11-04T11:20:00.000Z",
  "expires_at": "2026-11-05T11:20:00.000Z"
}
```

#### `DELETE /api/pdf/{id}` Success (200 OK):
```json
{
  "status": "deleted",
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Standard Error Formats:
- **400 Bad Request**: `{"detail": "Invalid PDF format or corrupted file."}`
- **413 Payload Too Large**: `{"detail": "File size exceeds 10 MB limit."}`
- **429 Too Many Requests**: `{"detail": "Upload rate limit exceeded. Please wait a minute."}` (with header `Retry-After: 60`)
- **404 Not Found (Missing/Expired)**: `{"detail": "Document not found or expired."}`
- **404 Not Found (Already Deleted)**: `{"detail": "Document not found or already deleted."}`

---

## 3. Security Architecture & Threat Defense

### 3.1 Binary Magic Byte & EOF Integrity Verification
- **Header check**: PDF 1.0–2.0 files start with `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`). Files without this exact binary prefix are rejected immediately.
- **Trailer check**: PDF files end with the `%%EOF` marker. Because PDFs frequently contain trailing carriage returns, newlines (`\r\n`), or increment padding, the check inspects the trailing 2048 bytes:
  ```python
  if not content.startswith(b"%PDF-"):
      raise HTTPException(status_code=400, detail="Invalid PDF format or corrupted file.")
  tail = content[-2048:]
  if b"%%EOF" not in tail:
      raise HTTPException(status_code=400, detail="Invalid PDF format or corrupted file.")
  ```
- **MIME type check**: Supported MIME types: `{"application/pdf", "application/x-pdf", "application/acrobat", "applications/vnd.pdf", "text/pdf"}`. If `file.content_type` is supplied and does not match, it is rejected with HTTP 400.

### 3.2 Stream-Safe File Size Enforcement (10 MB Limit -> HTTP 413)
To prevent memory exhaustion attacks (DoS via multi-gigabyte uploads), files are read in 64 KB chunks (`CHUNK_SIZE = 64 * 1024`). If cumulative bytes exceed `MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024` (10,485,760 bytes), reading aborts immediately and raises HTTP 413:
```python
MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
CHUNK_SIZE = 64 * 1024  # 64 KB

chunks: list[bytes] = []
total_size = 0
while True:
    chunk = await file.read(CHUNK_SIZE)
    if not chunk:
        break
    total_size += len(chunk)
    if total_size > MAX_PDF_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File size exceeds 10 MB limit.")
    chunks.append(chunk)
content = b"".join(chunks)
```

### 3.3 Sliding-Window Rate Limiter per Client IP (HTTP 429)
- **Constraint**: Maximum 10 uploads per 60-second rolling window per client IP.
- **Algorithm**: In-memory `SlidingWindowRateLimiter` using a thread-safe `threading.Lock` and `collections.deque` of `time.monotonic()` timestamps.
- **Client IP Extraction**: Inspects `X-Forwarded-For` (first IP in CSV), `X-Real-IP`, and falls back to `request.client.host`.
- **Response**: When exceeded, returns HTTP 429 with `{"detail": "Upload rate limit exceeded. Please wait a minute."}` and response header `Retry-After: <seconds_until_oldest_expires>`.

```python
class SlidingWindowRateLimiter:
    """Thread-safe sliding-window rate limiter per client key."""

    def __init__(self, limit: int = 10, window_seconds: float = 60.0) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._history: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> tuple[bool, int, int]:
        """
        Check if key is within rate limit.
        Returns: (allowed: bool, remaining: int, retry_after: int)
        """
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            timestamps = self._history[key]
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()
            if len(timestamps) < self.limit:
                timestamps.append(now)
                remaining = self.limit - len(timestamps)
                return True, remaining, 0
            oldest = timestamps[0]
            retry_after = max(1, int(oldest + self.window_seconds - now))
            return False, 0, retry_after

    def reset(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._history.clear()
            else:
                self._history.pop(key, None)
```

### 3.4 Cryptographic UUID4 & Path Traversal Defense
- **Identifier**: Generated exclusively via Python `uuid.uuid4()`.
- **Validation**: Enforced via regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`.
- **Path Traversal Defense**: Any request containing `../`, `..\`, `%2e%2e`, `/etc/`, or arbitrary characters fails regex matching and immediately aborts with HTTP 400 (`detail="Invalid document ID format."`) before reaching the storage or database layer.
- **Filename Sanitization**: Uploaded filenames (`file.filename`) could contain traversal patterns (`../../sensitive.pdf`). Filenames are stripped to base names (`os.path.basename`), stripped of non-whitelisted characters, and guaranteed to have a `.pdf` extension:
  ```python
  def sanitize_filename(filename: str | None) -> str:
      if not filename:
          return "document.pdf"
      base = os.path.basename(filename.strip().replace("\\", "/"))
      cleaned = re.sub(r"[^\w\s\.\-_]", "", base).strip()
      if not cleaned or cleaned.startswith("."):
          cleaned = "document.pdf"
      if not cleaned.lower().endswith(".pdf"):
          cleaned = f"{cleaned}.pdf"
      return cleaned[:120]
  ```

### 3.5 CORS & Security Headers
- `CORSMiddleware` in `backend/app/main.py`:
  - `allow_origins`: configured from `settings.cors_origins` (defaults to `*`).
  - `allow_methods`: `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`.
  - `allow_headers`: `["Content-Type", "Authorization", "X-Admin-Key", "Accept", "Range"]`.
  - `expose_headers`: `["Content-Disposition", "Content-Length", "Retry-After"]` — **crucial for client-side JavaScript to read filename and size headers!**

---

## 4. Code Blueprint for `backend/app/main.py`

### 4.1 Imports & Module-Level Declarations

Add to top of `backend/app/main.py`:
```python
from collections import defaultdict, deque
from datetime import UTC, datetime, timedelta
import io
import os
import threading
from uuid import UUID

from fastapi import File, Response, UploadFile
from starlette.responses import StreamingResponse
```

### 4.2 Helper Utilities & Rate Limiter Instance

```python
MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_PDF_MIME_TYPES = {
    "application/pdf",
    "application/x-pdf",
    "application/acrobat",
    "applications/vnd.pdf",
    "text/pdf",
}
UUID4_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def is_valid_uuid4(value: str) -> bool:
    return bool(UUID4_PATTERN.fullmatch(str(value or "").strip()))


def sanitize_filename(filename: str | None) -> str:
    if not filename:
        return "document.pdf"
    base = os.path.basename(filename.strip().replace("\\", "/"))
    cleaned = re.sub(r"[^\w\s\.\-_]", "", base).strip()
    if not cleaned or cleaned.startswith("."):
        cleaned = "document.pdf"
    if not cleaned.lower().endswith(".pdf"):
        cleaned = f"{cleaned}.pdf"
    return cleaned[:120]


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    real_ip = request.headers.get("x-real-ip")
    if real_ip and real_ip.strip():
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host.strip()
    return "unknown"


class SlidingWindowRateLimiter:
    def __init__(self, limit: int = 10, window_seconds: float = 60.0) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._history: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> tuple[bool, int, int]:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            timestamps = self._history[key]
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()
            if len(timestamps) < self.limit:
                timestamps.append(now)
                return True, self.limit - len(timestamps), 0
            oldest = timestamps[0]
            retry_after = max(1, int(oldest + self.window_seconds - now))
            return False, 0, retry_after

    def reset(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._history.clear()
            else:
                self._history.pop(key, None)


pdf_upload_rate_limiter = SlidingWindowRateLimiter(limit=10, window_seconds=60.0)
```

### 4.3 Endpoint Implementations in `backend/app/main.py`

```python
@app.post("/api/pdf/upload")
async def upload_pdf(request: Request, file: UploadFile = File(...)) -> JSONResponse:
    # 1. Rate Limiting Check (10 uploads/min per IP)
    client_ip = get_client_ip(request)
    allowed, _, retry_after = pdf_upload_rate_limiter.check(client_ip)
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"detail": "Upload rate limit exceeded. Please wait a minute."},
            headers={"Retry-After": str(retry_after)},
        )

    # 2. MIME type verification
    content_type = (file.content_type or "").lower().strip()
    if content_type and content_type not in ALLOWED_PDF_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid PDF format or corrupted file.")

    # 3. Stream-safe chunked reading with 10 MB limit
    chunks: list[bytes] = []
    total_size = 0
    chunk_size = 64 * 1024
    try:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_PDF_SIZE_BYTES:
                raise HTTPException(status_code=413, detail="File size exceeds 10 MB limit.")
            chunks.append(chunk)
    finally:
        await file.close()

    content = b"".join(chunks)

    # 4. Binary Magic Byte & EOF Integrity Validation
    if len(content) < 10 or not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid PDF format or corrupted file.")
    tail = content[-2048:]
    if b"%%EOF" not in tail:
        raise HTTPException(status_code=400, detail="Invalid PDF format or corrupted file.")

    # 5. Cryptographic ID generation & filename sanitization
    doc_id = generate_id()
    safe_filename = sanitize_filename(file.filename)

    # 6. Store document via repository
    stored = repositories.add_pdf_upload(
        id=doc_id,
        filename=safe_filename,
        binary=content,
        size=len(content),
        content_type="application/pdf",
        expires_in_hours=24,
    )

    # 7. Return contract response
    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "id": doc_id,
            "filename": safe_filename,
            "size": len(content),
            "url": f"/v/{doc_id}",
            "expires_at": stored["expires_at"],
        },
    )


@app.get("/api/pdf/{id}")
def view_pdf(id: str) -> Response:
    if not is_valid_uuid4(id):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")
    doc = repositories.get_pdf_binary(id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found or expired.")
    binary, filename, content_type = doc
    return Response(
        content=binary,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Content-Length": str(len(binary)),
            "Cache-Control": "public, max-age=3600",
        },
    )


@app.get("/api/pdf/{id}/file")
@app.get("/api/pdf/{id}/download")
def download_pdf(id: str) -> Response:
    if not is_valid_uuid4(id):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")
    doc = repositories.get_pdf_binary(id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found or expired.")
    binary, filename, content_type = doc
    return Response(
        content=binary,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(binary)),
            "Cache-Control": "public, max-age=3600",
        },
    )


@app.get("/api/pdf/{id}/metadata")
def get_pdf_metadata(id: str) -> JSONResponse:
    if not is_valid_uuid4(id):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")
    meta = repositories.get_pdf_metadata(id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Document not found or expired.")
    return JSONResponse(
        status_code=200,
        content={
            "id": meta["id"],
            "filename": meta["filename"],
            "size": meta["size"],
            "created_at": meta["created_at"],
            "expires_at": meta["expires_at"],
        },
        headers={"Cache-Control": "public, max-age=60"},
    )


@app.delete("/api/pdf/{id}")
def delete_pdf(id: str) -> JSONResponse:
    if not is_valid_uuid4(id):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")
    removed = repositories.remove_pdf_upload(id)
    if not removed:
        raise HTTPException(status_code=404, detail="Document not found or already deleted.")
    return JSONResponse(
        status_code=200,
        content={"status": "deleted", "id": id},
    )
```

### 4.4 Exception Handler Fix in `backend/app/main.py`
In `backend/app/main.py` lines 516–523, change:
```python
# Before (line 522):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

# After (pass headers through so Retry-After and other custom headers are preserved):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)
```

---

## 5. Storage Contract Blueprint

### 5.1 MongoDB Indexes in `backend/app/database.py`
Inside `_ensure_indexes(self)`:
```python
self.db["pdf_uploads"].create_index([("id", ASCENDING)], unique=True, name="uq_pdf_uploads_id")
self.db["pdf_uploads"].create_index([("expiresAt", ASCENDING)], expireAfterSeconds=0, name="ttl_pdf_uploads_expires")
```

### 5.2 Repository CRUD in `backend/app/repositories.py`
Inside `Repositories`:
- In `__init__`: `self.memory["pdf_uploads"] = []`
- `add_pdf_upload(self, *, id: str, filename: str, binary: bytes, size: int, content_type: str = "application/pdf", expires_in_hours: int = 24) -> dict[str, Any]`
- `get_pdf_metadata(self, id: str) -> dict[str, Any] | None`
- `get_pdf_binary(self, id: str) -> tuple[bytes, str, str] | None`
- `remove_pdf_upload(self, id: str) -> bool`
- `_prune_expired_memory_pdfs(self) -> None`

---

## 6. Comprehensive Test Suite Blueprint (`backend/tests/test_pdf_upload.py`)

A full test suite utilizing `fastapi.testclient.TestClient` verifying all 12 core test scenarios:
1. `test_valid_pdf_upload`: Uploads well-formed PDF; asserts 200, UUID4 format, url `/v/{id}`, size, filename.
2. `test_get_pdf_inline_streaming`: GET `/api/pdf/{id}`; asserts 200, `Content-Type: application/pdf`, `Content-Disposition: inline`.
3. `test_get_pdf_attachment_download`: GET `/api/pdf/{id}/file` & `/download`; asserts 200, `Content-Disposition: attachment`.
4. `test_get_pdf_metadata`: GET `/api/pdf/{id}/metadata`; asserts 200, JSON schema without binary.
5. `test_delete_pdf_lifecycle`: DELETE `/api/pdf/{id}`; asserts 200, then subsequent GET returns 404.
6. `test_reject_non_pdf_magic_bytes`: Upload with corrupted header `b"NOT_PDF_HEADER%%EOF"`; asserts 400.
7. `test_reject_missing_eof_trailer`: Upload with `%PDF-1.4` but no `%%EOF`; asserts 400.
8. `test_reject_oversized_file`: Upload 10 MB + 1 KB; asserts 413.
9. `test_reject_invalid_mime_type`: Upload with `content_type="text/plain"`; asserts 400.
10. `test_reject_empty_file`: Upload 0-byte file; asserts 400.
11. `test_path_traversal_defense`: GET `/api/pdf/../../etc/passwd` & malformed strings; asserts 400.
12. `test_sliding_window_rate_limiting`: 10 rapid uploads succeed (200), 11th returns 429 with `Retry-After`.

---

## 7. Dependencies to Update in `backend/requirements.txt` & `backend/pyproject.toml`

Add:
- `python-multipart==0.0.32` (or `>=0.0.20`)
This ensures FastAPI's multipart upload parser executes seamlessly in both local and Vercel environments.
