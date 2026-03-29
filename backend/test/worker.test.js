import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/worker.js";

test("worker adapter serves health endpoint", async () => {
  const response = await worker.fetch(new Request("https://mindlytic.example/health"), {
    MONGODB_URI: "",
  });

  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.status, "ok");
});

test("worker readiness reports not ready when only MONGODB_URI is configured", async () => {
  const response = await worker.fetch(new Request("https://mindlytic.example/ready"), {
    MONGODB_URI: "mongodb+srv://example.invalid/test",
  });

  assert.equal(response.status, 503);

  const body = await response.json();
  assert.equal(body.status, "not_ready");
  assert.equal(body.database.mode, "mongo");
  assert.equal(body.database.connected, false);
});

test("worker adapter supports media create and list routes", async () => {
  const createResponse = await worker.fetch(
    new Request("https://mindlytic.example/api/media", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Banner",
        url: "https://cdn.example.com/banner.jpg",
        type: "image",
      }),
    }),
    {
      MONGODB_URI: "",
    },
  );

  assert.equal(createResponse.status, 201);

  const listResponse = await worker.fetch(
    new Request("https://mindlytic.example/api/media?type=image"),
    {
      MONGODB_URI: "",
    },
  );

  assert.equal(listResponse.status, 200);
  const body = await listResponse.json();
  assert.equal(body.count, 1);
  assert.equal(body.data[0].url, "https://cdn.example.com/banner.jpg");
});

test("worker adapter supports certificate compatibility endpoint", async () => {
  const response = await worker.fetch(
    new Request("https://mindlytic.example/api/projects/certificate-gen?limit=3"),
    {
      MONGODB_URI: "",
    },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Number.isInteger(body.count));
  assert.ok(Array.isArray(body.data));
});

test("worker adapter supports tts snippet create/list/delete", async () => {
  const ownerKey = "worker-tts-owner-123";

  const createResponse = await worker.fetch(
    new Request("https://mindlytic.example/api/tts/snippets", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ownerKey,
        content: "Worker route snippet text.",
      }),
    }),
    {
      MONGODB_URI: "",
    },
  );

  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  const snippetId = created.data?.id;
  assert.ok(typeof snippetId === "string" && snippetId.length > 0);

  const listResponse = await worker.fetch(
    new Request(`https://mindlytic.example/api/tts/snippets?ownerKey=${encodeURIComponent(ownerKey)}&limit=6`),
    {
      MONGODB_URI: "",
    },
  );
  assert.equal(listResponse.status, 200);
  const listed = await listResponse.json();
  assert.equal(listed.count, 1);

  const deleteResponse = await worker.fetch(
    new Request(
      `https://mindlytic.example/api/tts/snippets/${encodeURIComponent(snippetId)}?ownerKey=${encodeURIComponent(ownerKey)}`,
      {
        method: "DELETE",
      },
    ),
    {
      MONGODB_URI: "",
    },
  );
  assert.equal(deleteResponse.status, 200);
});

test("worker image route is unavailable", async () => {
  const response = await worker.fetch(
    new Request("https://mindlytic.example/api/ai/image", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt: "generate a mountain landscape",
      }),
    }),
    {
      MONGODB_URI: "",
    },
  );

  assert.equal(response.status, 404);
});

test("worker ai history rejects unauthorized requests", async () => {
  const response = await worker.fetch(
    new Request("https://mindlytic.example/api/ai/history"),
    {
      MONGODB_URI: "",
      NODE_ENV: "test",
      FIREBASE_AUTH_TEST_MODE: "true",
    },
  );

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.match(body.error, /Unauthorized/i);
});

test("worker ai history persists and isolates conversations by user", async () => {
  const conversationId = "worker-conversation-123";
  const userOneAuth = "Bearer test-token:worker-user-1:worker1@example.com:Worker%20One";
  const userTwoAuth = "Bearer test-token:worker-user-2:worker2@example.com:Worker%20Two";
  const env = {
    MONGODB_URI: "",
    NODE_ENV: "test",
    FIREBASE_AUTH_TEST_MODE: "true",
  };

  const createResponse = await worker.fetch(
    new Request(`https://mindlytic.example/api/ai/history/${encodeURIComponent(conversationId)}`, {
      method: "PUT",
      headers: {
        authorization: userOneAuth,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "user", text: "worker hello" },
          { role: "assistant", text: "worker hi" },
        ],
      }),
    }),
    env,
  );
  assert.equal(createResponse.status, 200);

  const listResponse = await worker.fetch(
    new Request("https://mindlytic.example/api/ai/history?limit=30", {
      headers: {
        authorization: userOneAuth,
      },
    }),
    env,
  );
  assert.equal(listResponse.status, 200);
  const listBody = await listResponse.json();
  assert.equal(listBody.count, 1);
  assert.equal(listBody.data[0].id, conversationId);

  const isolatedGetResponse = await worker.fetch(
    new Request(`https://mindlytic.example/api/ai/history/${encodeURIComponent(conversationId)}`, {
      headers: {
        authorization: userTwoAuth,
      },
    }),
    env,
  );
  assert.equal(isolatedGetResponse.status, 404);

  const deleteResponse = await worker.fetch(
    new Request(`https://mindlytic.example/api/ai/history/${encodeURIComponent(conversationId)}`, {
      method: "DELETE",
      headers: {
        authorization: userOneAuth,
      },
    }),
    env,
  );
  assert.equal(deleteResponse.status, 200);
});
