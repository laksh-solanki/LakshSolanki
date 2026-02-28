import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";

const testEnv = {
  NODE_ENV: "test",
  MONGODB_URI: "",
  ADMIN_API_KEY: "test-admin",
  CORS_ORIGIN: "*",
};

const createTestApp = async () => {
  const app = await buildApp({
    envOverrides: testEnv,
    logger: false,
  });
  await app.ready();
  return app;
};

test("GET / returns backend status", async (t) => {
  const app = await createTestApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({ method: "GET", url: "/" });
  const body = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(body.status, "Backend working");
  assert.equal(body.mode, "memory");
});

test("GET /project/certificate-gen returns courses for certificate generator", async (t) => {
  const app = await createTestApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({ method: "GET", url: "/project/certificate-gen?limit=3" });
  const body = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(Array.isArray(body), true);
  assert.equal(body.length, 3);
  assert.equal(typeof body[0].name, "string");
});

test("subscription lifecycle works end-to-end", async (t) => {
  const app = await createTestApp();
  t.after(async () => {
    await app.close();
  });

  const subscribe = await app.inject({
    method: "POST",
    url: "/api/subscribe",
    payload: { email: "person@example.com" },
  });
  assert.equal(subscribe.statusCode, 201);

  const duplicate = await app.inject({
    method: "POST",
    url: "/api/subscribe",
    payload: { email: "person@example.com" },
  });
  assert.equal(duplicate.statusCode, 409);

  const statusBeforeUnsubscribe = await app.inject({
    method: "GET",
    url: "/api/subscribe/status?email=person@example.com",
  });
  assert.equal(statusBeforeUnsubscribe.statusCode, 200);
  assert.equal(statusBeforeUnsubscribe.json().subscribed, true);

  const unsubscribe = await app.inject({
    method: "DELETE",
    url: "/api/subscribe",
    payload: { email: "person@example.com" },
  });
  assert.equal(unsubscribe.statusCode, 200);

  const statusAfterUnsubscribe = await app.inject({
    method: "GET",
    url: "/api/subscribe/status?email=person@example.com",
  });
  assert.equal(statusAfterUnsubscribe.statusCode, 200);
  assert.equal(statusAfterUnsubscribe.json().subscribed, false);
});

test("admin endpoints enforce key and return stats", async (t) => {
  const app = await createTestApp();
  t.after(async () => {
    await app.close();
  });

  const unauthorized = await app.inject({
    method: "GET",
    url: "/api/admin/stats",
  });
  assert.equal(unauthorized.statusCode, 401);

  const authorized = await app.inject({
    method: "GET",
    url: "/api/admin/stats",
    headers: {
      "x-admin-key": "test-admin",
    },
  });
  assert.equal(authorized.statusCode, 200);

  const body = authorized.json();
  assert.equal(typeof body.totals.courses, "number");
  assert.equal(typeof body.totals.hobbies, "number");
  assert.equal(typeof body.totals.subscriptions, "number");
});
