import Image from "next/image";

export interface HumanContextSceneData {
  src: string;
  eyebrow: string;
  title: string;
  description: string;
  alt: string;
}

export function HumanContextScene({ scene, accent, priority = false }: { scene: HumanContextSceneData; accent: string; priority?: boolean }) {
  return (
    <figure className="grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#061521]/80 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="relative aspect-video overflow-hidden">
        <Image src={scene.src} alt={scene.alt} width={1600} height={900} priority={priority} sizes="(min-width: 1024px) 65vw, 100vw" className="h-full w-full object-cover" />
      </div>
      <figcaption className="flex flex-col justify-center border-t border-white/10 p-7 lg:border-l lg:border-t-0 lg:p-9">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{scene.eyebrow}</p>
        <h2 className="mt-5 text-2xl font-black text-white">{scene.title}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-400">{scene.description}</p>
      </figcaption>
    </figure>
  );
}
