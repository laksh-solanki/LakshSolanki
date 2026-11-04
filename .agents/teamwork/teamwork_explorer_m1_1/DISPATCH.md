## 2026-11-04T11:14:18Z
You are Explorer M1-1: Backend Endpoints & Security Specialist.
Your working directory is: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_1
Your parent is orchestrator (conversation ID: f95d3a59-3a8c-4581-9f3a-23cc3972df45).

MANDATORY: First read:
- ORIGINAL_REQUEST.md at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\PROJECT.md
- Prior survey at: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_survey_2\handoff.md

Objective:
Prepare the concrete implementation plan and code blueprint for Milestone 1's FastAPI endpoints in `backend/app/main.py`:
1. `POST /api/pdf/upload`: accepts `UploadFile`, validates content starts with `b"%PDF-"` and ends with `b"%%EOF"` within last 2048 bytes, enforces 10MB limit (HTTP 413), checks MIME type, extracts client IP and applies sliding-window rate limiting (10 uploads/min per IP, HTTP 429), stores file via repository, and returns JSON `{"status": "success", "id": "<uuid4>", "filename": str, "size": int, "url": f"/v/{id}", "expires_at": str}`.
2. `GET /api/pdf/{id}` and `GET /api/pdf/{id}/file` or `/download`: validates UUID4 regex to prevent path traversal, streams binary with appropriate Content-Disposition headers (inline vs attachment) or returns HTTP 404.
3. `GET /api/pdf/{id}/metadata`: returns JSON metadata or HTTP 404.
4. `DELETE /api/pdf/{id}`: immediately invalidates and deletes file from storage, returning `{"status": "deleted", "id": id}` or HTTP 404.
5. Ensure CORS headers permit frontend requests.

Constraints:
- Read-only exploration. DO NOT write or edit source code files.
- Produce your report in `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_1\analysis.md` and handoff in `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_1\handoff.md`.
- Keep `progress.md` updated. Send completion message to orchestrator when done.
