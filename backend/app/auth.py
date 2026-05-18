from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import unquote

import jwt
from jwt import PyJWKClient


class AuthError(RuntimeError):
    def __init__(self, message: str, *, status_code: int = 401) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class AuthUser:
    uid: str
    email: str
    name: str
    picture: str
    claims: dict[str, object]

    def to_dict(self) -> dict[str, object]:
        return {
            "uid": self.uid,
            "email": self.email,
            "name": self.name,
            "picture": self.picture,
            "claims": self.claims,
        }


class FirebaseTokenVerifier:
    def __init__(self, *, project_id: str, jwks_url: str, test_mode: bool = False) -> None:
        self.project_id = project_id.strip()
        self.jwks_url = jwks_url.strip()
        self.test_mode = test_mode
        self.jwks_client = PyJWKClient(self.jwks_url) if self.project_id else None

    def verify_authorization_header(self, authorization_header: str | None) -> AuthUser:
        token = self._resolve_token(authorization_header)
        if self.test_mode:
            test_user = self._read_test_user(token)
            if test_user is not None:
                return test_user
        if not self.project_id or self.jwks_client is None:
            raise AuthError("Firebase auth is not configured on this backend.", status_code=503)

        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.project_id,
                issuer=f"https://securetoken.google.com/{self.project_id}",
                options={"require": ["sub", "aud", "iss", "exp"]},
                leeway=30,
            )
        except Exception as exc:  # noqa: BLE001
            raise AuthError(str(exc) or "Invalid Firebase token.") from exc

        subject = str(claims.get("sub", "")).strip()
        if not subject or len(subject) > 128:
            raise AuthError("Invalid Firebase token subject.")

        return AuthUser(
            uid=subject,
            email=str(claims.get("email", "")).strip().lower(),
            name=str(claims.get("name", "")).strip(),
            picture=str(claims.get("picture", "")).strip(),
            claims=claims,
        )

    @staticmethod
    def _resolve_token(authorization_header: str | None) -> str:
        value = str(authorization_header or "").strip()
        if not value:
            raise AuthError("Missing authorization token.")
        parts = value.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthError("Authorization header must be Bearer token.")
        return parts[1].strip()

    @staticmethod
    def _read_test_user(token: str) -> AuthUser | None:
        raw = token.strip()
        if not raw.startswith("test-token"):
            return None
        if raw == "test-token":
            return AuthUser(
                uid="test-user",
                email="test@example.com",
                name="Test User",
                picture="",
                claims={},
            )
        parts = raw.split(":")
        if len(parts) < 4:
            raise AuthError("Invalid test token format. Use test-token:<uid>:<email>:<name>.")
        return AuthUser(
            uid=unquote(parts[1]).strip() or "test-user",
            email=unquote(parts[2]).strip().lower(),
            name=unquote(":".join(parts[3:])).strip(),
            picture="",
            claims={},
        )
