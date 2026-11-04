## 2026-11-04T11:32:12Z
You are the Milestone 1 Implementation Worker: Backend APIs, Secure Storage, and Tests.
Your working directory is: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_worker_m1_1
Your parent is orchestrator (conversation ID: f95d3a59-3a8c-4581-9f3a-23cc3972df45).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: First read:
- ORIGINAL_REQUEST.md at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\PROJECT.md
- M1-1 Blueprint at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_1\handoff.md and analysis.md
- M1-2 Blueprint at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_2\handoff.md and analysis.md
- M1-3 Blueprint at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_3\handoff.md and analysis.md

Write Ownership:
You have exclusive write ownership of the following files:
- `backend/requirements.txt`
- `pyproject.toml`
- `backend/app/database.py`
- `backend/app/repositories.py`
- `backend/app/main.py`
- `backend/tests/test_pdf_upload.py`
You MUST NOT write to any frontend files.

Implementation Tasks:
1. Update `backend/requirements.txt` and `pyproject.toml` to add `python-multipart>=0.0.20` and `pytest>=8.0.0`.
2. Update `backend/app/database.py`:
   - Add property `pdf_uploads` on `DatabaseManager`.
   - In `_ensure_indexes()`, create unique index `uq_pdf_uploads_id` on `"id"` and TTL index `ttl_pdf_uploads_expires_at` on `"expiresAt"` with `expireAfterSeconds=0`.
3. Update `backend/app/repositories.py`:
   - Initialize `self.memory["pdf_uploads"] = []`.
   - Implement `add_pdf_upload(doc_id, filename, content, size, ttl_hours=24)` supporting both MongoDB (storing binary as `bson.Binary`) and memory fallback.
   - Implement `get_pdf_upload(doc_id)`, `get_pdf_metadata(doc_id)` (with projection `{"content": 0, "_id": 0}`), and `remove_pdf_upload(doc_id)`.
   - Implement `_cleanup_memory_expired()`, `_normalize_datetime()`, and `_to_iso()`.
4. Update `backend/app/main.py`:
   - Add thread-safe sliding-window rate limiter (10 uploads/min per client IP) returning HTTP 429 with `Retry-After`.
   - Implement `POST /api/pdf/upload` (chunked reading enforcing 10MB limit returning HTTP 413, magic bytes `%PDF-` and `%%EOF` verification returning HTTP 400, UUID4 ID generation, 24h retention, returning 200 OK JSON).
   - Implement `GET /api/pdf/{id}` and `GET /api/pdf/{id}/file` (inline binary stream) and `GET /api/pdf/{id}/download` (attachment stream).
   - Implement `GET /api/pdf/{id}/metadata` (JSON metadata).
   - Implement `DELETE /api/pdf/{id}` (immediate removal).
   - Strict UUID4 regex validation to defend against path traversal across all GET/DELETE endpoints.
   - Ensure `http_exception_handler` passes `headers=exc.headers`.
   - Add `"Content-Disposition"`, `"Content-Length"`, `"Retry-After"` to CORS `expose_headers`.
5. Implement `backend/tests/test_pdf_upload.py` with all 10 test scenarios designed by Explorer M1-3.
6. Run the test suite:
   `python -m pytest backend/tests/test_pdf_upload.py -v -W ignore::DeprecationWarning`
   Verify 100% of tests pass.

Deliverables:
- Implement all files cleanly.
- Document test results and commands in your `handoff.md` (`c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_worker_m1_1\handoff.md`).
- Update `progress.md`.
- Send completion message to orchestrator via `send_message`.
