"use server";

import { randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { cookies, headers } from "next/headers";
import { isAllowedRequestOrigin } from "@/lib/echowall/security";
import { reactionCookie, echoReactionIdentity, reactionDigest, reactionSecret } from "@/lib/echowall/reaction-identity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function setEchoReaction(echoId: string, liked: boolean): Promise<
  { status: "ok"; liked: boolean; likes: number } | { status: "unavailable" | "rate_limited" }
> {
  const secret = reactionSecret();
  const site = process.env.SITE_URL;
  if (!secret || !site || typeof liked !== "boolean" || typeof echoId !== "string"
    || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu.test(echoId)) return { status: "unavailable" };
  const request = await headers();
  if (!isAllowedRequestOrigin(request.get("origin"), request.get("host"), site)) return { status: "unavailable" };
  // Only trust the edge-controlled client address in the supported live environment.
  const network = process.env.VERCEL_ENV === "production"
    ? request.get("x-vercel-forwarded-for")?.trim()
    : /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/u.test(site) ? "127.0.0.1" : undefined;
  if (!network || !isIP(network)) return { status: "unavailable" };

  try {
    let identity = await echoReactionIdentity(secret);
    const isNew = !identity;
    if (!identity) {
      const id = randomBytes(24).toString("hex");
      identity = { id, key: reactionDigest("actor", id, secret) };
    }
    const now = new Date();
    const windowKey = Math.floor(now.getTime() / (15 * 60 * 1000));
    const { data, error } = await getSupabaseServerClient().rpc("set_echo_reaction", {
      p_echo_id: echoId, p_actor: identity.key,
      p_network: reactionDigest("network", `${windowKey}:${network}`, secret),
      p_liked: liked,
    });
    if (error || data?.status !== "ok" || data.liked !== liked || !Number.isSafeInteger(data.likes) || data.likes < 0) {
      return { status: data?.status === "rate_limited" ? "rate_limited" : "unavailable" };
    }
    if (isNew) (await cookies()).set(reactionCookie, identity.id, {
      httpOnly: true, secure: new URL(site).protocol === "https:", sameSite: "strict", path: "/",
    });
    return { status: "ok", liked, likes: data.likes };
  } catch {
    return { status: "unavailable" };
  }
}
