const DEFAULT_FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const CLOCK_SKEW_SECONDS = 30;
const MAX_CLOCK_FUTURE_SKEW_SECONDS = 300;

const jwksCache = new Map();

const createAuthError = (statusCode, message, code = "auth_error") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const decodeBase64 = (value) => {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(value);
  }
  if (typeof globalThis.Buffer !== "undefined") {
    return globalThis.Buffer.from(value, "base64").toString("binary");
  }
  throw new Error("No base64 decoder available in this runtime.");
};

const toBase64 = (base64Url) => {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = padded.length % 4;
  if (remainder === 0) return padded;
  return `${padded}${"=".repeat(4 - remainder)}`;
};

const base64UrlToBytes = (base64Url) => {
  const binary = decodeBase64(toBase64(base64Url));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const decodeJsonSegment = (segment, label) => {
  const bytes = base64UrlToBytes(segment);
  const text = new TextDecoder().decode(bytes);
  try {
    return JSON.parse(text);
  } catch {
    throw createAuthError(401, `Invalid Firebase token ${label}.`, "invalid_token");
  }
};

const parseJwt = (token) => {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw createAuthError(401, "Malformed Firebase ID token.", "invalid_token");
  }

  const [headerSegment, payloadSegment, signatureSegment] = parts;
  if (!headerSegment || !payloadSegment || !signatureSegment) {
    throw createAuthError(401, "Malformed Firebase ID token.", "invalid_token");
  }

  return {
    header: decodeJsonSegment(headerSegment, "header"),
    payload: decodeJsonSegment(payloadSegment, "payload"),
    signature: base64UrlToBytes(signatureSegment),
    signingInput: new TextEncoder().encode(`${headerSegment}.${payloadSegment}`),
  };
};

const parseMaxAgeSeconds = (cacheControl = "") => {
  const match = String(cacheControl || "")
    .toLowerCase()
    .match(/max-age=(\d+)/);
  if (!match) return 300;
  const seconds = Number.parseInt(match[1], 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return 300;
  return seconds;
};

const resolveAuthorizationToken = (authorizationHeader) => {
  const value = String(authorizationHeader || "").trim();
  if (!value) {
    throw createAuthError(401, "Missing authorization token.", "missing_auth_header");
  }

  const [scheme, token] = value.split(/\s+/, 2);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    throw createAuthError(401, "Authorization header must be Bearer token.", "invalid_auth_header");
  }

  return token.trim();
};

const readTestUserFromToken = (token) => {
  const raw = String(token || "").trim();
  if (!raw || !raw.startsWith("test-token")) return null;

  if (raw === "test-token") {
    return {
      uid: "test-user",
      email: "test@example.com",
      name: "Test User",
      picture: "",
      claims: {},
    };
  }

  const parts = raw.split(":");
  if (parts.length < 4) {
    throw createAuthError(
      401,
      "Invalid test token format. Use test-token:<uid>:<email>:<name>.",
      "invalid_test_token",
    );
  }

  return {
    uid: decodeURIComponent(parts[1] || "").trim() || "test-user",
    email: decodeURIComponent(parts[2] || "").trim().toLowerCase(),
    name: decodeURIComponent(parts.slice(3).join(":") || "").trim(),
    picture: "",
    claims: {},
  };
};

const loadJwks = async ({ jwksUrl, cacheKey, forceRefresh = false }) => {
  const now = Date.now();
  const cached = jwksCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > now + 5000) {
    return cached.keys;
  }

  const response = await fetch(jwksUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  }).catch((error) => {
    throw createAuthError(401, `Unable to fetch Firebase JWKS: ${error?.message || "network error"}`, "jwks_fetch_failed");
  });

  if (!response.ok) {
    throw createAuthError(401, `Unable to fetch Firebase JWKS (${response.status}).`, "jwks_fetch_failed");
  }

  const payload = await response.json().catch(() => null);
  const keys = Array.isArray(payload?.keys) ? payload.keys : [];
  if (!keys.length) {
    throw createAuthError(401, "Firebase JWKS response did not include keys.", "jwks_invalid");
  }

  const maxAgeSeconds = parseMaxAgeSeconds(response.headers.get("cache-control") || "");
  jwksCache.set(cacheKey, {
    keys,
    expiresAt: now + maxAgeSeconds * 1000,
  });

  return keys;
};

const pickJwkByKid = (keys = [], kid = "") =>
  keys.find(
    (key) =>
      key &&
      key.kty === "RSA" &&
      typeof key.kid === "string" &&
      key.kid === kid &&
      typeof key.n === "string" &&
      typeof key.e === "string",
  ) || null;

const verifyRs256Signature = async ({ jwk, signature, signingInput }) => {
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    {
      name: "RSASSA-PKCS1-v1_5",
    },
    cryptoKey,
    signature,
    signingInput,
  );
};

const validateStandardClaims = ({ payload, projectId }) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (payload?.aud !== projectId) {
    throw createAuthError(401, "Invalid Firebase token audience.", "invalid_aud");
  }

  if (payload?.iss !== expectedIssuer) {
    throw createAuthError(401, "Invalid Firebase token issuer.", "invalid_iss");
  }

  if (typeof payload?.sub !== "string" || !payload.sub.trim() || payload.sub.length > 128) {
    throw createAuthError(401, "Invalid Firebase token subject.", "invalid_sub");
  }

  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp) || exp < nowSeconds - CLOCK_SKEW_SECONDS) {
    throw createAuthError(401, "Firebase token has expired.", "token_expired");
  }

  const iat = Number(payload?.iat);
  if (Number.isFinite(iat) && iat > nowSeconds + MAX_CLOCK_FUTURE_SKEW_SECONDS) {
    throw createAuthError(401, "Firebase token issued-at time is invalid.", "invalid_iat");
  }
};

const toPublicAuthUser = (payload = {}) => ({
  uid: String(payload.sub || "").trim(),
  email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "",
  name: typeof payload.name === "string" ? payload.name.trim() : "",
  picture: typeof payload.picture === "string" ? payload.picture.trim() : "",
  claims: payload,
});

export const createFirebaseTokenVerifier = ({
  projectId = "",
  jwksUrl = DEFAULT_FIREBASE_JWKS_URL,
  testMode = false,
} = {}) => {
  const normalizedProjectId = String(projectId || "").trim();
  const normalizedJwksUrl = String(jwksUrl || "").trim() || DEFAULT_FIREBASE_JWKS_URL;
  const cacheKey = `${normalizedProjectId}::${normalizedJwksUrl}`;

  if (!normalizedProjectId && !testMode) {
    throw new Error("FIREBASE_PROJECT_ID is required for Firebase token verification.");
  }

  const verifyToken = async (token) => {
    if (testMode) {
      const testUser = readTestUserFromToken(token);
      if (testUser) return testUser;
    }

    const { header, payload, signature, signingInput } = parseJwt(token);
    if (header?.alg !== "RS256") {
      throw createAuthError(401, "Firebase token must use RS256.", "invalid_alg");
    }
    if (!header?.kid) {
      throw createAuthError(401, "Firebase token is missing key id (kid).", "missing_kid");
    }

    const keys = await loadJwks({
      jwksUrl: normalizedJwksUrl,
      cacheKey,
      forceRefresh: false,
    });
    let jwk = pickJwkByKid(keys, header.kid);
    if (!jwk) {
      const refreshedKeys = await loadJwks({
        jwksUrl: normalizedJwksUrl,
        cacheKey,
        forceRefresh: true,
      });
      jwk = pickJwkByKid(refreshedKeys, header.kid);
    }

    if (!jwk) {
      throw createAuthError(401, "Firebase token key is not trusted.", "unknown_kid");
    }

    const verified = await verifyRs256Signature({
      jwk,
      signature,
      signingInput,
    });

    if (!verified) {
      throw createAuthError(401, "Invalid Firebase token signature.", "invalid_signature");
    }

    validateStandardClaims({
      payload,
      projectId: normalizedProjectId,
    });

    return toPublicAuthUser(payload);
  };

  const verifyAuthorizationHeader = async (authorizationHeader) => {
    const token = resolveAuthorizationToken(authorizationHeader);
    return verifyToken(token);
  };

  return {
    verifyToken,
    verifyAuthorizationHeader,
  };
};

export const FIREBASE_JWKS_URL = DEFAULT_FIREBASE_JWKS_URL;
