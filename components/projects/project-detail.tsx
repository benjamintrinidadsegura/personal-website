import type { CSSProperties } from "react";
import Link from "next/link";
import type { Project } from "@/types/content";

export function ProjectDetail({ project }: { project: Project }) {
  const details = [
    { label: "01 / Ausgangslage", title: "Das Problem", text: project.problem },
    { label: "02 / Richtung", title: "Das Ziel", text: project.goal },
    { label: "03 / Signal", title: "Aktueller Stand", text: project.currentState },
    { label: "04 / Next", title: "Nächste Schritte", text: project.nextSteps },
  ];

  return (
    <article style={{ "--project-accent": project.accent } as CSSProperties} className={`pattern-${project.pattern} relative min-h-screen overflow-hidden px-5 pb-24 pt-32 sm:px-8 sm:pt-40`}>
      <div className="project-page-glow absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <Link href="/#building" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-[var(--project-accent)] hover:text-white">← Back to the Digital HQ</Link>

        <header className="mt-14 border-b border-white/15 pb-14 sm:mt-20 sm:pb-20">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-16 min-w-16 place-items-center rounded-2xl border border-[var(--project-accent)] px-3 font-mono text-sm font-black tracking-widest text-[var(--project-accent)]">{project.monogram}</span>
            <div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--project-accent)]">{project.category}</p><p className="mt-2 text-sm font-bold text-slate-400">Status / {project.status}</p></div>
          </div>
          <h1 className="mt-10 text-[clamp(2.1rem,9vw,6rem)] font-black leading-[0.92] tracking-[-0.05em] text-white">{project.name}</h1>
          {project.longName ? <p className="mt-4 text-lg font-bold uppercase tracking-[0.16em] text-[var(--project-accent)]">{project.longName}</p> : null}
          <p className="mt-7 max-w-4xl text-2xl font-black leading-snug text-white sm:text-3xl">{project.claim ?? project.pitch}</p>
          {project.positioning ? <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-200">{project.positioning}</p> : <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{project.description}</p>}
        </header>

        <section aria-labelledby="vision-title" className="grid gap-7 border-b border-white/15 py-14 lg:grid-cols-[0.4fr_1fr] sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--project-accent)]">Project vision</p>
          <div><h2 id="vision-title" className="text-3xl font-black text-white sm:text-5xl">What this could become.</h2><p className="mt-6 max-w-3xl text-xl leading-9 text-slate-300">{project.vision}</p></div>
        </section>

        {project.values ? <section aria-labelledby="values-title" className="border-b border-white/15 py-14 sm:py-20"><p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--project-accent)]">Brand values</p><h2 id="values-title" className="mt-5 text-3xl font-black text-white sm:text-5xl">What guides the work.</h2><ol className="mt-10 grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-5">{project.values.map((value, index) => <li key={value} className="min-h-40 border-b border-r border-white/10 p-6"><span className="font-mono text-xs text-[var(--project-accent)]">0{index + 1}</span><p className="mt-8 text-lg font-black text-white">{value}</p></li>)}</ol></section> : null}

        {project.areas ? <section aria-labelledby="areas-title" className="border-b border-white/15 py-14 sm:py-20"><div className="grid gap-6 lg:grid-cols-[0.4fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--project-accent)]">Formats & areas</p><h2 id="areas-title" className="text-3xl font-black text-white sm:text-5xl">One brand. Multiple ways to create impact.</h2></div><div className="mt-12 grid border-l border-t border-white/10 md:grid-cols-2">{project.areas.map((area, index) => {
          const content = <><div className="flex items-start justify-between gap-4"><p className="font-mono text-xs text-[var(--project-accent)]">0{index + 1}</p>{area.status ? <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${area.href ? "border-[var(--project-accent)]/50 text-[var(--project-accent)]" : "border-white/10 text-slate-500"}`}>{area.status}</span> : null}</div><h3 className="mt-7 text-2xl font-black text-white">{area.title}</h3>{area.description ? <p className="mt-4 leading-7 text-slate-300">{area.description}</p> : null}{area.href ? <p className="mt-7 font-bold text-[var(--project-accent)]">Explore format <span aria-hidden="true">↗</span></p> : <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">Part of the growing platform</p>}</>;
          return area.href ? <article key={area.title} className="min-h-56 border-b border-r border-[var(--project-accent)]/35 bg-[var(--project-accent)]/[0.045]"><Link href={area.href} className="block h-full p-7 transition hover:bg-[var(--project-accent)]/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--project-accent)]" aria-label={`${area.title} – Format entdecken`}>{content}</Link></article> : <article key={area.title} className="min-h-56 border-b border-r border-white/10 bg-[#061521]/55 p-7">{content}</article>;
        })}</div></section> : null}

        {project.services ? <section aria-labelledby="services-title" className="grid gap-10 border-b border-white/15 py-14 lg:grid-cols-[0.48fr_1fr] sm:py-20"><div><p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--project-accent)]">Recruiting as a Service</p><h2 id="services-title" className="mt-5 text-3xl font-black text-white sm:text-5xl">Flexible recruiting support.</h2></div><ol className="border-t border-white/10">{project.services.map((service, index) => <li key={service} className="flex gap-5 border-b border-white/10 py-5 text-lg font-bold text-slate-200"><span className="font-mono text-xs text-[var(--project-accent)]">0{index + 1}</span>{service}</li>)}</ol></section> : null}

        {project.industries || project.region ? <section aria-labelledby="reach-title" className="grid gap-8 border-b border-white/15 py-14 lg:grid-cols-[0.4fr_1fr] sm:py-20"><p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--project-accent)]">Experience & reach</p><div><h2 id="reach-title" className="text-3xl font-black text-white sm:text-5xl">Industries and region.</h2>{project.industries ? <ul className="mt-9 flex flex-wrap gap-3">{project.industries.map((industry) => <li key={industry} className="rounded-full border border-white/15 px-4 py-2 font-bold text-slate-200">{industry}</li>)}</ul> : null}{project.region ? <p className="mt-8 text-lg text-slate-300"><span className="font-bold text-white">Region:</span> {project.region}</p> : null}</div></section> : null}

        {project.plannedElements ? <section aria-labelledby="elements-title" className="grid gap-7 border-b border-white/15 py-14 lg:grid-cols-[0.4fr_1fr] sm:py-20"><p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--project-accent)]">Planned core</p><div><h2 id="elements-title" className="text-3xl font-black text-white sm:text-5xl">Geplante Kernelemente.</h2><ul className="mt-8 grid gap-3 sm:grid-cols-2">{project.plannedElements.map((element, index) => <li key={element} className="flex gap-3 border-b border-white/10 pb-3 text-slate-300"><span className="font-mono text-xs text-[var(--project-accent)]">0{index + 1}</span>{element}</li>)}</ul></div></section> : null}

        <section aria-label="Projektstatus" className="grid border-l border-t border-white/10 md:grid-cols-2">
          {details.map((detail) => <div key={detail.label} className="min-h-64 border-b border-r border-white/10 bg-[#061521]/70 p-7 sm:p-9"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--project-accent)]">{detail.label}</p><h2 className="mt-8 text-2xl font-black text-white">{detail.title}</h2>{Array.isArray(detail.text) ? <ul className="mt-4 grid gap-2 text-slate-300">{detail.text.map((item) => <li key={item} className="flex gap-3"><span aria-hidden="true" className="text-[var(--project-accent)]">→</span>{item}</li>)}</ul> : <p className="mt-4 leading-7 text-slate-300">{detail.text}</p>}</div>)}
        </section>

        {project.mediaNote ? <aside className="mt-12 border-l-2 border-[var(--project-accent)] bg-white/[0.025] p-6"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--project-accent)]">Media & project updates</p><p className="mt-3 text-slate-300">{project.mediaNote}</p></aside> : null}

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-white/15 pt-10 sm:flex-row sm:items-center"><p className="max-w-xl text-slate-400">Dieses Projekt ist Teil des wachsenden bts.online-Ökosystems.</p><Link href="/#contact" className="rounded-full bg-[var(--project-accent)] px-6 py-3 text-center font-black text-[#041018] transition hover:-translate-y-0.5">{project.contactCta ?? "Start a conversation"}</Link></div>
      </div>
    </article>
  );
}
