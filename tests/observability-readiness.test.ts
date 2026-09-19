import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createServerErrorEvent } from "../lib/observability/server-errors";

test("server error events expose only allowlisted technical context", () => {
  const error = Object.assign(new Error("private person@example.com token=secret"), {
    name: "UnexpectedPrivateError",
    digest: "safe-digest-123",
  });
  const event = createServerErrorEvent({
    error,
    method: "POST",
    context: {
      routerKind: "App Router",
      routePath: "/app/newsletter/[id]",
      routeType: "action",
      renderSource: "server-rendering",
    },
  });
  const serialized = JSON.stringify(event);

  assert.equal(event.event, "server.request.error");
  assert.equal(event.routePath, "/app/newsletter/[id]");
  assert.equal(event.errorType, "Error");
  assert.equal(event.digest, "safe-digest-123");
  assert.doesNotMatch(serialized, /person@example\.com|token=secret|message|stack|cause|headers|cookies|body/u);
});

test("unsafe route, method, and digest values fail closed", () => {
  const error = Object.assign(new Error("hidden"), { digest: "email=person@example.com" });
  const event = createServerErrorEvent({
    error,
    method: "TRACE person@example.com",
    context: {
      routerKind: "App Router",
      routePath: "/concrete/private/person@example.com?token=secret",
      routeType: "render",
    },
  });

  assert.equal(event.routePath, "unknown");
  assert.equal(event.method, "OTHER");
  assert.equal(event.digest, "unavailable");
  assert.doesNotMatch(JSON.stringify(event), /person@example\.com|token=secret/u);
});

test("Next instrumentation never logs raw request or error content", () => {
  const source = readFileSync(new URL("../instrumentation.ts", import.meta.url), "utf8");
  assert.match(source, /createServerErrorEvent/u);
  assert.match(source, /console\.error\(JSON\.stringify\(event\)\)/u);
  assert.doesNotMatch(source, /request\.(?:path|headers)|error\.(?:message|stack|cause)/u);
});
