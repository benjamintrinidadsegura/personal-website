"use client";

export default function LifeAlignmentSelfError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto min-h-[70svh] max-w-3xl px-5 pb-24 pt-36 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">Life Alignment · Self</p>
      <h1 className="mt-5 text-4xl font-black text-white">Die Momentaufnahme konnte nicht angezeigt werden.</h1>
      <p className="mt-5 leading-7 text-slate-300">Deine Eingaben wurden nur im aktuellen Seitenzustand gehalten. Du kannst den Abschnitt erneut laden oder neu beginnen.</p>
      <button type="button" onClick={reset} className="mt-8 min-h-12 rounded-full bg-[#f5b971] px-6 font-black text-[#07131d]">Erneut versuchen</button>
    </section>
  );
}
