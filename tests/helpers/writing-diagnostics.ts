import { randomUUID } from "node:crypto";
import type * as Diagnostics from "../../lib/writing/read-diagnostics";
import { loadSource } from "./load-source";

export function writingDiagnosticsHarness(options: {
  fetch?: typeof globalThis.fetch;
  sink?: (line: string) => void;
  now?: () => number;
} = {}) {
  const records: Array<Record<string, unknown>> = [];
  const write = (line: string) => { records.push(JSON.parse(line)); options.sink?.(line); };
  const diagnostics = loadSource<typeof Diagnostics>("lib/writing/read-diagnostics.ts", {
    "server-only": {}, "node:crypto": { randomUUID },
  }, {
    console: { info: write, warn: write },
    performance: { now: options.now ?? (() => performance.now()) },
    globalThis: { fetch: options.fetch ?? (async () => { throw new Error("Unexpected network in diagnostic fixture"); }) },
  });
  return { diagnostics, records };
}
