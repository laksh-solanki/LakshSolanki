# Orchestrator Dispatch Log

## 2026-11-04T10:48:15Z
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
