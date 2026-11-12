from __future__ import annotations

from collections import defaultdict, deque
from contextlib import asynccontextmanager
import re
import threading
import time
from typing import Any, Literal
import uuid

import httpx
from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, Request, Response, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.gzip import GZipMiddleware

from .auth import AuthError, AuthUser, FirebaseTokenVerifier
from .config import settings
from .database import DatabaseManager
from .repositories import Repositories, RepositoryError
from .utils import is_valid_email, normalize_email, now_iso


REQUEST_TIMEOUT_SECONDS = 80
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
STARTED_AT = time.monotonic()


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CourseCreate(StrictModel):
    name: str = Field(min_length=2, max_length=140)
    category: str | None = Field(default=None, max_length=80)
    level: str | None = Field(default=None, max_length=40)
    durationHours: float | None = Field(default=None, ge=1, le=1000)
    tags: list[str] = Field(default_factory=list, max_length=20)


class MediaCreate(StrictModel):
    name: str | None = Field(default="", max_length=140)
    url: str = Field(min_length=3, max_length=2048)
    type: str | None = Field(default="generic", max_length=40)
    alt: str | None = Field(default="", max_length=300)
    tags: list[str] = Field(default_factory=list, max_length=30)


class SubscriptionPayload(StrictModel):
    email: str = Field(max_length=320)
    name: str | None = Field(default="", max_length=120)
    source: str | None = Field(default="website", max_length=64)


class EmailPayload(StrictModel):
    email: str = Field(max_length=320)


class TtsSnippetCreate(StrictModel):
    ownerKey: str = Field(min_length=8, max_length=120)
    title: str | None = Field(default="", max_length=120)
    content: str = Field(min_length=1, max_length=12000)


class ChatMessage(StrictModel):
    role: Literal["user", "assistant"]
    text: str = Field(max_length=12000)


class ChatPayload(StrictModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=80)
    provider: Literal["auto", "gemini", "groq", "openai"] | None = None
    model: str | None = Field(default=None, max_length=200)
    systemPrompt: str | None = Field(default=None, max_length=4000)
    temperature: float | None = Field(default=None, ge=0, le=2)
    maxOutputTokens: int | None = Field(default=None, ge=1, le=8192)


class HistoryMessage(StrictModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=12000)
    createdAt: str | None = Field(default=None, max_length=64)


class HistoryUpsert(StrictModel):
    title: str | None = Field(default="", max_length=120)
    messages: list[HistoryMessage] = Field(min_length=1, max_length=80)


db_manager = DatabaseManager(settings)
repositories = Repositories(db_manager.ensure_connected)
token_verifier = FirebaseTokenVerifier(
    project_id=settings.firebase_project_id,
    jwks_url=settings.firebase_jwks_url,
    test_mode=settings.firebase_auth_test_mode,
)
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    db_manager.close()


app = FastAPI(
    title="LakshSolanki Backend",
    version="2.0.0",
    description="Python backend for the main site API.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Admin-Key", "Accept", "Range"],
    expose_headers=["Content-Disposition", "Content-Length", "Retry-After"],
)
app.add_middleware(GZipMiddleware, minimum_size=1024)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    if settings.enable_security_headers:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.node_env == "production":
            response.headers["Strict-Transport-Security"] = "max-age=15552000; includeSubDomains"
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else {}
    message = first.get("msg") or "Invalid request payload."
    return JSONResponse(status_code=400, content={"error": message})


def uptime_seconds() -> float:
    return round(time.monotonic() - STARTED_AT, 1)


def get_authenticated_user(authorization: str | None = Header(default=None)) -> AuthUser:
    try:
        return token_verifier.verify_authorization_header(authorization)
    except AuthError as exc:
        if exc.status_code == 503:
            raise HTTPException(status_code=503, detail="Firebase auth is not configured on this backend.") from exc
        raise HTTPException(status_code=401, detail={"error": "Unauthorized", "details": str(exc)}) from exc


def _auth_error_response(exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        return JSONResponse(status_code=exc.status_code, content=detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(detail)})


def _repository_error_response(exc: RepositoryError) -> JSONResponse:
    payload: dict[str, Any] = {"error": str(exc)}
    if exc.data_key and exc.data is not None:
        payload[exc.data_key] = exc.data
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.exception_handler(RepositoryError)
async def repository_error_handler(_: Request, exc: RepositoryError) -> JSONResponse:
    return _repository_error_response(exc)


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "status": "Backend working",
        "time": now_iso(),
        "uptimeSeconds": uptime_seconds(),
        "mode": db_manager.status.mode,
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "timestamp": now_iso(),
        "uptimeSeconds": uptime_seconds(),
    }


@app.get("/ready")
def ready() -> JSONResponse:
    if settings.mongodb_uri:
        db_manager.ensure_connected()
    is_ready = not settings.mongodb_uri or db_manager.status.connected
    return JSONResponse(
        status_code=200 if is_ready else 503,
        content={
            "status": "ready" if is_ready else "not_ready",
            "timestamp": now_iso(),
            "database": db_manager.status.to_dict(),
        },
    )


@app.get("/api/courses")
@app.get("/api/projects/certificate-gen")
def list_courses(
    search: str = Query(default="", max_length=120),
    limit: int = Query(default=50, ge=1, le=100),
    sort: Literal["asc", "desc"] = Query(default="asc"),
) -> JSONResponse:
    courses = repositories.list_courses(search=search, limit=limit, sort=sort)
    return JSONResponse(
        content={"count": len(courses), "data": courses},
        headers={"Cache-Control": "public, max-age=120, stale-while-revalidate=300"},
    )


@app.post("/api/courses")
def create_course(payload: CourseCreate) -> JSONResponse:
    try:
        created = repositories.add_course(payload.model_dump())
    except RepositoryError as exc:
        return _repository_error_response(exc)
    return JSONResponse(status_code=201, content={"message": "Course created successfully", "data": created})


@app.get("/api/media")
def list_media(
    type: str = Query(default="", max_length=40),
    limit: int = Query(default=50, ge=1, le=100),
    sort: Literal["asc", "desc"] = Query(default="desc"),
) -> JSONResponse:
    media = repositories.list_media(media_type=type, limit=limit, sort=sort)
    return JSONResponse(
        content={"count": len(media), "data": media},
        headers={"Cache-Control": "public, max-age=120, stale-while-revalidate=300"},
    )


@app.post("/api/media")
def create_media(payload: MediaCreate) -> JSONResponse:
    try:
        created = repositories.add_media(payload.model_dump())
    except RepositoryError as exc:
        return _repository_error_response(exc)
    return JSONResponse(status_code=201, content={"message": "Media created successfully", "data": created})


@app.get("/api/tts/snippets")
def list_tts_snippets(
    ownerKey: str = Query(min_length=8, max_length=120),
    limit: int = Query(default=6, ge=1, le=20),
) -> JSONResponse:
    snippets = repositories.list_tts_snippets(owner_key=ownerKey, limit=limit)
    return JSONResponse(content={"count": len(snippets), "data": snippets}, headers={"Cache-Control": "no-store"})


@app.post("/api/tts/snippets")
def create_tts_snippet(payload: TtsSnippetCreate) -> JSONResponse:
    try:
        created = repositories.add_tts_snippet(payload.model_dump())
    except RepositoryError as exc:
        return _repository_error_response(exc)
    return JSONResponse(status_code=201, content={"message": "Snippet saved successfully", "data": created})


@app.delete("/api/tts/snippets/{snippet_id}")
def delete_tts_snippet(
    snippet_id: str,
    ownerKey: str = Query(min_length=8, max_length=120),
) -> JSONResponse:
    clean_id = snippet_id.strip()
    if not 6 <= len(clean_id) <= 120:
        return JSONResponse(status_code=400, content={"error": "Invalid request payload."})
    removed = repositories.remove_tts_snippet(owner_key=ownerKey, snippet_id=clean_id)
    if not removed:
        return JSONResponse(status_code=404, content={"error": "Snippet not found"})
    return JSONResponse(content={"message": "Snippet removed successfully"})


@app.post("/api/subscribe")
def subscribe(payload: SubscriptionPayload, request: Request) -> JSONResponse:
    if not is_valid_email(payload.email):
        return JSONResponse(status_code=400, content={"error": "Email is invalid"})
    result = repositories.subscribe(
        email=normalize_email(payload.email),
        name=payload.name or "",
        source=payload.source or "website",
        ip=request.client.host if request.client else "",
        user_agent=request.headers.get("user-agent", ""),
    )
    if result["status"] == "already_subscribed":
        return JSONResponse(status_code=409, content={"error": "Email already subscribed"})
    if result["status"] == "reactivated":
        return JSONResponse(
            content={"message": "Subscription restored successfully", "id": result["subscription"].get("id")},
        )
    return JSONResponse(
        status_code=201,
        content={"message": "Subscribed successfully", "id": result["subscription"].get("id")},
    )


@app.get("/api/subscribe/status")
def subscription_status(email: str = Query(max_length=320)) -> dict[str, Any]:
    if not is_valid_email(email):
        return {"subscribed": False, "status": "invalid_email"}
    result = repositories.get_subscription_status(email=email)
    return {
        "email": normalize_email(email),
        "subscribed": result["subscribed"],
        "status": result["status"],
        "details": result["subscription"],
    }


@app.delete("/api/subscribe")
def unsubscribe(payload: EmailPayload) -> JSONResponse:
    if not is_valid_email(payload.email):
        return JSONResponse(status_code=400, content={"error": "Email is invalid"})
    result = repositories.unsubscribe(email=payload.email)
    if result["status"] == "not_found":
        return JSONResponse(status_code=404, content={"error": "Subscription not found"})
    if result["status"] == "already_unsubscribed":
        return JSONResponse(content={"message": "Already unsubscribed"})
    return JSONResponse(content={"message": "Unsubscribed successfully"})


def _sanitize_chat_messages(messages: list[ChatMessage]) -> list[dict[str, str]]:
    return [
        {"role": "assistant" if message.role == "assistant" else "user", "text": message.text.strip()}
        for message in messages
        if message.text.strip()
    ]


def _resolve_chat_provider(requested_provider: str | None) -> str:
    requested = (requested_provider or "").strip().lower()
    if requested in {"gemini", "groq", "openai"}:
        if requested == "gemini":
            return "gemini" if settings.gemini_api_key else ""
        if requested == "groq":
            return "groq" if settings.groq_api_key else ""
        if requested == "openai":
            return "openai" if settings.openai_api_key else ""

    default_p = (settings.ai_default_provider or "").strip().lower()
    if default_p == "gemini" and settings.gemini_api_key:
        return "gemini"
    if default_p == "groq" and settings.groq_api_key:
        return "groq"
    if default_p == "openai" and settings.openai_api_key:
        return "openai"

    if settings.gemini_api_key:
        return "gemini"
    if settings.groq_api_key:
        return "groq"
    if settings.openai_api_key:
        return "openai"
    return ""


def _extract_ai_text(provider: str, payload: dict[str, Any]) -> str:
    if provider == "gemini":
        candidates = payload.get("candidates") or []
        if not candidates:
            feedback = payload.get("promptFeedback") or {}
            block_reason = feedback.get("blockReason")
            if block_reason:
                return f"Content blocked by safety filter: {block_reason}"
            return ""
        candidate = candidates[0] or {}
        content_obj = candidate.get("content") or {}
        parts = content_obj.get("parts") or []
        return "".join(str(part.get("text", "")) for part in parts).strip()

    choices = payload.get("choices") or []
    if not choices:
        return ""
    message = choices[0].get("message") or {}
    content = message.get("content", "")
    if isinstance(content, str) and content.strip():
        return content.strip()
    if isinstance(content, list):
        text = "".join(str(part.get("text", "")) for part in content).strip()
        if text:
            return text
    reasoning = message.get("reasoning_content") or message.get("reasoning") or ""
    if isinstance(reasoning, str) and reasoning.strip():
        return reasoning.strip()
    return ""


async def _read_upstream_error(response: httpx.Response) -> str:
    try:
        payload = response.json()
        message = payload.get("error", {}).get("message") if isinstance(payload.get("error"), dict) else payload.get("error")
        message = message or payload.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()
    except Exception:  # noqa: BLE001
        pass
    text = response.text.strip()
    return text[:500] if text else f"Upstream AI API failed ({response.status_code})."


@app.post("/api/ai/chat")
async def ai_chat(payload: ChatPayload) -> JSONResponse:
    messages = _sanitize_chat_messages(payload.messages)
    if not messages:
        return JSONResponse(status_code=400, content={"error": "At least one non-empty message is required."})

    requested_provider = (payload.provider or "").strip().lower()
    if requested_provider == "gemini" and not settings.gemini_api_key:
        return JSONResponse(status_code=503, content={"error": "Gemini is not configured on the backend."})
    if requested_provider == "groq" and not settings.groq_api_key:
        return JSONResponse(status_code=503, content={"error": "Groq is not configured on the backend."})
    if requested_provider == "openai" and not settings.openai_api_key:
        return JSONResponse(status_code=503, content={"error": "OpenAI is not configured on the backend."})

    provider = _resolve_chat_provider(requested_provider or "auto")
    if not provider:
        return JSONResponse(
            status_code=503,
            content={
                "error": "No AI text provider is configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in backend .env."
            },
        )

    model = (
        (payload.model.strip() if payload.model else "")
        or (settings.gemini_chat_model if provider == "gemini" else settings.groq_chat_model if provider == "groq" else settings.openai_chat_model)
        or ""
    ).strip()
    if not model:
        return JSONResponse(status_code=500, content={"error": "AI model is not configured on the backend."})

    system_prompt = (payload.systemPrompt or settings.ai_system_prompt or "").strip()
    temperature = payload.temperature if payload.temperature is not None else settings.ai_temperature
    max_output_tokens = payload.maxOutputTokens or settings.ai_max_output_tokens

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            if provider == "gemini":
                gemini_contents: list[dict[str, Any]] = []
                for item in messages:
                    role = "model" if item["role"] == "assistant" else "user"
                    if gemini_contents and gemini_contents[-1]["role"] == role:
                        gemini_contents[-1]["parts"].append({"text": item["text"]})
                    else:
                        gemini_contents.append({"role": role, "parts": [{"text": item["text"]}]})

                while gemini_contents and gemini_contents[0]["role"] == "model":
                    gemini_contents.pop(0)

                if not gemini_contents:
                    return JSONResponse(status_code=400, content={"error": "At least one user message is required."})

                body: dict[str, Any] = {
                    "contents": gemini_contents,
                    "generationConfig": {"temperature": temperature, "maxOutputTokens": max_output_tokens},
                }
                if system_prompt:
                    body["systemInstruction"] = {"parts": [{"text": system_prompt}]}
                response = await client.post(
                    f"{GEMINI_API_BASE}/{model}:generateContent",
                    params={"key": settings.gemini_api_key},
                    json=body,
                )
            else:
                api_base = settings.groq_api_base if provider == "groq" else settings.openai_base_url
                api_key = settings.groq_api_key if provider == "groq" else settings.openai_api_key
                response = await client.post(
                    f"{api_base}/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "model": model,
                        "messages": ([{"role": "system", "content": system_prompt}] if system_prompt else [])
                        + [{"role": item["role"], "content": item["text"]} for item in messages],
                        "temperature": temperature,
                        "max_tokens": max_output_tokens,
                        "stream": False,
                    },
                )
    except httpx.TimeoutException:
        return JSONResponse(status_code=504, content={"error": "AI text request timed out."})
    except httpx.HTTPError as exc:
        return JSONResponse(status_code=502, content={"error": f"Unable to reach {provider} API: {exc}"})

    if response.status_code >= 400:
        return JSONResponse(status_code=502, content={"error": await _read_upstream_error(response)})

    upstream_payload = response.json()
    text = _extract_ai_text(provider, upstream_payload)
    if not text:
        return JSONResponse(status_code=502, content={"error": f"{provider} returned an empty response."})
    return JSONResponse(content={"provider": provider, "model": model, "text": text})


def _conversation_id_is_valid(value: str) -> bool:
    return bool(re.fullmatch(r".{6,120}", value.strip()))


@app.get("/api/ai/history")
def list_ai_history(
    limit: int = Query(default=30, ge=1, le=50),
    user: AuthUser = Depends(get_authenticated_user),
) -> JSONResponse:
    items = repositories.list_ai_conversations(owner_uid=user.uid, limit=limit)
    return JSONResponse(content={"count": len(items), "data": items}, headers={"Cache-Control": "no-store"})


@app.get("/api/ai/history/{conversation_id}")
def get_ai_history(
    conversation_id: str,
    user: AuthUser = Depends(get_authenticated_user),
) -> JSONResponse:
    if not _conversation_id_is_valid(conversation_id):
        return JSONResponse(status_code=400, content={"error": "Conversation id is invalid"})
    conversation = repositories.get_ai_conversation(owner_uid=user.uid, conversation_id=conversation_id)
    if conversation is None:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})
    return JSONResponse(content={"data": conversation}, headers={"Cache-Control": "no-store"})


@app.put("/api/ai/history/{conversation_id}")
def put_ai_history(
    conversation_id: str,
    payload: HistoryUpsert,
    user: AuthUser = Depends(get_authenticated_user),
) -> JSONResponse:
    if not _conversation_id_is_valid(conversation_id):
        return JSONResponse(status_code=400, content={"error": "Conversation id is invalid"})
    saved = repositories.upsert_ai_conversation(
        owner_uid=user.uid,
        owner_email=user.email,
        owner_name=user.name,
        conversation_id=conversation_id,
        title=payload.title or "",
        messages=[message.model_dump() for message in payload.messages],
    )
    return JSONResponse(content={"message": "Conversation saved successfully", "data": saved})


@app.delete("/api/ai/history/{conversation_id}")
def delete_ai_history(
    conversation_id: str,
    user: AuthUser = Depends(get_authenticated_user),
) -> JSONResponse:
    if not _conversation_id_is_valid(conversation_id):
        return JSONResponse(status_code=400, content={"error": "Conversation id is invalid"})
    removed = repositories.remove_ai_conversation(owner_uid=user.uid, conversation_id=conversation_id)
    if not removed:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})
    return JSONResponse(content={"message": "Conversation removed successfully"})


# ---------------------------------------------------------------------------
# PDF to QR Code Generator: Endpoints & Rate Limiter
# ---------------------------------------------------------------------------
MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_PDF_MIME_TYPES = {
    "application/pdf",
    "application/x-pdf",
    "application/acrobat",
    "applications/vnd.pdf",
    "text/pdf",
}
UUID4_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def is_valid_uuid4(value: str) -> bool:
    return bool(UUID4_PATTERN.fullmatch(str(value or "").strip()))


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    real_ip = request.headers.get("x-real-ip")
    if real_ip and real_ip.strip():
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host.strip()
    return "unknown"


class SlidingWindowRateLimiter:
    """Thread-safe sliding-window rate limiter per client IP."""

    def __init__(self, limit: int = 10, window_seconds: float = 60.0) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._history: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> tuple[bool, int, int]:
        """
        Check if key is within rate limit.
        Returns: (allowed: bool, remaining: int, retry_after: int)
        """
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            timestamps = self._history[key]
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()
            if len(timestamps) < self.limit:
                timestamps.append(now)
                return True, self.limit - len(timestamps), 0
            oldest = timestamps[0]
            retry_after = max(1, int(oldest + self.window_seconds - now))
            return False, 0, retry_after

    def reset(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._history.clear()
            else:
                self._history.pop(key, None)


pdf_upload_rate_limiter = SlidingWindowRateLimiter(limit=10, window_seconds=60.0)


def reset_upload_rate_limits() -> None:
    pdf_upload_rate_limiter.reset()


@app.post("/api/pdf/upload")
async def upload_pdf(request: Request, file: UploadFile = File(...)) -> JSONResponse:
    # 1. Rate Limiting Check (10 uploads/min per IP)
    client_ip = get_client_ip(request)
    allowed, _, retry_after = pdf_upload_rate_limiter.check(client_ip)
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"detail": "Upload rate limit exceeded. Please wait a minute."},
            headers={"Retry-After": str(retry_after)},
        )

    # 2. MIME type verification
    content_type = (file.content_type or "").lower().strip()
    if content_type and content_type not in ALLOWED_PDF_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid PDF format or corrupted file.")

    # 3. Stream-safe chunked reading with 10 MB limit
    chunks: list[bytes] = []
    total_size = 0
    chunk_size = 64 * 1024
    try:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_PDF_SIZE_BYTES:
                raise HTTPException(status_code=413, detail="File size exceeds 10 MB limit.")
            chunks.append(chunk)
    finally:
        await file.close()

    content = b"".join(chunks)

    # 4. Binary Magic Byte & EOF Integrity Validation
    if len(content) < 10 or b"%PDF-" not in content[:1024]:
        raise HTTPException(status_code=400, detail="Invalid PDF format or corrupted file.")
    tail = content[-4096:]
    if b"%%EOF" not in tail:
        raise HTTPException(status_code=400, detail="Invalid PDF format or corrupted file.")

    # 5. Cryptographic ID generation & filename sanitization
    doc_id = str(uuid.uuid4())
    filename = file.filename or "document.pdf"

    # 6. Store document via repository
    stored = repositories.add_pdf_upload(
        doc_id=doc_id,
        filename=filename,
        content=content,
        size=len(content),
        ttl_hours=24,
    )

    # 7. Return contract response
    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "id": doc_id,
            "filename": stored.get("filename", filename),
            "size": len(content),
            "url": f"/v/{doc_id}",
            "expires_at": stored.get("expires_at") or stored.get("expiresAt"),
        },
    )


@app.get("/v/{id}")
@app.get("/api/pdf/{id}")
def view_pdf(id: str) -> Response:
    if not is_valid_uuid4(id):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")
    doc = repositories.get_pdf_upload(id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found or expired.")
    binary = bytes(doc.get("content", b""))
    filename = str(doc.get("filename", "document.pdf"))
    content_type = str(doc.get("contentType", "application/pdf"))
    return Response(
        content=binary,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Content-Length": str(len(binary)),
            "Cache-Control": "public, max-age=3600",
        },
    )


@app.get("/api/pdf/{id}/file")
@app.get("/api/pdf/{id}/download")
def download_pdf(id: str) -> Response:
    if not is_valid_uuid4(id):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")
    doc = repositories.get_pdf_upload(id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found or expired.")
    binary = bytes(doc.get("content", b""))
    filename = str(doc.get("filename", "document.pdf"))
    content_type = str(doc.get("contentType", "application/pdf"))
    return Response(
        content=binary,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(binary)),
            "Cache-Control": "public, max-age=3600",
        },
    )


@app.get("/api/pdf/{id}/metadata")
def get_pdf_metadata(id: str) -> JSONResponse:
    if not is_valid_uuid4(id):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")
    meta = repositories.get_pdf_metadata(id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Document not found or expired.")
    return JSONResponse(
        status_code=200,
        content={
            "id": meta["id"],
            "filename": meta.get("filename", "document.pdf"),
            "size": meta.get("size", 0),
            "created_at": meta.get("created_at") or meta.get("createdAt"),
            "expires_at": meta.get("expires_at") or meta.get("expiresAt"),
            "createdAt": meta.get("createdAt") or meta.get("created_at"),
            "expiresAt": meta.get("expiresAt") or meta.get("expires_at"),
        },
        headers={"Cache-Control": "public, max-age=60"},
    )


@app.delete("/api/pdf/{id}")
def delete_pdf(id: str) -> JSONResponse:
    if not is_valid_uuid4(id):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")
    removed = repositories.remove_pdf_upload(id)
    if not removed:
        raise HTTPException(status_code=404, detail="Document not found or already deleted.")
    return JSONResponse(
        status_code=200,
        content={"status": "deleted", "id": id},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    if exc.status_code in {401, 503} and isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail, headers=exc.headers)
    if exc.status_code in {401, 503} and isinstance(exc.detail, str):
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail}, headers=exc.headers)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)
