# Backend & Storage Architectural Survey for PDF to QR Code Generator

**Survey Date:** 2026-11-04  
**Explorer:** Explorer 2 (Backend Storage Survey Explorer)  
**Target Project:** `lakshsolanki-backend` (`c:\Users\laksh\Documents\GitHub\LakshSolanki\backend`)  
**Workspace:** `c:\Users\laksh\Documents\GitHub\LakshSolanki`

---

## 1. Executive Summary

This survey analyzes the backend framework, API routes, data persistence, security controls, cryptographic ID generation, deletion mechanisms, retention/cleanup policies, and password/expiry capabilities in the project workspace to support the **PDF to QR Code Generator** tool.

**Key Findings:**
1. **Server Framework:** Standalone **FastAPI** (`fastapi==0.115.12`) application served with **Uvicorn** (`uvicorn[standard]==0.34.2`) in Python >= 3.12, with dual deployment targets: local (`backend/run.py` on port 5001) and serverless Vercel (`backend/server.py` exposing ASGI `app`).
2. **Current File/Upload Endpoints:** **None exist.** The backend currently handles structured JSON data across 6 domains (courses, media metadata URLs, TTS snippets, newsletter subscriptions, AI chat completions, and AI chat history). No `UploadFile`, `File()`, or `Form()` multipart upload endpoints exist anywhere in the codebase.
3. **Storage & Persistence Architecture:** Hybrid dual-mode repository architecture. When MongoDB is available via `MONGODB_URI`, data is persisted to MongoDB (`Cluster0`, database `LakshSolanki`). When MongoDB is absent or offline, it transparently falls back to in-memory Python dictionaries (`self.memory`). For PDFs, storing binary data in MongoDB (`bson.Binary`) with an in-memory byte buffer fallback is required to maintain Vercel serverless compatibility (where the local filesystem is ephemeral and read-only).
4. **Security & Validation:** No rate limiting or file upload validation exists yet. PDF integrity validation must be implemented using pure Python magic byte verification (`content.startswith(b"%PDF-")`) and trailer checks (`b"%%EOF"` in the final bytes). Path traversal is eliminated by indexing files exclusively by UUIDv4 identifiers rather than user-supplied filesystem paths.
5. **ID & URL Generation:** IDs are generated via `uuid.uuid4()` in `backend/app/utils.py`. The public preview page URL should follow the format `${origin}/pdf/${document_id}` for maximum QR code scannability.
6. **Deletion & Retention Lifecycle:** No background jobs or cron runners currently exist. Retention can be cleanly implemented via MongoDB's native TTL index (`expireAfterSeconds=0` on an `expiresAt` datetime field), coupled with lazy expiration pruning in memory mode.
7. **Password Protection & Expiry Dates:** **Not supported anywhere in the backend or database.** Per the explicit instruction in `ORIGINAL_REQUEST.md` (*"Only implement password protection and expiry dates if already supported by the existing backend/database architecture"*), password protection and custom user-set expiry dates **must NOT be implemented**. A fixed, system-level cleanup retention policy (default 24 hours) will govern file lifecycle.

---

## 2. Server Framework & Runtime Architecture

### 2.1 Framework Identification
- **Framework:** FastAPI (`fastapi==0.115.12`, Starlette underlying)
- **ASGI Server:** Uvicorn (`uvicorn[standard]==0.34.2`)
- **Python Version:** Python >= 3.12 (current active runtime: Python 3.14.6)
- **Primary Configuration File:** `backend/pyproject.toml` (lines 1–17) and `backend/requirements.txt` (lines 1–8)

```toml
# backend/pyproject.toml:1-17
[project]
name = "lakshsolanki-backend"
version = "0.1.0"
description = "FastAPI backend for LakshSolanki"
requires-python = ">=3.12"
dependencies = [
    "fastapi==0.115.12",
    "uvicorn[standard]==0.34.2",
    "python-dotenv==1.1.0",
    "pymongo==4.12.1",
    "httpx==0.28.1",
    "PyJWT[crypto]==2.10.1",
]

[tool.vercel]
entrypoint = "backend.app.main:app"
```

```text
# backend/requirements.txt:1-8
fastapi==0.115.12
uvicorn[standard]==0.34.2
python-dotenv==1.1.0
pymongo==4.12.1
httpx==0.28.1
PyJWT[crypto]==2.10.1
cryptography>=43.0.0
```

### 2.2 Entrypoints & Execution Architecture
1. **Local Development Entrypoint:** `backend/run.py` (lines 8–14)
   ```python
   # backend/run.py:8-14
   if __name__ == "__main__":
       uvicorn.run(
           "app.main:app",
           host=settings.host,
           port=settings.port,
           reload=False,
       )
   ```
   Runs by default on `http://0.0.0.0:5001`.
2. **Vercel Serverless Entrypoint:** `backend/server.py` (lines 1–2)
   ```python
   # backend/server.py:1-2
   from app.main import app
   ```
   Vercel serverless functions load `backend.app.main:app` as declared in `tool.vercel.entrypoint`.
3. **Application Instantiation:** `backend/app/main.py` (lines 103–108)
   ```python
   # backend/app/main.py:103-108
   app = FastAPI(
       title="LakshSolanki Backend",
       version="2.0.0",
       description="Python backend for the main site API.",
       lifespan=lifespan,
   )
   ```

### 2.3 Middleware & Security Headers
Configured in `backend/app/main.py`:
- **CORS Middleware:** `backend/app/main.py` (lines 110–116)
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=list(settings.cors_origins),
      allow_credentials=False,
      allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allow_headers=["Content-Type", "Authorization", "X-Admin-Key"],
  )
  ```
  Note: Allowed HTTP methods include `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS`.
- **GZip Compression:** `backend/app/main.py` (line 117): `app.add_middleware(GZipMiddleware, minimum_size=1024)`
- **Security Headers Middleware:** `backend/app/main.py` (lines 120–129)
  Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security`.
- **Client Base URL Resolution:** `frontend/src/utils/apiBaseUrl.js` (lines 15–29)
  Resolves API base URL to `http://localhost:5001` in local development and `https://lakshsolanki-backend.vercel.app` in production.

---

## 3. Existing API Routes & Storage Implementations

### 3.1 Inventory of Current Endpoints
The backend currently exposes 17 endpoints:

| Method | Route | Description | Input / Payload | Auth / Protection |
|---|---|---|---|---|
| `GET` | `/` | Root service info & uptime | None | Public |
| `GET` | `/health` | Healthcheck | None | Public |
| `GET` | `/ready` | Readiness check (DB ping) | None | Public |
| `GET` | `/api/courses` | List courses | Query (`search`, `limit`, `sort`) | Public (cached) |
| `POST` | `/api/courses` | Create course | `CourseCreate` (JSON) | Public |
| `GET` | `/api/projects/certificate-gen`| Alias for list courses | Query | Public |
| `GET` | `/api/media` | List media items | Query (`type`, `limit`, `sort`) | Public (cached) |
| `POST` | `/api/media` | Save media item | `MediaCreate` (JSON: name, url, alt, tags) | Public |
| `GET` | `/api/tts/snippets` | List user snippets | Query (`ownerKey`, `limit`) | Public (`ownerKey` scoped) |
| `POST` | `/api/tts/snippets` | Create snippet | `TtsSnippetCreate` (JSON) | Public |
| `DELETE` | `/api/tts/snippets/{snippet_id}` | Delete snippet | Path + Query (`ownerKey`) | Public (`ownerKey` scoped) |
| `POST` | `/api/subscribe` | Subscribe newsletter | `SubscriptionPayload` (JSON: email, name, source) | Public |
| `GET` | `/api/subscribe/status` | Check subscription | Query (`email`) | Public |
| `DELETE` | `/api/subscribe` | Unsubscribe newsletter | `EmailPayload` (JSON: email) | Public |
| `POST` | `/api/ai/chat` | AI LLM chat completion | `ChatPayload` (JSON: messages, provider, etc.) | Public |
| `GET` | `/api/ai/history` | List AI chat history | Query (`limit`) | Firebase Auth (`Bearer <token>`) |
| `GET` | `/api/ai/history/{conversation_id}` | Get AI chat conversation | Path (`conversation_id`) | Firebase Auth (`Bearer <token>`) |
| `PUT` | `/api/ai/history/{conversation_id}` | Upsert AI chat conversation | Path + `HistoryUpsert` (JSON) | Firebase Auth (`Bearer <token>`) |
| `DELETE` | `/api/ai/history/{conversation_id}` | Delete AI chat conversation | Path (`conversation_id`) | Firebase Auth (`Bearer <token>`) |

### 3.2 File Upload & Handling Status
- **Current status:** **Zero file upload endpoints.**
- **Multipart support:** `python-multipart` is already present in the active Python environment (v0.0.32), but is **not** currently listed in `backend/requirements.txt` or `pyproject.toml`. It must be added to `requirements.txt` so production/CI builds can process `multipart/form-data`.
- **Existing `media` endpoint comparison:** `POST /api/media` does NOT accept raw binary file uploads. It accepts a JSON body with a string `url` (`MediaCreate.url`), intended for externally hosted assets.

### 3.3 Database & Storage Architecture
1. **Connection Manager:** `backend/app/database.py` (lines 32–91)
   - Connects to MongoDB using `MongoClient(settings.mongodb_uri)`.
   - Verified live connection to cluster: `Cluster0`, database `LakshSolanki`.
   - Existing collections: `courses`, `media`, `subscriptions`, `tts_snippets`, `ai_conversations`.
2. **Dual-Mode Persistence Architecture:**
   - In `backend/app/repositories.py` (lines 142–156):
     ```python
     # backend/app/repositories.py:142-156
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
     ```
   - If MongoDB is connected, documents are stored in MongoDB.
   - If MongoDB is disconnected or unset, data is stored in in-memory list `self.memory[collection_name]`.
3. **Storage Strategy for PDF Documents:**
   - **Local Filesystem:** On Vercel serverless (`server.py`), the local filesystem is ephemeral and read-only (except temporary `/tmp`, which is purged and NOT shared across lambda instances). Writing PDFs to local disk will fail or cause inconsistent 404s across subsequent requests.
   - **MongoDB Binary Storage (`bson.Binary`):** PDFs up to 10–15 MB can be stored directly inside the `pdf_uploads` collection as binary BSON data (`bson.Binary(pdf_bytes)`). This preserves statelessness, enables seamless multi-instance deployment on Vercel, and allows automated document expiration via MongoDB TTL indexes.
   - **In-Memory Storage (`self.memory["pdf_uploads"]`):** In local development without MongoDB or during testing, raw `bytes` are stored in memory.

---

## 4. Security Architecture

### 4.1 MIME Type Detection & Binary Magic Bytes
- **Client-Side:** Frontend checks `file.type === "application/pdf"` and file extension (`.pdf`). This can be spoofed by renaming an arbitrary file (e.g., `malware.exe.pdf`).
- **Server-Side Binary Inspection:**
  1. **Magic Bytes Header:** A genuine PDF file must start with `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`):
     ```python
     if not content.startswith(b"%PDF-"):
         raise HTTPException(status_code=400, detail={"error": "Uploaded file is not a valid PDF document."})
     ```
  2. **Trailer & Structure Verification:** Valid PDFs contain structural markers and an end-of-file trailer (`%%EOF`) within the trailing bytes:
     ```python
     if b"%%EOF" not in content[-2048:]:
         raise HTTPException(status_code=400, detail={"error": "PDF file is incomplete or corrupted."})
     ```
  3. **Zero External Dependency:** This pure-Python inspection requires no heavy C libraries, runs instantly, and deterministically rejects renamed executables, images, HTML scripts, and truncated files.

### 4.2 File Size Limits
- **Global Body Limit:** In `backend/app/config.py` (line 108), `settings.max_request_body_bytes` defaults to 262,144 bytes (256 KB), designed for lightweight JSON payloads.
- **Dedicated PDF Upload Limit:** The upload endpoint must enforce an explicit maximum PDF size:
  - Recommended limit: **10 MB** (`10 * 1024 * 1024 = 10,485,760 bytes`).
  - Validation: If `len(content) > MAX_PDF_SIZE_BYTES`, reject immediately with HTTP 413:
    ```python
    if len(content) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={"error": f"File size exceeds the maximum limit of {MAX_PDF_SIZE_MB} MB."}
        )
    ```

### 4.3 Rate Limiting
- **Current status:** No rate limiting middleware exists anywhere in the backend.
- **Implementation Strategy:**
  - An in-memory sliding window rate limiter tracking client IP (`request.client.host` or `X-Forwarded-For` header).
  - Recommended limits:
    - PDF Uploads: 10 uploads per IP per minute.
    - PDF Downloads / Public Views: 60 requests per IP per minute.
  - Returns HTTP 429 (`Too Many Requests`) with a `Retry-After` header when exceeded.

### 4.4 Path Traversal & Identifier Safety
- **Vulnerability Surface:** Uploading or serving files based on user-supplied filenames can lead to directory traversal (`../../etc/passwd` or `..\windows\system32`).
- **Mitigation Architecture:**
  1. Documents are stored and retrieved **strictly by random cryptographic UUIDv4 IDs** (`document_id`).
  2. The `document_id` path parameter is validated with strict regex:
     ```python
     if not re.fullmatch(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", document_id, re.I):
         raise HTTPException(status_code=400, detail={"error": "Invalid document ID format."})
     ```
  3. Any input containing `..`, `/`, `\`, or null bytes immediately triggers HTTP 400.
  4. The user's original filename is sanitized for the `Content-Disposition` download header:
     ```python
     safe_filename = re.sub(r'[^\w\s\.-]', '_', original_filename).strip() or "document.pdf"
     ```

---

## 5. Cryptographic ID Generation & URL Conventions

### 5.1 ID Generation
- `backend/app/utils.py` (lines 15–16):
  ```python
  # backend/app/utils.py:15-16
  def generate_id() -> str:
      return str(uuid4())
  ```
- `uuid.uuid4()` uses system entropy (`os.urandom()`), providing 122 bits of cryptographic randomness.
- A secondary `delete_token` generated via `secrets.token_urlsafe(24)` allows the uploader to delete the PDF without requiring full user account registration.

### 5.2 URL Conventions & QR Compatibility
- **Public Landing Page URL:**
  - Route: `${origin}/pdf/${document_id}`
  - Example: `https://lakshsolanki.com/pdf/4fa83c11-92b5-4b18-b2ef-34db22f9810a`
  - Compact length (~60 characters) guarantees high QR code scanning reliability (low error correction overhead, larger module size).
- **Backend API Endpoints:**
  - `POST /api/pdf/upload` — Upload multipart PDF. Returns `{ id, filename, size, viewUrl, downloadUrl, expiresAt, deleteToken }`.
  - `GET /api/pdf/{document_id}/metadata` — Fetch JSON metadata (filename, size, createdAt, expiresAt).
  - `GET /api/pdf/{document_id}` — Stream PDF with `Content-Disposition: inline; filename="..."`.
  - `GET /api/pdf/{document_id}/download` — Download PDF with `Content-Disposition: attachment; filename="..."`.
  - `DELETE /api/pdf/{document_id}` — Delete file immediately (validates `X-Delete-Token` or query `deleteToken`). Subsequent requests return HTTP 404.

---

## 6. Deletion APIs & Retention / Cleanup Policy

### 6.1 Immediate Deletion API
- Endpoint: `DELETE /api/pdf/{document_id}`
- If provided, verifies `deleteToken`.
- Deletes document from MongoDB collection (`delete_one({"id": document_id})`) or memory array.
- Subsequent `GET` requests return HTTP 404: `{"error": "PDF not found or has been deleted."}`.

### 6.2 Retention & Automated Cleanup Policy
- **Retention Period:** Default **24 hours** from upload timestamp.
- **MongoDB Native TTL Index:**
  MongoDB has a built-in background TTL process that deletes expired documents automatically:
  ```python
  # In backend/app/database.py _ensure_indexes():
  self.db["pdf_uploads"].create_index(
      [("expiresAt", ASCENDING)],
      expireAfterSeconds=0,
      name="idx_pdf_expires_at"
  )
  self.db["pdf_uploads"].create_index(
      [("id", ASCENDING)],
      unique=True,
      name="uq_pdf_uploads_id"
  )
  ```
  When `expiresAt <= datetime.now(UTC)`, MongoDB's background thread automatically removes the document.
- **In-Memory Cleanup:**
  For memory fallback mode, `Repositories` performs lazy eviction on every read/write operation:
  ```python
  now_str = now_iso()
  self.memory["pdf_uploads"] = [
      doc for doc in self.memory["pdf_uploads"]
      if doc.get("expiresAt", "") > now_str
  ]
  ```

---

## 7. Password Protection & Expiry Dates Assessment

### 7.1 Codebase Survey
A workspace-wide search for password hashing, authentication credentials, and expiration models revealed:
- No password hashing algorithms (e.g. `bcrypt`, `argon2`, `pbkdf2`) are implemented for data items.
- No user password columns or schemas exist in MongoDB or in-memory stores.
- The only authentication present is Firebase JWT verification (`backend/app/auth.py`), which is scoped solely to user login for AI chat history.

### 7.2 Decision & User Instruction Compliance
`ORIGINAL_REQUEST.md` (lines 12–13) states:
> *"Only implement password protection and expiry dates if already supported by the existing backend/database architecture."*

**Conclusion:** Neither password protection nor custom user-configured expiry dates are supported by the existing architecture. Therefore, they **must NOT be implemented**. A fixed, system-enforced 24-hour cleanup policy fulfills the retention requirement without adding unsupported complexity.

---

## 8. Summary of Proposed Backend Extensions

To implement the PDF to QR Code Generator backend securely and cleanly, the following additions should be scheduled:

1. **`backend/requirements.txt` & `pyproject.toml`:**
   - Add `python-multipart>=0.0.9` for multipart form parsing.
2. **`backend/app/database.py`:**
   - In `_ensure_indexes()`, add TTL and unique indexes on `pdf_uploads`:
     - `uq_pdf_uploads_id` on `id` (unique: True)
     - `idx_pdf_expires_at` on `expiresAt` with `expireAfterSeconds=0`
3. **`backend/app/repositories.py`:**
   - Add `"pdf_uploads": []` to `self.memory`.
   - Add methods:
     - `add_pdf_upload(payload: dict) -> dict`
     - `get_pdf_metadata(document_id: str) -> dict | None`
     - `get_pdf_binary(document_id: str) -> tuple[bytes, dict] | None`
     - `remove_pdf_upload(document_id: str, delete_token: str | None = None) -> bool`
4. **`backend/app/main.py`:**
   - Add rate limiter utility for upload/download endpoints.
   - Add routes:
     - `POST /api/pdf/upload` (accepts `file: UploadFile`)
     - `GET /api/pdf/{document_id}` (renders inline PDF preview)
     - `GET /api/pdf/{document_id}/metadata` (returns JSON metadata)
     - `GET /api/pdf/{document_id}/download` (attachment download)
     - `DELETE /api/pdf/{document_id}` (immediate invalidation)
