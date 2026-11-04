# Handoff Report — Milestone 1 Database & Repository Layer Blueprint

**Agent:** Explorer M1-2 (Storage & Retention Architecture Specialist)  
**Parent:** Orchestrator (`f95d3a59-3a8c-4581-9f3a-23cc3972df45`)  
**Working Directory:** `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_2`  
**Handoff Type:** Hard (Exploration & Design Complete)  

---

## 1. Observation

Direct observations from codebase inspection, runtime tool commands, and database tests:

1. **Database Manager & Index Configuration (`backend/app/database.py`):**
   - Lines 32–82 establish the MongoDB connection via `MongoClient(self.settings.mongodb_uri)`.
   - Lines 92–140 define `_ensure_indexes(self)` creating indexes for `courses`, `media`, `subscriptions`, `tts_snippets`, and `ai_conversations`.
   - Command execution confirmed live MongoDB connection and index capabilities:
     ```powershell
     python -c "import sys; sys.path.insert(0, 'backend'); from app.config import settings; from app.database import DatabaseManager; from pymongo import ASCENDING; dm = DatabaseManager(settings); db = dm.ensure_connected(); db['pdf_uploads'].create_index([('id', ASCENDING)], unique=True, name='uq_pdf_uploads_id'); db['pdf_uploads'].create_index([('expiresAt', ASCENDING)], expireAfterSeconds=0, name='ttl_pdf_uploads_expires_at'); print('Indexes:', db['pdf_uploads'].index_information())"
     ```
     Output:
     `Indexes: {'_id_': {'v': 2, 'key': [('_id', 1)]}, 'uq_pdf_uploads_id': {'v': 2, 'key': [('id', 1)], 'unique': True}, 'ttl_pdf_uploads_expires_at': {'v': 2, 'key': [('expiresAt', 1)], 'expireAfterSeconds': 0}}`
   - Test documents with `bson.Binary` and BSON Date were inserted, queried, projected, and deleted cleanly.

2. **Repository Architecture (`backend/app/repositories.py`):**
   - Lines 142–156 initialize `self.memory` with keys `"courses"`, `"media"`, `"subscriptions"`, `"tts_snippets"`, `"ai_conversations"`. There is currently no `"pdf_uploads"` key in `self.memory`.
   - Lines 61–67 define `_to_public_media(document)`, demonstrating the pattern of popping binary data (`data`, `binary`, `bytes`, `buffer`) from public representations.

3. **Timezone & Datetime Serialization Gotchas:**
   - Command execution testing PyMongo BSON date decoding:
     ```powershell
     python -c "from datetime import datetime, timezone; import bson; now = datetime.now(timezone.utc); decoded = bson.decode(bson.encode({'expiresAt': now}))['expiresAt']; print('tzinfo:', decoded.tzinfo)"
     ```
     Output: `tzinfo: None`. PyMongo decodes BSON dates as naive datetimes.
   - Comparing this naive datetime with `datetime.now(timezone.utc)`:
     ```powershell
     python -c "from datetime import datetime, timezone; import bson; now = datetime.now(timezone.utc); decoded = bson.decode(bson.encode({'expiresAt': now}))['expiresAt']; print(decoded > datetime.now(timezone.utc))"
     ```
     Output: `TypeError: can't compare offset-naive and offset-aware datetimes`.
   - Testing Starlette `JSONResponse` with raw datetime:
     ```powershell
     python -c "from starlette.responses import JSONResponse; from datetime import datetime, timezone; JSONResponse(content={'time': datetime.now(timezone.utc)})"
     ```
     Output: `TypeError: Object of type datetime is not JSON serializable`.
   - Verified that converting datetimes to canonical ISO 8601 strings ending in `"Z"` (via `_to_iso()`) and normalizing with `_normalize_datetime()` completely eliminates both errors.

---

## 2. Logic Chain

1. **MongoDB Collection & Index Design:**
   - *Observation:* The project requires predictable 24-hour retention cleanup without permanent storage of user PDFs (`PROJECT.md` Feature 9).
   - *Inference:* Creating a TTL index on `expiresAt` with `expireAfterSeconds=0` enables MongoDB's native server thread to automatically evict documents where `current_time >= expiresAt`.
   - *Observation:* MongoDB TTL monitor only tracks BSON Date objects, not string representations.
   - *Inference:* `expiresAt` must be written to MongoDB as a Python `datetime.datetime` object.

2. **Dual-Mode Persistence & Lazy In-Memory Cleanup:**
   - *Observation:* The application must support serverless deployment and environments where MongoDB might be unavailable (`Repositories` class supports transparent memory fallback).
   - *Inference:* `self.memory["pdf_uploads"]` must store uploaded PDFs in memory when MongoDB is not connected. Because in-memory mode lacks a background TTL thread, `_cleanup_memory_expired()` must execute on all read/write operations to discard expired items, and specific item access must verify `expiresAt > now`.

3. **Metadata Projection Optimization:**
   - *Observation:* Uploaded PDF files can be up to 10 MB. `GET /api/pdf/{id}/metadata` is called for link resolution and preview info.
   - *Inference:* Querying MongoDB with projection `{"content": 0, "_id": 0}` ensures the multi-megabyte binary payload is not read from disk or transmitted across the network during metadata checks.

4. **Timezone & Serialization Safety:**
   - *Observation:* PyMongo decodes BSON dates as offset-naive datetimes, which crash Python with `TypeError` when compared with `datetime.now(timezone.utc)`. Furthermore, Starlette's `JSONResponse` throws `TypeError` on raw datetimes.
   - *Inference:* All datetimes must be normalized using `_normalize_datetime(val)` before comparison, and formatted to canonical ISO 8601 strings ending in `"Z"` via `_to_iso()` in public dictionary responses.

---

## 3. Caveats

1. **MongoDB 60-Second TTL Latency Window:** MongoDB's background TTL thread runs approximately once every 60 seconds. A document could remain in the collection for up to 60 seconds past its expiration before the background job deletes it. The proposed blueprint mitigates this completely by performing an eager check in `get_pdf_upload` and `get_pdf_metadata`: if `expiresAt <= now`, it deletes the document immediately and returns `None`.
2. **Serverless Memory Isolation:** In Vercel serverless functions without MongoDB, in-memory state is isolated to each execution instance. MongoDB connection is active and recommended for cross-request consistency.
3. **Password Protection / Custom Expiry Exclusion:** In accordance with user requirements and existing architecture, no password fields or custom user expiration dates are introduced.

---

## 4. Conclusion

The database and repository architecture for Milestone 1 is completely designed and validated:
1. `backend/app/database.py`:
   - Expose `@property def pdf_uploads(self) -> Collection | None` on `DatabaseManager`.
   - In `_ensure_indexes()`, create `uq_pdf_uploads_id` (`[("id", ASCENDING)]`, `unique=True`) and `ttl_pdf_uploads_expires_at` (`[("expiresAt", ASCENDING)]`, `expireAfterSeconds=0`).
2. `backend/app/repositories.py`:
   - Initialize `self.memory["pdf_uploads"] = []`.
   - Implement `add_pdf_upload`, `get_pdf_upload`, `get_pdf_metadata`, and `remove_pdf_upload`.
   - Implement `_cleanup_memory_expired` for lazy in-memory garbage collection.
   - Implement `_normalize_datetime`, `_to_iso`, and `_sanitize_pdf_filename`.
   - Use projection `{"content": 0, "_id": 0}` in `get_pdf_metadata`.
3. Complete implementation blueprint and unit test specifications are documented in `analysis.md`.

---

## 5. Verification Method

To independently verify the architecture and recommendations:

1. **Verify Live MongoDB Indexes:**
   ```powershell
   python -c "import sys; sys.path.insert(0, 'backend'); from app.config import settings; from app.database import DatabaseManager; dm = DatabaseManager(settings); print(dm.db['pdf_uploads'].index_information())"
   ```
   Expected output shows `uq_pdf_uploads_id` and `ttl_pdf_uploads_expires_at` with `expireAfterSeconds: 0`.

2. **Verify Timezone & Datetime Serialization:**
   ```powershell
   python -c "from datetime import datetime, timezone; from starlette.responses import JSONResponse; iso = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'); resp = JSONResponse(content={'expiresAt': iso}); print(resp.status_code, resp.body.decode())"
   ```
   Expected output: `200 {"expiresAt":"2026-..."}` without any `TypeError`.

3. **Verify Analysis Blueprint:**
   Read `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_2\analysis.md`.
