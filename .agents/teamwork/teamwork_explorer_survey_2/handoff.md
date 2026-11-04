# Handoff Report — Backend & Storage Survey for PDF to QR Code Generator

**Date:** 2026-11-04  
**Agent:** Explorer 2 (Backend Storage Survey Explorer)  
**Parent:** Orchestrator (`f95d3a59-3a8c-4581-9f3a-23cc3972df45`)  
**Working Directory:** `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_survey_2`  
**Status:** Hard Handoff (Investigation Complete)

---

## 1. Observation

Direct observations from codebase inspection, file reviews, and environment execution:

1. **Framework & Runtime Configuration:**
   - `backend/pyproject.toml` (lines 1–17) specifies:
     ```toml
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
   - `backend/run.py` (lines 8–14) executes `uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)`.
   - `backend/server.py` (lines 1–2) exposes `from app.main import app` for Vercel deployment.
   - `backend/app/main.py` (lines 103–108) instantiates `app = FastAPI(title="LakshSolanki Backend", version="2.0.0", description="Python backend for the main site API.", lifespan=lifespan)`.

2. **Endpoints & File Handling:**
   - In `backend/app/main.py`: Current endpoints are `GET /`, `GET /health`, `GET /ready`, `GET/POST /api/courses`, `GET /api/projects/certificate-gen`, `GET/POST /api/media`, `GET/POST/DELETE /api/tts/snippets`, `POST/GET/DELETE /api/subscribe`, `POST /api/ai/chat`, and `GET/PUT/DELETE /api/ai/history`.
   - A ripgrep search for `UploadFile` in `backend/` returned zero matches. There are currently no multipart or file upload endpoints in the backend.
   - `pip list` confirmed `python-multipart` (version 0.0.32) is installed in the local Python 3.14.6 environment, but it is absent from `backend/requirements.txt` and `pyproject.toml`.

3. **Storage & Persistence Architecture:**
   - `backend/app/database.py` (lines 32–82) connects to MongoDB via `MongoClient(self.settings.mongodb_uri)`.
   - Executing `python -c "import sys; sys.path.insert(0, 'backend'); from app.config import settings; from app.database import DatabaseManager; dm = DatabaseManager(settings); print('Status:', dm.status.mode, 'Connected:', dm.status.connected)"` output:
     `Status: mongo Connected: True Reason:`
   - MongoDB collection enumeration returned existing collections: `['ai_conversations', 'subscriptions', 'tts_snippets', 'courses', 'media']`.
   - `backend/app/repositories.py` (lines 142–156) initializes `self.memory` with keys `"courses"`, `"media"`, `"subscriptions"`, `"tts_snippets"`, `"ai_conversations"` to provide transparent fallback when MongoDB is unavailable.

4. **Cryptographic ID Generation:**
   - `backend/app/utils.py` (lines 15–16) defines:
     ```python
     def generate_id() -> str:
         return str(uuid4())
     ```
   - Public entities across all existing repositories format identifiers via this UUID4 generator.

5. **Security, Rate Limiting & Lifecycle:**
   - `backend/app/config.py` (line 108) defines `max_request_body_bytes = _to_positive_int(os.getenv("REQUEST_BODY_LIMIT_BYTES"), 262144)` (256 KB default for general requests).
   - Searches for `rate` in `backend/` showed zero rate-limiting middleware or utilities.
   - Searches for `expire` or `cleanup` in `backend/` returned zero results. No TTL indexes, cron jobs, or background cleanup routines currently exist.

6. **Password Protection & Expiry Dates:**
   - Searches for `password` and `expiry` in `backend/` returned zero matches. No password hashing (`bcrypt`/`argon2`), password fields, or custom expiry dates exist in any backend model or MongoDB collection.
   - `ORIGINAL_REQUEST.md` (lines 12–13) explicitly mandates:
     > *"Only implement password protection and expiry dates if already supported by the existing backend/database architecture."*

---

## 2. Logic Chain

1. **Framework Selection (FastAPI):**
   - *Observation:* The project's backend is a Python FastAPI service located in `backend/app/main.py`. The frontend is a static Vue 3 SPA that interacts with the backend over HTTP via `frontend/src/utils/apiBaseUrl.js` (`http://localhost:5001` or `https://lakshsolanki-backend.vercel.app`).
   - *Inference:* All upload, retrieval, and deletion APIs must be implemented as native FastAPI route handlers within `backend/app/main.py` and repository methods in `backend/app/repositories.py`.

2. **Storage Architecture (Database + Memory Fallback vs Local Disk):**
   - *Observation:* The backend is configured for deployment on Vercel (`pyproject.toml: [tool.vercel] entrypoint = "backend.app.main:app"` and `backend/server.py`). On Vercel serverless functions, the local filesystem is ephemeral and read-only. In contrast, MongoDB connection is active and live (`Cluster0`, DB `LakshSolanki`), and `Repositories` supports an in-memory dictionary fallback.
   - *Inference:* Storing uploaded PDFs as binary data in MongoDB (`bson.Binary`) in a new collection `pdf_uploads` (with fallback to `self.memory["pdf_uploads"]`) guarantees that files persist across serverless invocations and remain accessible to any instance handling the public QR landing page.

3. **Security Architecture (Binary Magic Bytes, Size, Traversal):**
   - *Observation:* Frontend validation (`file.type === "application/pdf"`) is spoofable. General request body limit is 256 KB, which would block typical PDFs. No rate limiting or path validation exists.
   - *Inference:*
     - The backend must validate the binary header for `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`) and the trailer for `%%EOF` within the last 2048 bytes.
     - A dedicated limit of 10 MB must be enforced for PDF uploads with HTTP 413 responses.
     - Client IP sliding window rate limiting (10 uploads/min) must be added.
     - All retrieval operations must strictly index by UUID4, rejecting any input containing `..`, `/`, or `\`.

4. **Lifecycle & Retention (TTL Index + Lazy Pruning):**
   - *Observation:* No scheduled tasks or cron engines exist. MongoDB supports native TTL indexes (`expireAfterSeconds=0` on datetime fields).
   - *Inference:* Configuring an index on `pdf_uploads.expiresAt` with `expireAfterSeconds=0` allows MongoDB to automatically delete expired files after 24 hours without requiring an external task runner. For in-memory mode, lazy pruning on access/write handles cleanup.

5. **Exclusion of Password Protection & Expiry Dates:**
   - *Observation:* No password protection or expiry date fields exist in the backend. `ORIGINAL_REQUEST.md` stipulates: *"Only implement password protection and expiry dates if already supported by the existing backend/database architecture."*
   - *Inference:* Password protection and custom user expiry dates must NOT be implemented. A system-level 24-hour cleanup policy fulfills the retention requirement.

---

## 3. Caveats

- **MongoDB 16 MB Document Limit:** Storing PDFs as `bson.Binary` inside MongoDB documents limits file size to under 16 MB. The proposed 10 MB file size limit safely respects this boundary without requiring GridFS complexity.
- **Serverless In-Memory Isolation:** In Vercel serverless environments, if MongoDB is disconnected, in-memory state is isolated to individual lambda instances. In production, MongoDB must remain connected for persistence across users and functions.

---

## 4. Conclusion

The existing backend is an established FastAPI service with a clean repository abstraction layer and an active MongoDB database. Implementing the PDF to QR Code Generator backend requires:
1. Adding `python-multipart` to `backend/requirements.txt`.
2. Adding a `pdf_uploads` collection to `backend/app/database.py` with unique `id` and TTL `expiresAt` indexes.
3. Adding binary PDF CRUD operations to `backend/app/repositories.py` (`add_pdf_upload`, `get_pdf_binary`, `get_pdf_metadata`, `remove_pdf_upload`).
4. Adding endpoints to `backend/app/main.py`:
   - `POST /api/pdf/upload` (multipart/form-data, 10MB limit, magic byte validation, rate-limited)
   - `GET /api/pdf/{document_id}` (binary inline stream)
   - `GET /api/pdf/{document_id}/download` (binary attachment stream)
   - `GET /api/pdf/{document_id}/metadata` (JSON metadata)
   - `DELETE /api/pdf/{document_id}` (immediate invalidation)
5. Not implementing password protection or custom expiry dates, in strict adherence to user requirements.

Detailed technical specifications and code templates are documented in `analysis.md`.

---

## 5. Verification Method

To independently verify the observations and conclusions in this report:

1. **Verify Backend Framework & Dependencies:**
   - View `backend/pyproject.toml` lines 1–17 and `backend/requirements.txt` lines 1–8.
   - View `backend/run.py` lines 8–14 and `backend/server.py` lines 1–2.
2. **Verify Database Connectivity:**
   - Run:
     ```powershell
     python -c "import sys; sys.path.insert(0, 'backend'); from app.config import settings; from app.database import DatabaseManager; dm = DatabaseManager(settings); print('Status:', dm.status.mode, 'Connected:', dm.status.connected)"
     ```
     Expected output: `Status: mongo Connected: True Reason:`
3. **Verify Absence of Existing Upload Endpoints & Rate Limiting:**
   - Run grep in `backend/`: `grep_search` for `UploadFile` (0 matches) and `rate` (0 rate-limiter matches).
4. **Verify Absence of Password & Expiry Fields:**
   - Run grep in `backend/`: `grep_search` for `password` (0 matches) and `expiry` (0 matches).
5. **Verify ID Generation:**
   - View `backend/app/utils.py` lines 15–16 (`generate_id() -> str: return str(uuid4())`).
