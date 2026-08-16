"use client";

import { useState } from "react";

interface PrivacyVideoProps {
  youtubeId: string;
  title: string;
  duration: string;
  url: string;
}

export function PrivacyVideo({ youtubeId, title, duration, url }: PrivacyVideoProps) {
  const [consented, setConsented] = useState(false);

  return (
    <div className="overflow-hidden border border-white/15 bg-[#03111d]">
      <div className="aspect-video">
        {consented ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={title}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="relative grid h-full place-items-center overflow-hidden p-6 text-center sm:p-10">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(53,208,229,0.18),transparent_32%),radial-gradient(circle_at_25%_75%,rgba(255,122,0,0.12),transparent_28%)]" />
            <div className="relative max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff9a3d]">YouTube / {duration}</p>
              <p className="mt-4 text-xl font-black leading-snug text-white sm:text-3xl">{title}</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">Erst nach deiner Auswahl wird eine Verbindung zu YouTube hergestellt. Das Video startet nicht automatisch.</p>
              <button
                type="button"
                onClick={() => setConsented(true)}
                className="mt-7 min-h-12 rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]"
              >
                Video laden
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between gap-3 border-t border-white/10 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center">
        <span>Privacy-aware: YouTube wird erst nach Klick eingebettet.</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-[#35d0e5]">
          Direkt auf YouTube ansehen ↗<span className="sr-only"> (externer Link, öffnet in neuem Tab)</span>
        </a>
      </div>
    </div>
  );
}
