"use client";

import { useState, useTransition } from "react";
import { setEchoReaction } from "@/app/echowall/reactions";
import { communityCopy } from "@/data/i18n/community";
import { getEchoDictionary } from "@/data/i18n/echowall";
import type { Locale } from "@/lib/i18n/config";
import type { PublicEcho } from "@/types/echowall";

export function EchoReaction({ echo, locale, interactive }: { echo: PublicEcho; locale: Locale; interactive: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ liked: boolean; likes: number }>();
  const [error, setError] = useState<"unavailable" | "rate_limited">();
  const liked = result?.liked ?? echo.liked ?? false;
  const count = new Intl.NumberFormat(locale).format(result?.likes ?? echo.likes ?? 0);
  const title = communityCopy[locale].like;
  if (!interactive) return <p className="text-sm text-slate-300"><span aria-hidden="true">♡</span> {title} · {count}</p>;
  return <div className="border-t border-[#355568] pt-2">
    <button className="echo-reaction" type="button" disabled={pending} aria-pressed={liked} onClick={() => start(async () => {
      setError(undefined);
      try {
        const response = await setEchoReaction(echo.id, !liked);
        if (response.status === "ok") setResult(response);
        else setError(response.status);
      } catch {
        setError("unavailable");
      }
    })}><span aria-hidden="true">{liked ? "♥" : "♡"}</span> {title} <span aria-live="polite">{count}</span></button>
    {error && <p role="status" className="text-sm text-[#ffe0bb]">{getEchoDictionary(locale).form.errors[error === "rate_limited" ? "RATE_LIMITED" : "SERVICE_UNAVAILABLE"]}</p>}
  </div>;
}
