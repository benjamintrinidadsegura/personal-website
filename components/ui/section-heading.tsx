interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "cyan" | "orange";
}

export function SectionHeading({ eyebrow, title, description, accent = "cyan" }: SectionHeadingProps) {
  return (
    <header className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
      <div>
        <p className={`text-xs font-black uppercase tracking-[0.34em] ${accent === "cyan" ? "text-[#35d0e5]" : "text-[#ff8c24]"}`}>
          {eyebrow}
        </p>
        <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          {title}
        </h2>
      </div>
      <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{description}</p>
    </header>
  );
}
