type ServerErrorContext = {
  routerKind: "Pages Router" | "App Router";
  routePath: string;
  routeType: "render" | "route" | "action" | "proxy";
  renderSource?: string;
};

const safeMethods = new Set(["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]);
const safeErrorNames = new Set(["AggregateError", "Error", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError"]);
const safeRoutePattern = /^\/(?:app|pages)(?:\/[A-Za-z0-9_.()[\]-]+)*$/u;
const safeDigestPattern = /^[A-Za-z0-9_.:-]{1,128}$/u;

export function createServerErrorEvent({
  error,
  method,
  context,
}: {
  error: unknown;
  method: string;
  context: ServerErrorContext;
}) {
  const errorName = error instanceof Error ? error.name : "Error";
  const digest = error && typeof error === "object" && "digest" in error && typeof error.digest === "string"
    ? error.digest
    : undefined;
  return {
    schemaVersion: 1,
    event: "server.request.error",
    severity: "error",
    occurredAt: new Date().toISOString(),
    runtime: process.env.NEXT_RUNTIME === "edge" ? "edge" : "nodejs",
    routerKind: context.routerKind,
    routeType: context.routeType,
    renderSource: context.renderSource ?? "unknown",
    routePath: safeRoutePattern.test(context.routePath) ? context.routePath : "unknown",
    method: safeMethods.has(method) ? method : "OTHER",
    errorType: safeErrorNames.has(errorName) ? errorName : "Error",
    digest: digest && safeDigestPattern.test(digest) ? digest : "unavailable",
  } as const;
}
