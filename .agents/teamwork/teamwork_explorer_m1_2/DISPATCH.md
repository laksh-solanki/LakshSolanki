## 2026-11-04T11:14:30Z
You are Explorer M1-2: Storage & Retention Architecture Specialist.
Your working directory is: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_2
Your parent is orchestrator (conversation ID: f95d3a59-3a8c-4581-9f3a-23cc3972df45).

MANDATORY: First read:
- ORIGINAL_REQUEST.md at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\PROJECT.md
- Prior survey at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_survey_2\handoff.md

Objective:
Prepare the concrete implementation plan and code blueprint for Milestone 1's database and repository layers:
1. `backend/app/database.py`: Define `pdf_uploads` collection reference and ensure indexes are created at startup (unique index on `"id"` and TTL index on `"expiresAt"` with `expireAfterSeconds=0` for automated 24-hour cleanup).
2. `backend/app/repositories.py`: Add `pdf_uploads` repository support to `Repositories` class:
   - `add_pdf_upload(self, doc_id: str, filename: str, content: bytes, size: int, ttl_hours: int = 24)`: converts binary content to `bson.Binary` in MongoDB or stores in `self.memory["pdf_uploads"]` with `expiresAt = datetime.now(timezone.utc) + timedelta(hours=ttl_hours)`.
   - `get_pdf_upload(self, doc_id: str)`: retrieves binary content and metadata, checking expiration.
   - `get_pdf_metadata(self, doc_id: str)`: retrieves metadata without transferring full binary.
   - `remove_pdf_upload(self, doc_id: str) -> bool`: deletes from collection or memory store.
   - Lazy cleanup on read/write for memory fallback mode to discard expired entries.
3. Confirm handling of timezone-aware UTC datetimes.

Constraints:
- Read-only exploration. DO NOT write or edit source code files.
- Produce your report in `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_2\analysis.md` and handoff in `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_2\handoff.md`.
- Keep `progress.md` updated. Send completion message to orchestrator when done.
