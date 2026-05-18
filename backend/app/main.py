from __future__ import annotations

import re
import time
from typing import Any, Literal

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
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
repositories = Repositories(db_manager.db)
token_verifier = FirebaseTokenVerifier(
    project_id=settings.firebase_project_id,
    jwks_url=settings.firebase_jwks_url,
    test_mode=settings.firebase_auth_test_mode,
)

app = FastAPI(
    title="LakshSolanki Backend",
    version="2.0.0",
    description="Python backend for the main site API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Admin-Key"],
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
    if not 6 <= len(snippet_id) <= 120:
        return JSONResponse(status_code=400, content={"error": "Invalid request payload."})
    removed = repositories.remove_tts_snippet(owner_key=ownerKey, snippet_id=snippet_id)
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
    preferred = requested_provider or settings.ai_default_provider or "auto"
    if preferred == "gemini":
        return "gemini" if settings.gemini_api_key else ""
    if preferred == "groq":
        return "groq" if settings.groq_api_key else ""
    if preferred == "openai":
        return "openai" if settings.openai_api_key else ""
    if settings.gemini_api_key:
        return "gemini"
    if settings.groq_api_key:
        return "groq"
    if settings.openai_api_key:
        return "openai"
    return ""


def _extract_ai_text(provider: str, payload: dict[str, Any]) -> str:
    if provider == "gemini":
        parts = payload.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        return "".join(str(part.get("text", "")) for part in parts).strip()
    content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        return "".join(str(part.get("text", "")) for part in content).strip()
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
        payload.model
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
                body: dict[str, Any] = {
                    "contents": [
                        {
                            "role": "model" if item["role"] == "assistant" else "user",
                            "parts": [{"text": item["text"]}],
                        }
                        for item in messages
                    ],
                    "generationConfig": {"temperature": temperature, "maxOutputTokens": max_output_tokens},
                }
                if system_prompt:
                    body["system_instruction"] = {"parts": [{"text": system_prompt}]}
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


@app.on_event("shutdown")
def shutdown_event() -> None:
    db_manager.close()


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    if exc.status_code in {401, 503} and isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    if exc.status_code in {401, 503} and isinstance(exc.detail, str):
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
