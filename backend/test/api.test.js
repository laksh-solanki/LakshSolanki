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

  const compatibilityResponse = await app.inject({
    method: "GET",
    url: "/api/projects/certificate-gen?limit=3",
  });
  assert.equal(compatibilityResponse.statusCode, 200);
  assert.equal(compatibilityResponse.json().count, 1);
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

test("media endpoints create and list media records", async (t) => {
  const app = await createTestApp();
  t.after(async () => {
    await app.close();
  });

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/media",
    payload: {
      name: "Certificate Hero Image",
      url: "https://cdn.example.com/certificate-hero.png",
      type: "image",
      tags: ["certificate", "hero"],
    },
  });
  assert.equal(createResponse.statusCode, 201);
  assert.equal(createResponse.json().data.type, "image");

  const duplicateResponse = await app.inject({
    method: "POST",
    url: "/api/media",
    payload: {
      url: "https://cdn.example.com/certificate-hero.png",
    },
  });
  assert.equal(duplicateResponse.statusCode, 409);

  const listResponse = await app.inject({
    method: "GET",
    url: "/api/media?type=image&limit=5",
  });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json().count, 1);
  assert.equal(listResponse.json().data[0].url, "https://cdn.example.com/certificate-hero.png");
});

test("tts snippets endpoints persist, list, and remove snippets", async (t) => {
  const app = await createTestApp();
  t.after(async () => {
    await app.close();
  });

  const ownerKey = "tts-owner-key-123";

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/tts/snippets",
    payload: {
      ownerKey,
      title: "Release Notes",
      content: "Ship the update on Friday with a rollback plan.",
    },
  });

  assert.equal(createResponse.statusCode, 201);
  const created = createResponse.json().data;
  assert.equal(created.title, "Release Notes");

  const duplicateResponse = await app.inject({
    method: "POST",
    url: "/api/tts/snippets",
    payload: {
      ownerKey,
      content: "Ship the update on Friday with a rollback plan.",
    },
  });

  assert.equal(duplicateResponse.statusCode, 409);

  const listResponse = await app.inject({
    method: "GET",
    url: `/api/tts/snippets?ownerKey=${encodeURIComponent(ownerKey)}&limit=6`,
  });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json().count, 1);
  assert.equal(listResponse.json().data[0].content, "Ship the update on Friday with a rollback plan.");

  const deleteResponse = await app.inject({
    method: "DELETE",
    url: `/api/tts/snippets/${encodeURIComponent(created.id)}?ownerKey=${encodeURIComponent(ownerKey)}`,
  });
  assert.equal(deleteResponse.statusCode, 200);

  const listAfterDeleteResponse = await app.inject({
    method: "GET",
    url: `/api/tts/snippets?ownerKey=${encodeURIComponent(ownerKey)}&limit=6`,
  });
  assert.equal(listAfterDeleteResponse.statusCode, 200);
  assert.equal(listAfterDeleteResponse.json().count, 0);
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

