# Project: PDF to QR Code Generator in PdfImageStudio

## Architecture
- **Frontend**: Vue 3.5 SPA bundled with Vite 8, Vuetify 4.1, Vue Router 5.1, `pdfjs-dist` 5.7, and `qrcode` 1.5. Responsive layout based on portfolio design tokens in `main.css`.
- **Backend**: Python 3.14 FastAPI 0.115 service (`backend/app/main.py`), running locally on port 5001 and deployable to Vercel serverless functions.
- **Storage**: Dual-mode repository (`backend/app/repositories.py`) persisting PDF files as `bson.Binary` in MongoDB collection `pdf_uploads` (database `LakshSolanki`) with transparent in-memory fallback.
- **Security**: Binary magic-bytes validation (`b"%PDF-"`, `b"%%EOF"`), 10 MB file size limit, client-IP sliding-window rate limiting (10 uploads/min), UUID4 cryptographic identifiers, and path traversal defense.
- **Lifecycle & Retention**: Automatic 24-hour cleanup policy via MongoDB native TTL index on `expiresAt` and in-memory lazy eviction.
- **QR Engine**: Pure JavaScript `qrcode` with error correction level `H` (30% error recovery), customizable foreground/background colors, size controls, protective center logo badge, real-time WCAG 2.1 contrast evaluation, and PNG/SVG export downloads.
- **Public Landing Page**: Ultra-compact route `/v/:id` rendering responsive canvas-based PDF preview via `pdfjs-dist`, download action button, and graceful error cards for missing/expired/deleted documents.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Client-Side PDF Validation | Validate PDF MIME type and size limit in upload dropzone | M3 | survey |
| 2 | Backend Multipart Upload API | `POST /api/pdf/upload` accepting multipart file stream | M1 | survey |
| 3 | Binary Magic Byte Validation | Verify `%PDF-` header and `%%EOF` trailer markers in binary content | M1 | survey |
| 4 | File Size Limit Enforcement | Reject files >10 MB with HTTP 413 error | M1 | survey |
| 5 | Upload Rate Limiting | Enforce sliding-window rate limit (10 uploads/min per IP) returning HTTP 429 | M1 | survey |
| 6 | Cryptographic Identifier Generation | Generate unpredictable UUID4 document IDs via `generate_id()` | M1 | survey |
| 7 | Path Traversal Defense | Validate document IDs strictly against UUID4 pattern, preventing directory traversal | M1 | survey |
| 8 | Dual-Mode Binary Storage | Store PDF binaries in MongoDB `pdf_uploads` collection with memory fallback | M1 | survey |
| 9 | Automated 24h Retention Cleanup | MongoDB TTL index on `expiresAt` with 24-hour retention and memory lazy eviction | M1 | survey |
| 10 | Backend Binary & Metadata APIs | `GET /api/pdf/{id}`, `GET /api/pdf/{id}/file`, `GET /api/pdf/{id}/metadata` | M1 | survey |
| 11 | Backend Document Deletion API | `DELETE /api/pdf/{id}` for immediate file removal and invalidation | M1 | survey |
| 12 | Public Landing Route Setup | Register `/v/:id` in `router/index.js` and `create-spa-route-pages.mjs` | M2 | survey |
| 13 | Responsive Public PDF Viewer | Canvas-based PDF rendering via `pdfjs-dist` on public landing page | M2 | survey |
| 14 | Public PDF Download Action | Download button streaming original PDF with correct filename and headers | M2 | survey |
| 15 | Missing/Expired/Deleted UI | Graceful status card matching `NotFoundPage.vue` styling for missing documents | M2 | survey |
| 16 | Instant Scannable QR Generation | Encode public URL `/v/{id}` instantly into QR code using `qrcode` | M3 | survey |
| 17 | QR Color Customization | Real-time customization of foreground and background colors | M3 | survey |
| 18 | QR Size Adjustments | Slider/input controls for adjusting QR display and export dimensions | M3 | survey |
| 19 | Center Logo Embedding | Optional center logo with white protective circular badge and level 'H' error correction | M3 | survey |
| 20 | Real-Time Contrast Checker | WCAG 2.1 relative luminance contrast calculation with scannability warnings | M3 | survey |
| 21 | Reset-to-Default Controls | Single-click action restoring default QR styling options | M3 | survey |
| 22 | Multi-Format QR Export | Download QR code in standard PNG, high-resolution PNG, and vector SVG formats | M3 | survey |
| 23 | File & QR Metadata Display | Display file name, size, upload status, and QR status | M3 | survey |
| 24 | In-Tool PDF Preview Thumbnail | Render Page 1 thumbnail in studio workspace using `pdfjs-dist` | M3 | survey |
| 25 | Working Copy Link Action | Clipboard copy button with visual confirmation feedback | M3 | survey |
| 26 | Working Delete Action | Delete button with confirmation, removing file from backend and invalidating QR | M3 | survey |
| 27 | Studio Mode Integration | Integrate `pdf-to-qr` in `PdfImageStudio.vue`, `ImgPdfPage.vue`, `PdfImgPage.vue` | M3 | survey |
| 28 | Responsive UI & Alert States | 2-column responsive layout with upload progress and error alerts | M3 | survey |
| 29 | E2E Testing Suite (Tiers 1-4) | Comprehensive test suite for valid/invalid uploads, security, QR decoding, deletion | M4 | survey |
| 30 | Phase 2 Adversarial Hardening | Tier 5 white-box coverage hardening with stress testing | M4 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend APIs & Secure Storage | Upload endpoint, binary validation, rate limiting, MongoDB/memory storage, 24h retention, deletion API, and backend unit tests | none | DONE |
| M2 | Public Landing Page & Viewer | Route `/v/:id`, `PdfLandingPage.vue` canvas PDF viewer, download button, expired/deleted status card, and SPA script integration | M1 | DONE |
| M3 | Studio UI & QR Customizer | `PdfQrPage.vue`, QR generation engine, contrast checker, center logo, PNG/SVG export, metadata, copy link, delete, and mode switching in `PdfImageStudio.vue` | M1, M2 | DONE |
| M4 | Final E2E Test Pass & Hardening | Pass 100% of E2E test suite (Tiers 1-4) followed by Phase 2 adversarial coverage hardening (Tier 5) | M1, M2, M3 | DONE |

## Interface Contracts
### Frontend ↔ Backend API
- **Base URL**: `http://localhost:5001` (dev) / `https://lakshsolanki-backend.vercel.app` (prod) via `getApiBaseUrl()`.
- **Upload Endpoint**:
  - `POST /api/pdf/upload`
  - Request: `multipart/form-data` with field `file`.
  - Responses:
    - `200 OK`: `{"status": "success", "id": "<uuid4>", "filename": "doc.pdf", "size": 12345, "url": "/v/<uuid4>", "expires_at": "ISO8601"}`
    - `400 Bad Request`: `{"detail": "Invalid PDF format or corrupted file."}`
    - `413 Payload Too Large`: `{"detail": "File size exceeds 10 MB limit."}`
    - `429 Too Many Requests`: `{"detail": "Upload rate limit exceeded. Please wait a minute."}`
- **Metadata Endpoint**:
  - `GET /api/pdf/{id}/metadata`
  - Response:
    - `200 OK`: `{"id": "<uuid4>", "filename": "doc.pdf", "size": 12345, "created_at": "ISO8601", "expires_at": "ISO8601"}`
    - `404 Not Found`: `{"detail": "Document not found or expired."}`
- **File Retrieval & Download Endpoints**:
  - `GET /api/pdf/{id}`: Streams binary with `Content-Type: application/pdf`, `Content-Disposition: inline; filename="doc.pdf"`.
  - `GET /api/pdf/{id}/download`: Streams binary with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="doc.pdf"`.
  - Both return `404 Not Found` if document is missing, expired, or deleted.
- **Deletion Endpoint**:
  - `DELETE /api/pdf/{id}`
  - Response:
    - `200 OK`: `{"status": "deleted", "id": "<uuid4>"}`
    - `404 Not Found`: `{"detail": "Document not found or already deleted."}`

### Studio ↔ Public Landing Page Contract
- Document ID: 36-character UUIDv4 string (e.g., `123e4567-e89b-12d3-a456-426614174000`).
- Public URL: `${window.location.origin}/v/${id}`.

## Code Layout
- Exclusive file ownership per milestone:
  - **M1 Worker owns**: `backend/app/main.py`, `backend/app/repositories.py`, `backend/app/database.py`, `backend/requirements.txt`, `backend/pyproject.toml`, `backend/tests/test_pdf_upload.py`.
  - **M2 Worker owns**: `frontend/src/pages/PdfLandingPage.vue`, `frontend/src/router/index.js`, `frontend/scripts/create-spa-route-pages.mjs`.
  - **M3 Worker owns**: `frontend/src/pages/Projects/PdfQrPage.vue`, `frontend/src/pages/Projects/PdfImageStudio.vue`, `frontend/src/pages/Projects/ImgPdfPage.vue`, `frontend/src/pages/Projects/PdfImgPage.vue`, `frontend/src/plugins/icons.js`, `frontend/src/utils/qrContrast.js`, `frontend/package.json`.
  - **E2E Testing Track owns**: `frontend/scripts/test-pdf-qr.mjs`, `frontend/scripts/test-e2e-suite.mjs`, `TEST_INFRA.md`, `TEST_READY.md`.
