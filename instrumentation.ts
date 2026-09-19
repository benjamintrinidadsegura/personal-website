import type { Instrumentation } from "next";

import { createServerErrorEvent } from "@/lib/observability/server-errors";

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const event = createServerErrorEvent({ error, method: request.method, context });
  console.error(JSON.stringify(event));
};
