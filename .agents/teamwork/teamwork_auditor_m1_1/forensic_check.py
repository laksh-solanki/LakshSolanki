import sys, os, uuid
from pathlib import Path

# Add paths
root = Path(".").resolve()
sys.path.insert(0, str(root))
sys.path.insert(0, str(root / "backend"))

from fastapi.testclient import TestClient
from backend.app.main import app, pdf_upload_rate_limiter, reset_upload_rate_limits

client = TestClient(app)
reset_upload_rate_limits()

print("=== CHECK 1: DYNAMIC UNIQUE BYTES UPLOAD & RETRIEVAL ===")
token1 = os.urandom(32).hex().encode("ascii")
token2 = os.urandom(32).hex().encode("ascii")

payload1 = b"%PDF-1.4\n% dynamic payload 1: " + token1 + b"\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
payload2 = b"%PDF-1.4\n% dynamic payload 2: " + token2 + b"\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"

resp1 = client.post(
    "/api/pdf/upload",
    files={"file": ("dynamic1.pdf", payload1, "application/pdf")},
    headers={"X-Forwarded-For": "10.200.1.1"},
)
assert resp1.status_code == 200, f"Upload 1 failed: {resp1.text}"
data1 = resp1.json()
id1 = data1["id"]

resp2 = client.post(
    "/api/pdf/upload",
    files={"file": ("dynamic2.pdf", payload2, "application/pdf")},
    headers={"X-Forwarded-For": "10.200.1.1"},
)
assert resp2.status_code == 200, f"Upload 2 failed: {resp2.text}"
data2 = resp2.json()
id2 = data2["id"]

assert id1 != id2, "IDs must be distinct UUIDs"
print(f"Upload 1 ID: {id1}")
print(f"Upload 2 ID: {id2}")

# Retrieve 1
get1 = client.get(f"/api/pdf/{id1}")
assert get1.status_code == 200, f"Get 1 failed: {get1.status_code}"
assert get1.content == payload1, "Retrieved bytes 1 must match dynamic payload 1"
assert token1 in get1.content

# Retrieve 2
get2 = client.get(f"/api/pdf/{id2}")
assert get2.status_code == 200, f"Get 2 failed: {get2.status_code}"
assert get2.content == payload2, "Retrieved bytes 2 must match dynamic payload 2"
assert token2 in get2.content
assert get1.content != get2.content, "Payload 1 and 2 must not be identical (not static mock)"
print("Dynamic unique payloads verified byte-for-byte in stream!")

# Download check
dl1 = client.get(f"/api/pdf/{id1}/download")
assert dl1.status_code == 200
assert dl1.content == payload1
assert 'attachment; filename="dynamic1.pdf"' in dl1.headers.get("content-disposition", "")
print("Download endpoint verified!")

# Delete check
del1 = client.delete(f"/api/pdf/{id1}")
assert del1.status_code == 200
assert del1.json() == {"status": "deleted", "id": id1}

get1_after = client.get(f"/api/pdf/{id1}")
assert get1_after.status_code == 404
print("Deletion and subsequent 404 verified!")

print("=== CHECK 2: MAGIC BYTE AND TRAILER ENFORCEMENT ===")
# Leading space before %PDF-
bad_prefix = b" %PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
r_bad = client.post(
    "/api/pdf/upload",
    files={"file": ("bad.pdf", bad_prefix, "application/pdf")},
    headers={"X-Forwarded-For": "10.200.1.2"},
)
assert r_bad.status_code == 400, f"Expected 400 for leading space, got {r_bad.status_code}"

# Missing %%EOF in trailer (e.g. %%EOF placed before last 2048 bytes and missing at tail)
bad_tail = b"%PDF-1.4\n" + b"%%EOF\n" + (b"X" * 2500)
r_bad_tail = client.post(
    "/api/pdf/upload",
    files={"file": ("bad_tail.pdf", bad_tail, "application/pdf")},
    headers={"X-Forwarded-For": "10.200.1.2"},
)
assert r_bad_tail.status_code == 400, f"Expected 400 for missing %%EOF in trailer, got {r_bad_tail.status_code}"
print("Binary header and trailer validation rigorously verified!")

print("=== CHECK 3: RATE LIMITER GENUINE PER-IP TRACKING ===")
reset_upload_rate_limits()
ip_a = "172.16.50.1"
ip_b = "172.16.50.2"
for i in range(10):
    r = client.post(
        "/api/pdf/upload",
        files={"file": (f"f{i}.pdf", payload1, "application/pdf")},
        headers={"X-Forwarded-For": ip_a},
    )
    assert r.status_code == 200, f"Request {i} from ip_a failed: {r.status_code}"

r_11 = client.post(
    "/api/pdf/upload",
    files={"file": ("f10.pdf", payload1, "application/pdf")},
    headers={"X-Forwarded-For": ip_a},
)
assert r_11.status_code == 429, f"Expected 429 for 11th request from ip_a, got {r_11.status_code}"
assert "Retry-After" in r_11.headers, "Must include Retry-After header"

# Different IP should succeed immediately
r_b = client.post(
    "/api/pdf/upload",
    files={"file": ("fb.pdf", payload1, "application/pdf")},
    headers={"X-Forwarded-For": ip_b},
)
assert r_b.status_code == 200, f"ip_b request failed: {r_b.status_code}"
print("Per-IP sliding window rate limiting rigorously verified!")
print("ALL EMPIRICAL CHECKS PASSED!")
