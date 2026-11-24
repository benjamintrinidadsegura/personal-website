import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";

export const reactionCookie = "btshq_echo_reaction";
export const reactionSecret = () => {
  const secret = process.env.ECHOWALL_REACTION_SECRET;
  return process.env.ECHOWALL_REACTIONS_ENABLED === "true" && secret && secret.length >= 32 ? secret : null;
};
export function reactionDigest(purpose: "actor" | "network", value: string, secret: string) {
  return createHmac("sha256", secret).update(`echo-reactions/v1:${purpose}:${value}`).digest("hex");
}
export async function echoReactionIdentity(secret: string) {
  const id = (await cookies()).get(reactionCookie)?.value;
  return id && /^[0-9a-f]{48}$/u.test(id) ? { id, key: reactionDigest("actor", id, secret) } : null;
}
