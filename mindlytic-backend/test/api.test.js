import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";

const testEnv = {
  NODE_ENV: "test",
  MONGODB_URI: "",
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

test("course endpoints create and list courses for the certificate generator", async (t) => {
  const app = await createTestApp();
  t.after(async () => {
    await app.close();
  });

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/courses",
    payload: {
      name: "Full Stack Web Development",
      category: "Software Development",
      level: "Intermediate",
      durationHours: 42,
    },
  });
  assert.equal(createResponse.statusCode, 201);
  assert.equal(createResponse.json().data.name, "Full Stack Web Development");

  const duplicateResponse = await app.inject({
    method: "POST",
    url: "/api/courses",
    payload: {
      name: " full stack web development ",
    },
  });
  assert.equal(duplicateResponse.statusCode, 409);

  const apiResponse = await app.inject({ method: "GET", url: "/api/courses?limit=3" });
  assert.equal(apiResponse.statusCode, 200);
  assert.equal(apiResponse.json().count, 1);
  assert.equal(apiResponse.json().data[0].name, "Full Stack Web Development");
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

test("image generation route returns validation error when invoke URL is missing", async (t) => {
  const app = await createTestApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/ai/image",
    payload: { prompt: "generate a mountain landscape" },
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.json().error, /invoke URL/i);
});

test("text chat route returns configuration error when provider keys are missing", async (t) => {
  const app = await createTestApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/ai/chat",
    payload: {
      messages: [{ role: "user", text: "hello" }],
    },
  });

  assert.equal(response.statusCode, 503);
  assert.match(response.json().error, /No AI text provider is configured/i);
});

