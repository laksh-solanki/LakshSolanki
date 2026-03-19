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
  assert.equal(body.database.mode, "memory");
});
