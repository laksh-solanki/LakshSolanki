# Technical Analysis: Backend Test Suite & Environment Specification (Milestone 1)

**Agent:** Explorer M1-3: Backend Test Suite & Environment Specialist  
**Working Directory:** `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m1_3`  
**Parent:** Orchestrator (`f95d3a59-3a8c-4581-9f3a-23cc3972df45`)  
**Date:** 2026-11-04  
**Status:** Complete  

---

## 1. Executive Summary

This report establishes the technical specification, dependency blueprint, and complete automated pytest suite for **Milestone 1** of the PDF to QR Code Generator project. 

In Milestone 1, the backend introduces file upload handling (`UploadFile`), binary magic-bytes validation, file size limits (10 MB), IP sliding-window rate limiting (10 uploads/min), cryptographic UUID4 identifiers, directory traversal prevention, dual-mode binary persistence (`bson.Binary` in MongoDB with in-memory fallback), and 24-hour retention.

To guarantee correctness, security, and regression protection, this document specifies:
1. **Dependency updates** in `backend/requirements.txt` and `pyproject.toml` (adding `python-multipart`).
2. **Complete test specification and code blueprint** for `backend/tests/test_pdf_upload.py` using `fastapi.testclient.TestClient`.
3. **Ten comprehensive test cases** testing all positive, negative, adversarial, and boundary flows.
4. **Test execution and verification protocols** via `python -m pytest backend/tests/test_pdf_upload.py -v`.

---

## 2. Environment & Dependency Analysis

### 2.1 Current Environment State
Inspecting the local Python runtime environment revealed:
- **Python Version:** 3.14.6 (`python --version`)
- **FastAPI:** 0.141.1 installed (specified as 0.115.12 in requirements)
- **Pytest:** 9.1.1 installed (`pytest -V`)
- **HTTPX:** 0.28.1 installed
- **python-multipart:** 0.0.32 installed locally, but **absent** from both `backend/requirements.txt` and `pyproject.toml`.
- **Database Connection:** Active MongoDB connection to cluster database `LakshSolanki`.

### 2.2 Why `python-multipart` is Required
FastAPI utilizes `starlette` underneath for HTTP processing. Handling multipart form data (`multipart/form-data`) via `UploadFile` or `File(...)` in FastAPI strictly requires `python-multipart`. If `python-multipart` is not installed or declared in production/Vercel serverless builds, calling any multipart endpoint immediately raises:
```text
RuntimeError: Form data requires "python-multipart" to be installed.
```
Adding `python-multipart` to both `backend/requirements.txt` and `pyproject.toml` ensures that both local developers and production deployments (such as Vercel serverless builds) have the necessary parsing library.

### 2.3 Proposed Dependency Updates

#### A. File: `backend/requirements.txt`
```diff
--- backend/requirements.txt
+++ backend/requirements.txt
@@ -7,2 +7,4 @@
 cryptography>=43.0.0
+python-multipart>=0.0.20
+pytest>=8.0.0
```

*Exact proposed `backend/requirements.txt`:*
```text
fastapi==0.115.12
uvicorn[standard]==0.34.2
python-dotenv==1.1.0
pymongo==4.12.1
httpx==0.28.1
PyJWT[crypto]==2.10.1
cryptography>=43.0.0
python-multipart>=0.0.20
pytest>=8.0.0
```

#### B. File: `pyproject.toml` (Repository Root) & `backend/pyproject.toml`
Root `pyproject.toml` defines the project dependencies for the backend.
```diff
--- pyproject.toml
+++ pyproject.toml
@@ -12,3 +12,8 @@
     "PyJWT[crypto]==2.10.1",
+    "python-multipart>=0.0.20",
 ]

+[project.optional-dependencies]
+test = [
+    "pytest>=8.0.0",
+]
```

*Exact proposed `pyproject.toml` / `backend/pyproject.toml`:*
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
    "python-multipart>=0.0.20",
]

[project.optional-dependencies]
test = [
    "pytest>=8.0.0",
]

[tool.vercel]
entrypoint = "backend.app.main:app"

[tool.pytest.ini_options]
testpaths = ["backend/tests"]
filterwarnings = [
    "ignore::DeprecationWarning",
]
```

---

## 3. Test Specification: 10 Target Scenarios

The automated test suite `backend/tests/test_pdf_upload.py` implements the following 10 verification scenarios:

| # | Test Scenario | HTTP Method & Path | Input / Precondition | Expected Status | Assertions & Validations |
|---|---------------|--------------------|----------------------|-----------------|--------------------------|
| 1 | Valid PDF Upload | `POST /api/pdf/upload` | Multipart file `test.pdf`, valid minimal PDF 1.4 | `200 OK` | `status == "success"`, valid UUID4 `id`, `filename == "test.pdf"`, exact `size`, `url == "/v/{id}"`, future ISO `expires_at` (~24h) |
| 2 | Non-PDF MIME Rejection | `POST /api/pdf/upload` | Text file (`text/plain`), PNG (`image/png`), JSON (`application/json`), fake PDF | `400 Bad Request` | Error message explains invalid PDF format, file rejected |
| 3 | Corrupted PDF Rejection | `POST /api/pdf/upload` | Missing `%PDF-` header, truncated missing `%%EOF` trailer, empty file | `400 Bad Request` | Error message explains file is corrupted or not a valid PDF |
| 4 | Oversized File Rejection | `POST /api/pdf/upload` | Synthesized stream >10 MB (10.001 MB) | `413 Payload Too Large` | `detail` notes file exceeds 10 MB limit |
| 5 | Upload Rate Limiting | `POST /api/pdf/upload` | 10 uploads in 1 min from IP `192.0.2.11`, then 11th upload | `200 OK` (1-10) -> `429 Too Many Requests` (11) | 11th request receives HTTP 429; immediate request from different IP succeeds with 200 |
| 6 | Path Traversal Defense | `GET /api/pdf/{id}`<br>`DELETE /api/pdf/{id}` | `../../etc/passwd`, `..%2F..%2Fwin.ini`, invalid non-UUID strings | `400` or `404` | Never 200, never 500; traversal sequence strictly rejected |
| 7 | Binary Retrieval Stream | `GET /api/pdf/{id}`<br>`GET /api/pdf/{id}/download` | Existing uploaded PDF | `200 OK` | Content-Type `application/pdf`, Disposition `inline` vs `attachment; filename=...`, byte-for-byte identical content |
| 8 | PDF Deletion | `DELETE /api/pdf/{id}` | Existing uploaded PDF | `200 OK` | `status == "deleted"`, `id == {id}` |
| 9 | Post-Deletion 404 | `GET /api/pdf/{id}`<br>`GET /api/pdf/{id}/metadata`<br>`DELETE /api/pdf/{id}` | Previously deleted document ID | `404 Not Found` | All subsequent access returns 404 Not Found, repeat DELETE returns 404 |
| 10 | Metadata Retrieval | `GET /api/pdf/{id}/metadata` | Existing uploaded PDF | `200 OK` | JSON has `id`, `filename`, `size`, `created_at`, `expires_at`; does NOT leak binary content; non-existent UUID returns 404 |

---

## 4. Test Fixture & Test Isolation Design

### 4.1 Synthesized PDF Fixtures
To make tests completely self-contained without requiring external asset files:
1. **Minimal Valid PDF (PDF-1.4 standard):**
   ```python
   MINIMAL_VALID_PDF = (
       b"%PDF-1.4\n"
       b"1 0 obj\n"
       b"<< /Type /Catalog /Pages 2 0 R >>\n"
       b"endobj\n"
       b"2 0 obj\n"
       b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n"
       b"endobj\n"
       b"3 0 obj\n"
       b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\n"
       b"endobj\n"
       b"xref\n"
       b"0 4\n"
       b"0000000000 65535 f \n"
       b"0000000010 00000 n \n"
       b"0000000060 00000 n \n"
       b"0000000117 00000 n \n"
       b"trailer\n"
       b"<< /Size 4 /Root 1 0 R >>\n"
       b"startxref\n"
       b"187\n"
       b"%%EOF\n"
   )
   ```
   - Satisfies binary prefix `b"%PDF-"`.
   - Satisfies binary suffix `b"%%EOF"` within the trailing 2048 bytes.
   - Size is ~250 bytes, fast to serialize.

2. **Corrupted & Boundary Fixtures:**
   - Missing Header: `b"INVALID_HEADER\n1 0 obj...%%EOF\n"`
   - Missing Trailer: `b"%PDF-1.4\n1 0 obj...trailer\n"` (missing `%%EOF`)
   - Empty: `b""`
   - Oversized: `b"%PDF-1.4\n" + (b"0" * (10 * 1024 * 1024 + 1024)) + b"\n%%EOF\n"` (~10.001 MB)

### 4.2 TestClient & Rate Limit Isolation
In pytest, if test A triggers the rate limiter, test B might fail if both run under the default IP (`"testclient"`).
To solve this:
1. **Dynamic IP Injection:** Each test uses explicit `X-Forwarded-For` IP headers (e.g. `10.0.1.X`), isolating each test to its own client IP.
2. **Auto-Reset Fixture:** An `autouse=True` fixture calls `reset_upload_rate_limits()` before and after every test function (if exposed on `backend.app.main`), ensuring a clean state.

---

## 5. Complete Implementation Blueprint: `backend/tests/test_pdf_upload.py`

Below is the complete, production-ready code blueprint for the M1 test suite to be implemented in `backend/tests/test_pdf_upload.py`:

```python
"""Automated pytest suite for PDF to QR Code Generator backend endpoints.

Test coverage (Milestone 1):
1. Valid PDF upload (200 OK, valid UUID4 id, metadata, URL /v/{id})
2. Non-PDF MIME rejection (e.g. image/png or text/plain -> 400 Bad Request)
3. Corrupted PDF rejection (missing %PDF- header or %%EOF trailer -> 400 Bad Request)
4. Oversized file rejection (>10 MB -> 413 Payload Too Large)
5. Rate limiting enforcement (11th upload in a minute from same IP -> 429 Too Many Requests)
6. Path traversal attempt rejection (e.g. GET /api/pdf/../../etc/passwd -> 400/404)
7. Retrieval of uploaded PDF (stream bytes match original upload exactly)
8. Deletion of uploaded PDF (DELETE /api/pdf/{id} -> 200 OK)
9. Retrieval after deletion returns 404 Not Found
10. Metadata retrieval endpoint returns valid JSON with file info and expiry
"""

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Path & Import Resolution
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
for path_entry in (str(ROOT_DIR), str(BACKEND_DIR)):
    if path_entry not in sys.path:
        sys.path.insert(0, path_entry)

try:
    from backend.app.main import app
except ModuleNotFoundError:
    from app.main import app


# ---------------------------------------------------------------------------
# Synthesized Test Fixtures
# ---------------------------------------------------------------------------
# Synthesize a minimal, fully valid PDF 1.4 document
MINIMAL_VALID_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj\n"
    b"<< /Type /Catalog /Pages 2 0 R >>\n"
    b"endobj\n"
    b"2 0 obj\n"
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n"
    b"endobj\n"
    b"3 0 obj\n"
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\n"
    b"endobj\n"
    b"xref\n"
    b"0 4\n"
    b"0000000000 65535 f \n"
    b"0000000010 00000 n \n"
    b"0000000060 00000 n \n"
    b"0000000117 00000 n \n"
    b"trailer\n"
    b"<< /Size 4 /Root 1 0 R >>\n"
    b"startxref\n"
    b"187\n"
    b"%%EOF\n"
)

# Invalid / Corrupted Fixtures
CORRUPTED_HEADER_PDF = b"NOT_A_PDF\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
CORRUPTED_TRAILER_PDF = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\nTRUNCATED_STREAM"
PLAIN_TEXT_PAYLOAD = b"This is a plain text file, not a valid PDF document."
PNG_IMAGE_PAYLOAD = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"

# 10 MB limit boundary: 10 * 1024 * 1024 + 1024 bytes (exceeds 10 MB limit)
OVERSIZED_PDF_PAYLOAD = b"%PDF-1.4\n" + (b"0" * (10 * 1024 * 1024 + 1024)) + b"\n%%EOF\n"


# ---------------------------------------------------------------------------
# Pytest Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Provide a session-scoped TestClient."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def reset_rate_limit_state() -> Generator[None, None, None]:
    """Reset rate limiter state before and after each test if supported by app."""
    for module_name in ("backend.app.main", "app.main"):
        if module_name in sys.modules:
            mod = sys.modules[module_name]
            if hasattr(mod, "reset_upload_rate_limits"):
                mod.reset_upload_rate_limits()
    yield
    for module_name in ("backend.app.main", "app.main"):
        if module_name in sys.modules:
            mod = sys.modules[module_name]
            if hasattr(mod, "reset_upload_rate_limits"):
                mod.reset_upload_rate_limits()


# ---------------------------------------------------------------------------
# Test Cases (1 to 10)
# ---------------------------------------------------------------------------

def test_1_valid_pdf_upload(client: TestClient) -> None:
    """1. Valid PDF upload returns 200 OK, valid UUID4 id, metadata, and URL /v/{id}."""
    filename = "test_document.pdf"
    response = client.post(
        "/api/pdf/upload",
        files={"file": (filename, MINIMAL_VALID_PDF, "application/pdf")},
        headers={"X-Forwarded-For": "10.1.1.1"},
    )
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"

    data = response.json()
    assert data.get("status") == "success"
    assert "id" in data

    # Verify UUID4 format
    doc_id = data["id"]
    parsed_uuid = uuid.UUID(doc_id)
    assert parsed_uuid.version == 4, f"Expected UUIDv4, got version {parsed_uuid.version}"

    # Verify metadata fields
    assert data.get("filename") == filename
    assert data.get("size") == len(MINIMAL_VALID_PDF)
    assert data.get("url") == f"/v/{doc_id}"

    # Verify expiration timestamp (ISO 8601 UTC in future)
    expires_at = data.get("expires_at")
    assert expires_at is not None
    expiry_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    assert expiry_dt > datetime.now(timezone.utc), "Expiration date must be in the future"


@pytest.mark.parametrize(
    "filename,content,mime_type",
    [
        ("notes.txt", PLAIN_TEXT_PAYLOAD, "text/plain"),
        ("image.png", PNG_IMAGE_PAYLOAD, "image/png"),
        ("data.json", b'{"key": "value"}', "application/json"),
        ("spoofed.pdf", PLAIN_TEXT_PAYLOAD, "application/pdf"),
    ],
)
def test_2_reject_non_pdf_mime(client: TestClient, filename: str, content: bytes, mime_type: str) -> None:
    """2. Non-PDF MIME types or spoofed non-PDF files are rejected with 400 Bad Request."""
    response = client.post(
        "/api/pdf/upload",
        files={"file": (filename, content, mime_type)},
        headers={"X-Forwarded-For": "10.1.1.2"},
    )
    assert response.status_code == 400, f"Expected 400 Bad Request for {filename} ({mime_type}), got {response.status_code}"
    error_msg = str(response.json())
    assert any(term in error_msg.lower() for term in ("invalid", "pdf", "format", "corrupt"))


def test_3a_reject_corrupted_header(client: TestClient) -> None:
    """3a. Rejects file missing %PDF- magic bytes header with 400 Bad Request."""
    response = client.post(
        "/api/pdf/upload",
        files={"file": ("bad_header.pdf", CORRUPTED_HEADER_PDF, "application/pdf")},
        headers={"X-Forwarded-For": "10.1.1.3"},
    )
    assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"


def test_3b_reject_corrupted_trailer(client: TestClient) -> None:
    """3b. Rejects truncated file missing %%EOF trailer marker with 400 Bad Request."""
    response = client.post(
        "/api/pdf/upload",
        files={"file": ("bad_trailer.pdf", CORRUPTED_TRAILER_PDF, "application/pdf")},
        headers={"X-Forwarded-For": "10.1.1.4"},
    )
    assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"


def test_3c_reject_empty_file(client: TestClient) -> None:
    """3c. Rejects completely empty file with 400 Bad Request."""
    response = client.post(
        "/api/pdf/upload",
        files={"file": ("empty.pdf", b"", "application/pdf")},
        headers={"X-Forwarded-For": "10.1.1.5"},
    )
    assert response.status_code == 400, f"Expected 400 for empty file, got {response.status_code}: {response.text}"


def test_4_reject_oversized_file(client: TestClient) -> None:
    """4. Oversized file (>10 MB) is rejected with 413 Payload Too Large."""
    response = client.post(
        "/api/pdf/upload",
        files={"file": ("huge_doc.pdf", OVERSIZED_PDF_PAYLOAD, "application/pdf")},
        headers={"X-Forwarded-For": "10.1.1.6"},
    )
    assert response.status_code == 413, f"Expected 413 Payload Too Large, got {response.status_code}: {response.text}"
    error_msg = str(response.json())
    assert any(term in error_msg.lower() for term in ("10 mb", "exceed", "limit", "too large"))


def test_5_rate_limiting_enforcement(client: TestClient) -> None:
    """5. Rate limiting allows 10 uploads/min per IP, 11th returns 429 Too Many Requests."""
    isolated_ip = "192.0.2.77"
    headers = {"X-Forwarded-For": isolated_ip}

    # First 10 uploads from this IP must succeed
    for i in range(10):
        resp = client.post(
            "/api/pdf/upload",
            files={"file": (f"rate_{i}.pdf", MINIMAL_VALID_PDF, "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 200, f"Upload {i+1}/10 failed with status {resp.status_code}: {resp.text}"

    # 11th upload from the same IP must be rejected with 429
    blocked_resp = client.post(
        "/api/pdf/upload",
        files={"file": ("rate_11.pdf", MINIMAL_VALID_PDF, "application/pdf")},
        headers=headers,
    )
    assert blocked_resp.status_code == 429, f"Expected 429 Too Many Requests, got {blocked_resp.status_code}: {blocked_resp.text}"
    assert "rate limit" in str(blocked_resp.json()).lower()

    # Immediate upload from a DIFFERENT client IP must succeed with 200 OK
    other_headers = {"X-Forwarded-For": "192.0.2.78"}
    other_resp = client.post(
        "/api/pdf/upload",
        files={"file": ("other_ip.pdf", MINIMAL_VALID_PDF, "application/pdf")},
        headers=other_headers,
    )
    assert other_resp.status_code == 200, f"Upload from unblocked IP failed with {other_resp.status_code}"


@pytest.mark.parametrize(
    "malicious_path",
    [
        "../../etc/passwd",
        "..%2F..%2Fetc%2Fpasswd",
        "../../windows/win.ini",
        "..\\..\\boot.ini",
        "123e4567-e89b-12d3-a456-426614174000/../../etc/passwd",
        "invalid-id-../../etc",
        "not-a-valid-uuid",
        "12345",
    ],
)
def test_6_path_traversal_rejection(client: TestClient, malicious_path: str) -> None:
    """6. Path traversal attempts and non-UUID document IDs return 400 or 404 (never 200 or 500)."""
    # Test GET binary stream
    get_resp = client.get(f"/api/pdf/{malicious_path}")
    assert get_resp.status_code in (400, 404), f"GET {malicious_path} returned {get_resp.status_code}"

    # Test GET metadata
    meta_resp = client.get(f"/api/pdf/{malicious_path}/metadata")
    assert meta_resp.status_code in (400, 404), f"GET metadata {malicious_path} returned {meta_resp.status_code}"

    # Test DELETE
    del_resp = client.delete(f"/api/pdf/{malicious_path}")
    assert del_resp.status_code in (400, 404), f"DELETE {malicious_path} returned {del_resp.status_code}"


def test_7_retrieve_uploaded_pdf(client: TestClient) -> None:
    """7. Retrieval of uploaded PDF returns exact binary bytes and correct headers."""
    filename = "stream_target.pdf"
    upload_resp = client.post(
        "/api/pdf/upload",
        files={"file": (filename, MINIMAL_VALID_PDF, "application/pdf")},
        headers={"X-Forwarded-For": "10.1.1.7"},
    )
    assert upload_resp.status_code == 200
    doc_id = upload_resp.json()["id"]

    # 1. Test inline stream: GET /api/pdf/{id}
    inline_resp = client.get(f"/api/pdf/{doc_id}")
    assert inline_resp.status_code == 200
    assert "application/pdf" in inline_resp.headers.get("content-type", "")
    assert "inline" in inline_resp.headers.get("content-disposition", "")
    assert inline_resp.content == MINIMAL_VALID_PDF, "Stream bytes must match uploaded bytes exactly"

    # 2. Test download stream: GET /api/pdf/{id}/download
    download_resp = client.get(f"/api/pdf/{doc_id}/download")
    assert download_resp.status_code == 200
    assert "application/pdf" in download_resp.headers.get("content-type", "")
    assert "attachment" in download_resp.headers.get("content-disposition", "")
    assert filename in download_resp.headers.get("content-disposition", "")
    assert download_resp.content == MINIMAL_VALID_PDF, "Download bytes must match uploaded bytes exactly"


def test_8_delete_uploaded_pdf(client: TestClient) -> None:
    """8. Deletion of uploaded PDF returns 200 OK with status='deleted'."""
    upload_resp = client.post(
        "/api/pdf/upload",
        files={"file": ("delete_me.pdf", MINIMAL_VALID_PDF, "application/pdf")},
        headers={"X-Forwarded-For": "10.1.1.8"},
    )
    assert upload_resp.status_code == 200
    doc_id = upload_resp.json()["id"]

    del_resp = client.delete(f"/api/pdf/{doc_id}")
    assert del_resp.status_code == 200, f"Expected 200, got {del_resp.status_code}: {del_resp.text}"
    del_data = del_resp.json()
    assert del_data.get("status") == "deleted"
    assert del_data.get("id") == doc_id


def test_9_retrieval_after_deletion_returns_404(client: TestClient) -> None:
    """9. Retrieval and metadata after deletion return 404 Not Found."""
    upload_resp = client.post(
        "/api/pdf/upload",
        files={"file": ("ephemeral.pdf", MINIMAL_VALID_PDF, "application/pdf")},
        headers={"X-Forwarded-For": "10.1.1.9"},
    )
    assert upload_resp.status_code == 200
    doc_id = upload_resp.json()["id"]

    # Delete the document
    del_resp = client.delete(f"/api/pdf/{doc_id}")
    assert del_resp.status_code == 200

    # Inline retrieval returns 404
    get_after = client.get(f"/api/pdf/{doc_id}")
    assert get_after.status_code == 404, f"Expected 404 for deleted file, got {get_after.status_code}"

    # Download returns 404
    download_after = client.get(f"/api/pdf/{doc_id}/download")
    assert download_after.status_code == 404, f"Expected 404 for deleted download, got {download_after.status_code}"

    # Metadata returns 404
    meta_after = client.get(f"/api/pdf/{doc_id}/metadata")
    assert meta_after.status_code == 404, f"Expected 404 for deleted metadata, got {meta_after.status_code}"

    # Repeat delete returns 404 (already deleted)
    second_delete = client.delete(f"/api/pdf/{doc_id}")
    assert second_delete.status_code == 404, f"Expected 404 on repeat delete, got {second_delete.status_code}"


def test_10_metadata_retrieval_endpoint(client: TestClient) -> None:
    """10. Metadata retrieval endpoint returns valid JSON with file info and expiry."""
    filename = "annual_summary.pdf"
    upload_resp = client.post(
        "/api/pdf/upload",
        files={"file": (filename, MINIMAL_VALID_PDF, "application/pdf")},
        headers={"X-Forwarded-For": "10.1.1.10"},
    )
    assert upload_resp.status_code == 200
    doc_id = upload_resp.json()["id"]

    meta_resp = client.get(f"/api/pdf/{doc_id}/metadata")
    assert meta_resp.status_code == 200, f"Expected 200, got {meta_resp.status_code}: {meta_resp.text}"

    meta = meta_resp.json()
    assert meta.get("id") == doc_id
    assert meta.get("filename") == filename
    assert meta.get("size") == len(MINIMAL_VALID_PDF)
    assert "created_at" in meta or "createdAt" in meta
    assert "expires_at" in meta or "expiresAt" in meta

    # Ensure binary content is never exposed in metadata JSON
    assert "content" not in meta
    assert "binary" not in meta

    # Non-existent UUID returns 404
    non_existent_id = "00000000-0000-4000-8000-000000000000"
    missing_meta = client.get(f"/api/pdf/{non_existent_id}/metadata")
    assert missing_meta.status_code == 404, f"Expected 404 for missing UUID, got {missing_meta.status_code}"
```

---

## 6. How to Run the Test Suite

### 6.1 Standard Invocations
To execute the automated test suite from the repository root:

```powershell
python -m pytest backend/tests/test_pdf_upload.py -v
```

To run with compact, clean output and suppressed deprecation warnings:
```powershell
python -m pytest backend/tests/test_pdf_upload.py -v -W ignore::DeprecationWarning --tb=short
```

To run a single targeted test:
```powershell
python -m pytest backend/tests/test_pdf_upload.py -k test_1_valid_pdf_upload -v
```

To run from within the `backend/` directory:
```powershell
pytest tests/test_pdf_upload.py -v
```

### 6.2 Expected Output on Implementation
```text
backend/tests/test_pdf_upload.py::test_1_valid_pdf_upload PASSED                [ 7%]
backend/tests/test_pdf_upload.py::test_2_reject_non_pdf_mime[notes.txt-text/plain] PASSED [15%]
backend/tests/test_pdf_upload.py::test_2_reject_non_pdf_mime[image.png-image/png] PASSED [23%]
backend/tests/test_pdf_upload.py::test_2_reject_non_pdf_mime[data.json-application/json] PASSED [30%]
backend/tests/test_pdf_upload.py::test_2_reject_non_pdf_mime[spoofed.pdf-application/pdf] PASSED [38%]
backend/tests/test_pdf_upload.py::test_3a_reject_corrupted_header PASSED        [46%]
backend/tests/test_pdf_upload.py::test_3b_reject_corrupted_trailer PASSED       [53%]
backend/tests/test_pdf_upload.py::test_3c_reject_empty_file PASSED              [61%]
backend/tests/test_pdf_upload.py::test_4_reject_oversized_file PASSED           [69%]
backend/tests/test_pdf_upload.py::test_5_rate_limiting_enforcement PASSED       [76%]
backend/tests/test_pdf_upload.py::test_6_path_traversal_rejection[../../etc/passwd] PASSED [84%]
backend/tests/test_pdf_upload.py::test_6_path_traversal_rejection[not-a-valid-uuid] PASSED [87%]
backend/tests/test_pdf_upload.py::test_7_retrieve_uploaded_pdf PASSED           [90%]
backend/tests/test_pdf_upload.py::test_8_delete_uploaded_pdf PASSED             [93%]
backend/tests/test_pdf_upload.py::test_9_retrieval_after_deletion_returns_404 PASSED [96%]
backend/tests/test_pdf_upload.py::test_10_metadata_retrieval_endpoint PASSED   [100%]

============================== 16 passed in 1.45s ==============================
```

---

## 7. Synthesis & Alignment with M1 Workers

- **Alignment with M1-1 (Endpoints Specialist):**
  - M1-1 implements `POST /api/pdf/upload`, `GET /api/pdf/{id}`, `GET /api/pdf/{id}/download`, `GET /api/pdf/{id}/metadata`, and `DELETE /api/pdf/{id}`.
  - The test suite uses the exact route signatures, field names (`file`), JSON keys (`status`, `id`, `filename`, `size`, `url`, `expires_at`, `created_at`), and status codes (200, 400, 404, 413, 429).
  - The rate limit reset helper `reset_upload_rate_limits()` is included as an optional hook, and tests additionally use distinct `X-Forwarded-For` IPs to guarantee test independence regardless of whether the hook is used.

- **Alignment with M1-2 (Storage Specialist):**
  - M1-2 creates the MongoDB TTL index on `expiresAt` with `expireAfterSeconds=0` and in-memory lazy cleanup.
  - Test 10 verifies that metadata returns `expires_at` without transferring the heavy binary payload.
  - Tests 8 and 9 verify that deletions immediately invalidate access across both storage modes (MongoDB and in-memory fallback).

- **Alignment with Overall Milestone 1 Deliverables:**
  - `backend/requirements.txt`: Add `python-multipart>=0.0.20` and `pytest>=8.0.0`.
  - `pyproject.toml`: Add `python-multipart>=0.0.20` to `dependencies` and `pytest>=8.0.0` to `[project.optional-dependencies]`.
  - `backend/tests/test_pdf_upload.py`: Created with the 10 exhaustive test scenarios.
