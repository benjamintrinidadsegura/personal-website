import "server-only";

export function isEchoCountryContextEnabled(): boolean {
  return process.env.ECHOWALL_COUNTRY_CONTEXT_ENABLED === "true";
}
