# Observability readiness

BTS.ONLINE keeps its monitoring foundation provider-neutral and privacy-safe. It does not ship analytics, tracking, or a third-party monitoring SDK.

## Implemented foundation

- Next.js `instrumentation.ts` emits one structured `server.request.error` event when the framework captures an unhandled server render, route-handler, Server Action, or proxy error.
- The event contains only a schema version, timestamp, runtime, framework route template, request method, failure context, a normalized error type, and the framework digest when it has a safe technical format.
- The event deliberately excludes the concrete request URL and query, headers, cookies, request or form bodies, error messages, stack traces, causes, email addresses, tokens, content, locations, and database details.
- Existing application error boundaries continue to provide localized recovery UI without exposing technical detail to visitors.
- Existing EchoWall and Newsletter runbooks remain the operational source for manual failure review, provider reconciliation, incident handling, and privacy constraints.

## Operational hook

Production hosting must retain and make searchable the process standard-error stream. Operators can filter JSON log lines by `"event":"server.request.error"`, then group by `routePath`, `routeType`, `errorType`, and `digest`. A digest is diagnostic correlation data, not a user identity.

## Remaining work

Automated retention, aggregation, dashboards, uptime probes, and alert routing require a hosting or monitoring decision. They are intentionally not added in V1.1. Any future sink must preserve the field allowlist above, define retention and access, and receive an explicit privacy and vendor review before data leaves the hosting boundary.
