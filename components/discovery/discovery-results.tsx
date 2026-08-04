import Link from "next/link";

import type { DiscoveryGroup, DiscoveryMatch, DiscoveryStatus } from "@/types/discovery";

const statusClasses: Record<DiscoveryStatus, string> = {
  Live: "border-emerald-300/30 text-emerald-200",
  Beta: "border-[#35d0e5]/40 text-[#73e3f1]",
  "In Development": "border-[#ff9a3d]/40 text-[#ffb36d]",
  "Coming Soon": "border-white/15 text-slate-400",
};

interface DiscoveryResultsProps {
  groups: Map<DiscoveryGroup, DiscoveryMatch[]>;
  activeId: string | null;
  onActivate: (id: string) => void;
  onSelect: () => void;
}

export function DiscoveryResults({ groups, activeId, onActivate, onSelect }: DiscoveryResultsProps) {
  return (
    <div className="max-h-[min(68vh,38rem)] overflow-y-auto overscroll-contain p-2 sm:p-3">
      {[...groups].map(([group, matches]) => {
        const headingId = `discovery-group-${group.toLocaleLowerCase("en-US")}`;

        return (
          <section key={group} role="group" aria-labelledby={headingId} className="not-first:mt-2">
            <h2 id={headingId} className="px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#35d0e5]">
              {group}
            </h2>
            <div className="grid gap-1">
              {matches.map(({ item }) => {
                const optionId = `discovery-option-${item.id}`;
                const content = (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white">{item.title}</span>
                        <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${statusClasses[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">{item.description}</p>
                    </div>
                    <span aria-hidden="true" className="shrink-0 text-slate-500">{item.href ? "→" : "—"}</span>
                  </>
                );

                return item.href ? (
                  <Link
                    id={optionId}
                    key={item.id}
                    role="option"
                    aria-selected={activeId === item.id}
                    href={item.href}
                    onMouseEnter={() => onActivate(item.id)}
                    onFocus={() => onActivate(item.id)}
                    onClick={onSelect}
                    className={`flex items-center gap-4 rounded-xl px-3 py-3 transition focus:outline-none ${activeId === item.id ? "bg-[#35d0e5]/10 ring-1 ring-inset ring-[#35d0e5]/45" : "hover:bg-white/5"}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    id={optionId}
                    key={item.id}
                    role="option"
                    aria-selected="false"
                    aria-disabled="true"
                    className="flex cursor-default items-center gap-4 rounded-xl px-3 py-3 opacity-80"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

