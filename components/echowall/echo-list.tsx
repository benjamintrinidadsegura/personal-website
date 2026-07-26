import type { EchoCategory, PublicEcho } from "@/types/echowall";

const categoryLabels: Record<EchoCategory, string> = {
  thought: "Gedanke",
  feedback: "Feedback",
  reaction: "Reaktion",
  message: "Nachricht",
};

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

type EchoListProps = {
  echoes: PublicEcho[];
  variant?: "full" | "preview";
};

export function EchoList({ echoes, variant = "full" }: EchoListProps) {
  return (
    <ol className="grid border-l border-t border-white/10 lg:grid-cols-2">
      {echoes.map((echo, index) => (
        <li
          key={echo.id}
          className="border-b border-r border-white/10 bg-white/[0.018] p-6 sm:p-8"
        >
          <article className={variant === "preview" ? "flex min-h-64 flex-col" : "flex min-h-72 flex-col"}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#35d0e5]">
                {echo.category ? categoryLabels[echo.category] : "Echo"}
              </p>
              <span className="font-mono text-[0.68rem] text-slate-500" aria-hidden="true">
                {(index + 1).toString().padStart(2, "0")}
              </span>
            </div>
            <blockquote
              className={`mt-8 break-words text-xl font-bold leading-8 text-white [overflow-wrap:anywhere] sm:text-2xl ${variant === "preview" ? "line-clamp-4" : ""}`}
            >
              „{echo.message}“
            </blockquote>
            <footer className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-10">
              <p className="font-bold text-slate-200">{echo.displayName}</p>
              <time
                dateTime={echo.publishedAt}
                className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-slate-500"
              >
                {dateFormatter.format(new Date(echo.publishedAt))}
              </time>
            </footer>
          </article>
        </li>
      ))}
    </ol>
  );
}
