import Link from "next/link";
import { hqPulseItems } from "@/data/hq-pulse";

function isEditorial(type: string) {
  return type === "Career Spotlight" || type === "Formatupdate" || type === "Interview" || type === "Writing";
}

export function HqPulse() {
  const items = hqPulseItems.slice(0, 5);

  return (
    <section id="pulse" aria-labelledby="pulse-title" className="scroll-mt-24 border-b border-white/10 bg-[#061521] px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[90rem]">
        <header className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-[0.42fr_1fr] lg:items-end">
          <p className="font-mono text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">HQ Pulse / 05</p>
          <div>
            <h2 id="pulse-title" className="max-w-5xl text-4xl font-black tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">What’s moving right now.</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Fünf kuratierte Einstiegspunkte in aktuelle Stories, Formate und Projekte des Digital HQ.</p>
          </div>
        </header>

        <ol className="grid grid-cols-1 border-l border-white/10 md:grid-cols-2 lg:grid-cols-12">
          {items.map((item, index) => {
            const editorial = isEditorial(item.type);
            const featured = index === 0;
            const accent = editorial ? "#35d0e5" : "#ff9a3d";

            return (
              <li
                key={item.id}
                className={`min-w-0 border-b border-r border-white/10 ${featured ? "md:col-span-2 lg:col-span-7 lg:row-span-2" : index < 3 ? "lg:col-span-5" : "lg:col-span-6"}`}
              >
                <Link
                  href={item.href}
                  className={`group flex h-full flex-col bg-white/[0.012] p-7 transition duration-300 hover:bg-white/[0.04] focus-visible:relative focus-visible:z-10 focus-visible:bg-white/[0.05] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] sm:p-9 ${featured ? "min-h-80 lg:min-h-[33rem]" : "min-h-64"}`}
                  style={{ outlineColor: accent }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-xs font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{item.type}</p>
                    {item.status && <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-300">{item.status}</span>}
                  </div>

                  <div className="mt-auto pt-16">
                    <div className="flex items-center gap-4">
                      <span className={`font-mono font-black tracking-[-0.05em] ${featured ? "text-5xl sm:text-6xl" : "text-3xl"}`} style={{ color: accent }}>{String(index + 1).padStart(2, "0")}</span>
                      <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
                    </div>
                    <h3 className={`mt-7 max-w-4xl font-black leading-tight tracking-[-0.025em] text-white ${featured ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>{item.title}</h3>
                    <p className={`mt-5 max-w-3xl leading-7 text-slate-300 ${featured ? "text-lg" : ""}`}>{item.teaser}</p>
                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                      {item.source && <span className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Source / {item.source}</span>}
                      <span className="font-bold text-white transition group-hover:translate-x-1" style={{ color: accent }}>Open pulse <span aria-hidden="true">→</span></span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
