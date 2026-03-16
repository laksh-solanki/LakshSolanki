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
