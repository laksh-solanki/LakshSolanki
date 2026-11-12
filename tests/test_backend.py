from __future__ import annotations

import io
import time
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.app.auth import AuthError, AuthUser, FirebaseTokenVerifier
from backend.app.config import Settings, load_settings
from backend.app.database import DatabaseManager, DatabaseStatus
from backend.app.main import (
    SlidingWindowRateLimiter,
    _extract_ai_text,
    _resolve_chat_provider,
    app,
    reset_upload_rate_limits,
)
from backend.app.repositories import Repositories, RepositoryError
from backend.app.utils import generate_id, is_valid_email, normalize_email, now_iso


@pytest.fixture
def client():
    reset_upload_rate_limits()
    with TestClient(app) as test_client:
        yield test_client


def test_utils():
    assert is_valid_email("user@example.com") is True
    assert is_valid_email("invalid-email") is False
    assert is_valid_email(None) is False
    assert normalize_email("  Test@Example.COM  ") == "test@example.com"
    assert len(generate_id()) == 36
    iso = now_iso()
    assert iso.endswith("Z")


def test_root_and_health(client: TestClient):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Backend working"
    assert "time" in data
    assert "uptimeSeconds" in data

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"


def test_ready_endpoint(client: TestClient):
    res = client.get("/ready")
    assert res.status_code in (200, 503)
    data = res.json()
    assert "status" in data
    assert "database" in data


def test_course_endpoints(client: TestClient):
    # List courses
    res = client.get("/api/courses")
    assert res.status_code == 200
    assert "data" in res.json()

    # Create a course
    test_name = f"Test Course {time.time()}"
    res = client.post(
        "/api/courses",
        json={
            "name": test_name,
            "category": "Web Dev",
            "level": "Beginner",
            "durationHours": 10.5,
            "tags": ["python", "vue"],
        },
    )
    assert res.status_code == 201
    created = res.json()["data"]
    assert created["name"] == test_name
    assert "id" in created

    # Duplicate course creation should return 409
    res_dup = client.post(
        "/api/courses",
        json={"name": test_name},
    )
    assert res_dup.status_code == 409
    assert "Course already exists" in res_dup.json()["error"]


def test_media_endpoints(client: TestClient):
    # List media
    res = client.get("/api/media")
    assert res.status_code == 200
    assert "data" in res.json()

    # Create media
    unique_url = f"https://example.com/media/{time.time()}.jpg"
    res = client.post(
        "/api/media",
        json={
            "url": unique_url,
            "name": "Sample Media",
            "type": "image",
            "alt": "A sample image",
            "tags": ["sample"],
        },
    )
    assert res.status_code == 201
    created = res.json()["data"]
    assert created["url"] == unique_url
    assert "id" in created

    # Duplicate media creation
    res_dup = client.post(
        "/api/media",
        json={"url": unique_url},
    )
    assert res_dup.status_code == 409
    assert "Media already exists" in res_dup.json()["error"]


def test_subscription_flow(client: TestClient):
    email = f"subscriber_{time.time()}@example.com"

    # Subscribe
    res = client.post("/api/subscribe", json={"email": email, "name": "Subscriber"})
    assert res.status_code == 201
    assert res.json()["message"] == "Subscribed successfully"

    # Check status
    res_status = client.get(f"/api/subscribe/status?email={email}")
    assert res_status.status_code == 200
    assert res_status.json()["subscribed"] is True
    assert res_status.json()["status"] == "active"

    # Subscribe again -> 409
    res_again = client.post("/api/subscribe", json={"email": email})
    assert res_again.status_code == 409

    # Unsubscribe
    res_unsub = client.request("DELETE", "/api/subscribe", json={"email": email})
    assert res_unsub.status_code == 200
    assert res_unsub.json()["message"] == "Unsubscribed successfully"

    # Status after unsubscribe
    res_status2 = client.get(f"/api/subscribe/status?email={email}")
    assert res_status2.json()["subscribed"] is False
    assert res_status2.json()["status"] == "unsubscribed"


def test_tts_snippets_flow(client: TestClient):
    owner_key = f"owner_key_{int(time.time())}"
    content = f"Hello from TTS test at {time.time()}"

    # Create snippet
    res = client.post(
        "/api/tts/snippets",
        json={"ownerKey": owner_key, "title": "Test Snippet", "content": content},
    )
    assert res.status_code == 201
    snippet = res.json()["data"]
    snippet_id = snippet["id"]
    assert snippet_id

    # List snippets
    res_list = client.get(f"/api/tts/snippets?ownerKey={owner_key}")
    assert res_list.status_code == 200
    assert any(s["id"] == snippet_id for s in res_list.json()["data"])

    # Duplicate snippet -> 409
    res_dup = client.post(
        "/api/tts/snippets",
        json={"ownerKey": owner_key, "content": content},
    )
    assert res_dup.status_code == 409

    # Delete snippet
    res_del = client.delete(f"/api/tts/snippets/{snippet_id}?ownerKey={owner_key}")
    assert res_del.status_code == 200
    assert res_del.json()["message"] == "Snippet removed successfully"

    # Delete again -> 404
    res_del_again = client.delete(f"/api/tts/snippets/{snippet_id}?ownerKey={owner_key}")
    assert res_del_again.status_code == 404


def test_pdf_flow(client: TestClient):
    reset_upload_rate_limits()
    fake_pdf = b"%PDF-1.4\n1 0 obj<<>>endobj\nxref\ntrailer<<>>\nstartxref\n%%EOF"

    # Upload PDF
    files = {"file": ("test.pdf", io.BytesIO(fake_pdf), "application/pdf")}
    res = client.post("/api/pdf/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    doc_id = data["id"]
    assert doc_id

    # View PDF
    res_view = client.get(f"/api/pdf/{doc_id}")
    assert res_view.status_code == 200
    assert res_view.headers["content-type"] == "application/pdf"
    assert res_view.content == fake_pdf

    # Download PDF
    res_dl = client.get(f"/api/pdf/{doc_id}/download")
    assert res_dl.status_code == 200
    assert "attachment" in res_dl.headers["content-disposition"]

    # Metadata
    res_meta = client.get(f"/api/pdf/{doc_id}/metadata")
    assert res_meta.status_code == 200
    assert res_meta.json()["id"] == doc_id
    assert res_meta.json()["size"] == len(fake_pdf)

    # Delete PDF
    res_del = client.delete(f"/api/pdf/{doc_id}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "deleted"

    # View after delete -> 404
    res_view404 = client.get(f"/api/pdf/{doc_id}")
    assert res_view404.status_code == 404


def test_pdf_invalid_upload(client: TestClient):
    reset_upload_rate_limits()
    invalid_data = b"not a pdf at all"
    files = {"file": ("bad.pdf", io.BytesIO(invalid_data), "application/pdf")}
    res = client.post("/api/pdf/upload", files=files)
    assert res.status_code == 400


def test_rate_limiter():
    limiter = SlidingWindowRateLimiter(limit=3, window_seconds=10.0)
    allowed1, rem1, _ = limiter.check("ip1")
    allowed2, rem2, _ = limiter.check("ip1")
    allowed3, rem3, _ = limiter.check("ip1")
    allowed4, rem4, retry = limiter.check("ip1")

    assert allowed1 is True
    assert allowed2 is True
    assert allowed3 is True
    assert allowed4 is False
    assert retry > 0

    # Other IP should be allowed
    other_allowed, _, _ = limiter.check("ip2")
    assert other_allowed is True


def test_ai_text_extraction():
    # Empty candidates
    assert _extract_ai_text("gemini", {"candidates": []}) == ""
    # Blocked feedback
    assert "blocked" in _extract_ai_text("gemini", {"promptFeedback": {"blockReason": "SAFETY"}}).lower()
    # Normal Gemini
    assert _extract_ai_text("gemini", {"candidates": [{"content": {"parts": [{"text": "Hello world"}]}}]}) == "Hello world"

    # Empty choices
    assert _extract_ai_text("openai", {"choices": []}) == ""
    # Normal OpenAI
    assert _extract_ai_text("openai", {"choices": [{"message": {"content": "OpenAI reply"}}]}) == "OpenAI reply"


def test_firebase_token_verifier():
    # Test mode
    verifier = FirebaseTokenVerifier(project_id="test-proj", jwks_url="https://example.com/jwks", test_mode=True)
    user = verifier.verify_authorization_header("Bearer test-token")
    assert user.uid == "test-user"
    assert user.email == "test@example.com"

    custom_user = verifier.verify_authorization_header("Bearer test-token:user123:user123@example.com:Custom%20User")
    assert custom_user.uid == "user123"
    assert custom_user.email == "user123@example.com"
    assert custom_user.name == "Custom User"

    # Missing token
    with pytest.raises(AuthError):
        verifier.verify_authorization_header("")

    # Invalid header format
    with pytest.raises(AuthError):
        verifier.verify_authorization_header("Basic 12345")


def test_ai_history_flow_with_test_token(client: TestClient):
    with patch("backend.app.main.token_verifier.test_mode", True):
        headers = {"Authorization": "Bearer test-token:myuid:myemail@example.com:MyName"}
        conv_id = f"test-chat-{int(time.time())}"

        # Put history
        res_put = client.put(
            f"/api/ai/history/{conv_id}",
            headers=headers,
            json={
                "title": "Test Title",
                "messages": [
                    {"role": "user", "text": "Hello AI"},
                    {"role": "assistant", "text": "Hello human"},
                ],
            },
        )
        assert res_put.status_code == 200
        assert res_put.json()["message"] == "Conversation saved successfully"

        # List history
        res_list = client.get("/api/ai/history", headers=headers)
        assert res_list.status_code == 200
        summaries = res_list.json()["data"]
        assert any(item["id"] == conv_id for item in summaries)

        # Get history by id
        res_get = client.get(f"/api/ai/history/{conv_id}", headers=headers)
        assert res_get.status_code == 200
        assert res_get.json()["data"]["id"] == conv_id
        assert len(res_get.json()["data"]["messages"]) == 2

        # Delete history
        res_del = client.delete(f"/api/ai/history/{conv_id}", headers=headers)
        assert res_del.status_code == 200
        assert res_del.json()["message"] == "Conversation removed successfully"

        # Get history after delete -> 404
        res_get404 = client.get(f"/api/ai/history/{conv_id}", headers=headers)
        assert res_get404.status_code == 404


def test_ai_chat_mocked(client: TestClient):
    # Mock httpx response for Gemini
    mock_gemini_response = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Hello! I am Mindlytic AI."}]
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_gemini_response
        mock_post.return_value = mock_response

        res = client.post(
            "/api/ai/chat",
            json={
                "messages": [{"role": "user", "text": "Hi"}],
                "provider": "gemini",
            },
        )
        assert res.status_code == 200
        assert res.json()["text"] == "Hello! I am Mindlytic AI."
        assert res.json()["provider"] == "gemini"
