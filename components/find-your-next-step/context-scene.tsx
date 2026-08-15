import Image from "next/image";

import type { FynsContextScene } from "@/data/find-your-next-step-figures";

export function ContextScene({ scene, priority = false }: { scene: FynsContextScene; priority?: boolean }) {
  return (
    <figure
      data-fyns-context-scene={scene.key}
      className="grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#061521]/80 lg:grid-cols-[1.35fr_0.65fr]"
    >
      <div className="relative aspect-video min-h-0 overflow-hidden">
        <Image
          src={scene.src}
          alt={scene.alt}
          width={1600}
          height={900}
          priority={priority}
          sizes="(min-width: 1024px) 65vw, 100vw"
          className="h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#041018]/35 via-transparent to-transparent" />
      </div>
      <figcaption className="flex flex-col justify-center border-t border-white/10 p-7 lg:border-l lg:border-t-0 lg:p-9">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--journey-accent,#35d0e5)]">
          {scene.eyebrow}
        </p>
        <h2 className="mt-5 text-2xl font-black leading-tight tracking-[-0.025em] text-white">{scene.title}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-400">{scene.description}</p>
      </figcaption>
    </figure>
  );
}
