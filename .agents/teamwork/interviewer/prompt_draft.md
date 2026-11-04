Add a fully functional, production-ready PDF to QR Code Generator tool to the existing online tools website within the `pdfimagestudio` workspace. The tool allows users to upload PDFs, generate scannable QR codes linking to a dedicated public preview/download page, customize QR appearance, manage uploaded files, and safely handle storage retention and access.

Integrity mode: development

## Requirements

### R1. PDF Upload, Secure Storage, and Public Link Generation
Inspect the existing project architecture, storage, and backend APIs to integrate secure PDF upload functionality. Users can upload PDF documents via drag-and-drop or file selection. Validate file type (PDF MIME type), file size limits, and PDF integrity on both client and server before accepting the upload. Store the file securely using unpredictable identifiers, prevent path traversal or credential exposure, and generate a unique public URL pointing to a dedicated landing page on the website that previews the PDF and provides a download action. Handle expired, deleted, or missing PDFs gracefully. Only implement password protection and expiry dates if already supported by the existing backend/database architecture.

### R2. Scannable QR Code Generation and Customization
Generate a scannable QR code immediately upon successful upload that encodes the public PDF URL. Provide real-time customization options: foreground and background colors, size adjustments, optional center logo, and export downloads in PNG, SVG, and high-resolution formats. Ensure contrast and scanning reliability remain intact, and provide a reset-to-default control.

### R3. File and Link Management with Retention
Provide full file lifecycle controls: display metadata (file name, file size, upload and QR status), copy public sharing URL to clipboard, and allow the user to delete uploaded PDFs and invalidate associated QR links. Implement rate limiting on upload/generation endpoints and apply a clear retention and cleanup policy so files are not retained permanently without reason.

### R4. UI/UX Integration within PdfImageStudio
Add the PDF to QR Code Generator as an integrated tool mode within `pdfimagestudio` (`PdfImageStudio.vue`), reusing the existing design system, component patterns, and styling conventions without modifying unrelated pages. The interface must include a drag-and-drop upload zone, PDF preview section, QR preview and customization panel, action buttons (download QR, copy link, delete), loading and progress states, and error alerts. The layout must be responsive across mobile, tablet, and desktop viewports.

### R5. Verification and Automated Testing
Write and execute automated test scripts and verification routines with synthesized valid, invalid (non-PDF, corrupted), and oversized PDF fixtures. Verify upload integrity, public page resolution, QR code generation and scannability, deletion/invalidation, and error handling. Deliver a concise final report summarizing files changed, dependencies added, backend and storage configuration, and tests executed.

## Acceptance Criteria

### Upload and Security
- [ ] Upload accepts valid PDF files via drag-and-drop and file selection dialog.
- [ ] Non-PDF MIME types, corrupted files, and files exceeding size limits are rejected with clear user-facing error messages on both frontend and backend.
- [ ] Uploaded PDFs receive cryptographically secure, unpredictable identifiers without exposing server filesystem paths or storage credentials.
- [ ] Path traversal attempts and unauthorized file access requests return appropriate HTTP 4xx errors.
- [ ] A file retention or cleanup policy is implemented so files are not stored indefinitely without lifecycle management.

### QR Code and Public Landing Page
- [ ] A QR code is generated instantly upon successful upload and encodes the public URL.
- [ ] The public URL opens a dedicated web page on the site that previews the PDF and allows downloading the original file.
- [ ] QR code scans reliably and decodes to the exact public URL.
- [ ] QR customization controls (foreground color, background color, size, optional center logo) update the displayed QR code and preserve scannability.
- [ ] QR code can be downloaded in PNG and SVG formats, and settings can be restored using a reset-to-default action.

### File Management and UI Integration
- [ ] Tool is accessible as a mode in `PdfImageStudio.vue` with tab/mode navigation matching existing studio tools.
- [ ] Interface displays file metadata (name, size, upload status, QR status), in-tool PDF preview, and working Copy Link button.
- [ ] User can delete the uploaded PDF, which immediately deletes the file from storage and causes subsequent access to the public link to return a graceful not-found/unavailable state.
- [ ] All UI states (uploading, error, success, loading) display consistent indicators, and layouts adapt cleanly on mobile, tablet, and desktop screens without altering unrelated pages.

### Testing and Verification
- [ ] Automated tests run successfully covering: valid upload, rejection of invalid/oversized files, deletion, and public link resolution.
- [ ] QR code generation and decoding is programmatically verified using automated test fixtures.
- [ ] Implementation report is provided documenting modified files, dependencies, storage setup, and test verification results.
