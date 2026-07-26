import type { CSSProperties } from "react";
import Link from "next/link";
import { projects } from "@/data/projects";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export function CurrentlyBuilding() {
  return (
    <section id="building" aria-labelledby="building-title" className="section-lines px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div id="building-title"><SectionHeading eyebrow="Currently Building / 06" title="A growing ecosystem, not a finished portfolio." description="Sechs Ideen mit eigener Energie — verbunden durch Recruiting, Community, Content und den Wunsch, Erfahrung in etwas Nützliches zu verwandeln." accent="orange" /></div>
        <div className="mt-16 grid auto-rows-[minmax(20rem,auto)] gap-5 lg:grid-cols-12">
          {projects.map((project, index) => (
            <article key={project.slug} style={{ "--project-accent": project.accent } as CSSProperties} className={`project-card pattern-${project.pattern} group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#091d2c] transition duration-300 hover:-translate-y-1 hover:border-[var(--project-accent)] focus-within:border-[var(--project-accent)] ${project.featured ? "lg:col-span-7" : "lg:col-span-5"}`}>
              <Link href={`/projects/${project.slug}`} aria-label={`${project.name} – Projektseite öffnen`} className="flex h-full min-h-80 flex-col p-7 focus:outline-none sm:p-9">
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <span className="grid h-14 min-w-14 place-items-center rounded-2xl border border-[var(--project-accent)]/50 bg-black/15 px-3 font-mono text-sm font-black tracking-widest text-[var(--project-accent)]">{project.monogram}</span>
                  <span className="rounded-full border border-white/15 bg-[#061521]/75 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-200">{project.status}</span>
                </div>
                <div className="relative z-10 mt-auto max-w-2xl pt-16">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--project-accent)]">0{index + 1} / {project.category}</p>
                  <h3 className={`mt-4 font-black tracking-tight text-white ${project.featured ? "text-4xl sm:text-5xl" : "text-3xl"}`}>{project.name}</h3>
                  <p className="mt-3 text-lg font-bold text-white">{project.pitch}</p>
                  <p className="mt-4 max-w-xl leading-7 text-slate-300">{project.description}</p>
                  <span className="mt-7 inline-flex items-center font-bold text-[var(--project-accent)]">Enter project <span aria-hidden="true" className="ml-2 transition group-hover:translate-x-1">↗</span></span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
