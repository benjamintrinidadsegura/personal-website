import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ResolvedArtworkImage } from "@/components/nerd-corner/resolved-artwork-image";
import { getNerdCornerCopy } from "@/data/i18n/nerd-corner";
import { getGlobalDictionary } from "@/data/i18n/global";
import {
  currentlyIntoArtists,
  currentlyIntoSeries,
  currentlyIntoSongs,
  currentlyPlaying,
  currentlyReading,
  favoriteArtists,
  favoriteBooks,
  favoriteMovies,
  favoriteSeries,
  getResolvedTasteArtwork,
  type TasteItem,
} from "@/data/nerd-corner";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getNerdCornerCopy(locale);
  return createLocalizedMetadata({ locale, pathname: "/about/nerd-corner", title: copy.title, description: copy.description });
}

function monogram(title: string) {
  return title.split(/\s+/u).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase();
}

const tmdbRequiredNotice = "This product uses the TMDB API but is not endorsed or certified by TMDB.";

function EditorialCover({ item, fallbackLabel, accent = "cyan" }: { item: TasteItem; fallbackLabel: string; accent?: "cyan" | "orange" | "violet" }) {
  const accentClass = accent === "orange" ? "text-[#ffb36b]" : accent === "violet" ? "text-[#c8bbff]" : "text-[#78e6f2]";
  const artwork = getResolvedTasteArtwork(item);
  const fallback = (
    <div className="absolute inset-0 flex flex-col justify-between bg-[radial-gradient(circle_at_75%_15%,rgba(53,208,229,0.17),transparent_35%),linear-gradient(145deg,rgba(255,255,255,0.035),transparent_55%)] p-5">
      <span aria-hidden="true" className={`font-mono text-5xl font-black tracking-[-0.09em] ${accentClass}`}>{monogram(item.title)}</span>
      <span className="max-w-[18ch] font-mono text-[9px] font-bold uppercase leading-4 tracking-[0.13em] text-slate-500">{fallbackLabel}</span>
    </div>
  );
  return (
    <div className="relative aspect-[4/5] overflow-hidden border border-white/12 bg-[#06141e]" data-artwork={artwork ? "resolved" : "fallback"}>
      {artwork ? (
        <ResolvedArtworkImage src={artwork.src} alt={artwork.alt} sizes="(max-width: 640px) 70vw, 22vw" className="bg-[#06141e] object-contain">{fallback}</ResolvedArtworkImage>
      ) : fallback}
    </div>
  );
}

const artworkMarkSizes = {
  default: { className: "size-12", sizes: "48px" },
  watching: { className: "h-20 w-14 sm:h-24 sm:w-16", sizes: "(min-width: 640px) 64px, 56px" },
  favoriteSeries: { className: "h-20 w-[3.25rem] sm:w-14", sizes: "(min-width: 640px) 56px, 52px" },
  game: { className: "h-24 w-16 sm:h-28 sm:w-[4.75rem]", sizes: "(min-width: 640px) 76px, 64px" },
} as const;

function ArtworkMark({ item, variant = "default" }: { item: TasteItem; variant?: keyof typeof artworkMarkSizes }) {
  const artwork = getResolvedTasteArtwork(item);
  const fallback = <span aria-hidden="true">{monogram(item.title)}</span>;
  const size = artworkMarkSizes[variant];
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden border border-white/15 bg-[#06141e] font-mono text-xs font-black text-[#78e6f2] ${size.className}`} data-artwork={artwork ? "resolved" : "fallback"}>
      {artwork
        ? <ResolvedArtworkImage src={artwork.src} alt={artwork.alt} sizes={size.sizes} className="bg-[#06141e] object-contain">{fallback}</ResolvedArtworkImage>
        : fallback}
    </span>
  );
}

function FormatLabel({ item, label }: { item: TasteItem; label: string }) {
  return <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#35d0e5]">{label}{item.format === "anime" ? " · Anime" : ""}</span>;
}

export default async function NerdCornerPage() {
  const locale = await getLocale();
  const copy = getNerdCornerCopy(locale);
  const globalCopy = getGlobalDictionary(locale);

  return (
    <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[68rem] bg-[radial-gradient(circle_at_80%_8%,rgba(184,165,255,0.16),transparent_28rem),radial-gradient(circle_at_12%_35%,rgba(53,208,229,0.13),transparent_26rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={localizeHref("/about", locale)} className="inline-flex min-h-11 items-center hover:text-white">About</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#35d0e5]">{copy.breadcrumb}</li>
          </ol>
        </nav>

        <header className="grid min-h-[70svh] items-end gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-[#ff9a3d]">{copy.eyebrow}</p>
            <h1 className="mt-7 text-[clamp(3rem,5.8vw,5.8rem)] font-black leading-[0.86] tracking-[-0.06em] text-white">{copy.heroTitle}</h1>
          </div>
          <div className="border-l-2 border-[#35d0e5] pl-7 sm:pl-9">
            <p className="max-w-2xl text-2xl font-black leading-snug text-white sm:text-4xl">{copy.heroDescription}</p>
            <p className="mt-7 max-w-xl text-sm leading-7 text-slate-400">{copy.curatedNote}</p>
          </div>
        </header>

        <section aria-labelledby="currently-into-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.34fr_1fr]">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">01 / Now</p>
              <h2 id="currently-into-title" className="mt-5 text-5xl font-black tracking-[-0.05em] text-white sm:text-7xl">{copy.currentlyInto}</h2>
              <p className="mt-6 max-w-sm leading-7 text-slate-400">{copy.currentlyIntoDescription}</p>
            </div>
            <ol className="grid border-l border-t border-white/10 sm:grid-cols-2 xl:grid-cols-3">
              {currentlyIntoSeries.map((item, index) => (
                <li key={item.id} className="group min-h-56 border-b border-r border-white/10 p-6 transition-colors hover:bg-white/[0.025] sm:p-8">
                  <div className="flex items-start justify-between gap-4"><span className="font-mono text-xs text-slate-600">{String(index + 1).padStart(2, "0")}</span><FormatLabel item={item} label={copy.formats.series} /></div>
                  <div className="mt-9 flex items-end gap-4"><ArtworkMark item={item} variant="watching" /><h3 className="max-w-[12ch] text-2xl font-black leading-[1.02] tracking-[-0.035em] text-white sm:text-3xl">{item.title}</h3></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="favorites-title" className="border-b border-white/15 py-20 sm:py-28">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">02 / Archive</p>
          <h2 id="favorites-title" className="mt-5 text-5xl font-black tracking-[-0.05em] text-white sm:text-7xl">{copy.favorites}</h2>
          <div className="mt-14 grid gap-16 xl:grid-cols-[0.9fr_1.1fr]">
            <section aria-labelledby="favorite-movies-title">
              <h3 id="favorite-movies-title" className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#35d0e5]">{copy.favoriteMovies}</h3>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {favoriteMovies.map((item, index) => (
                  <article key={item.id} className={index === 0 ? "col-span-2 sm:col-span-1" : ""}>
                    <EditorialCover item={item} fallbackLabel={copy.artworkFallback} accent={index === 0 ? "violet" : "cyan"} />
                    <FormatLabel item={item} label={item.format === "anime" ? copy.formats.series : copy.formats[item.format]} />
                    <h4 className="mt-2 text-xl font-black leading-tight text-white">{item.title}</h4>
                  </article>
                ))}
              </div>
            </section>
            <section aria-labelledby="favorite-series-title">
              <h3 id="favorite-series-title" className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ff9a3d]">{copy.favoriteSeries}</h3>
              <ol className="mt-6 border-t border-white/15">
                {favoriteSeries.map((item, index) => (
                  <li key={item.id} className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-4 border-b border-white/10 py-5 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
                    <span className="font-mono text-xs text-slate-600">{String(index + 1).padStart(2, "0")}</span>
                    <ArtworkMark item={item} variant="favoriteSeries" />
                    <span className="text-xl font-black text-white sm:text-2xl">{item.title}</span>
                    <span className="col-span-3 sm:col-span-1"><FormatLabel item={item} label={item.format === "anime" ? copy.formats.series : copy.formats[item.format]} /></span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </section>

        <section aria-labelledby="reading-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#071824]/80 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#c8bbff]">03 / {copy.books}</p>
              <h2 id="reading-title" className="mt-6 text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">{copy.currentlyReading}</h2>
              <p className="mt-5 leading-7 text-slate-400">{copy.currentlyReadingDescription}</p>
              <div className="mt-16 flex items-start gap-5"><ArtworkMark item={currentlyReading} /><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-[#35d0e5]">{currentlyReading.creator}</p><h3 className="mt-4 max-w-[15ch] text-3xl font-black leading-[1.05] text-white sm:text-5xl">{currentlyReading.title}</h3></div></div>
            </div>
            <div className="border-t border-white/10 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <h3 className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ff9a3d]">{copy.favoriteBooks}</h3>
              <ol className="mt-8 space-y-5">
                {favoriteBooks.map((book, index) => (
                  <li key={book.id} className="grid gap-4 border-l-2 border-white/15 py-3 pl-5 sm:grid-cols-[auto_1fr] sm:items-start sm:pl-7">
                    <span className="font-mono text-xs text-slate-600">0{index + 1}</span>
                    <div className="flex items-start gap-4"><ArtworkMark item={book} /><div><p className="text-2xl font-black leading-tight text-white sm:text-3xl">{book.title}</p><p className="mt-2 text-sm font-bold text-slate-400">{book.creator}</p></div></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section aria-labelledby="playing-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.42fr_1fr]">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">04 / Play</p>
              <h2 id="playing-title" className="mt-5 text-5xl font-black tracking-[-0.05em] text-white sm:text-7xl">{copy.currentlyPlaying}</h2>
              <p className="mt-6 max-w-sm leading-7 text-slate-400">{copy.currentlyPlayingDescription}</p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {currentlyPlaying.map((game, index) => (
                <li key={game.id} className={`relative min-h-64 overflow-hidden border border-white/10 p-7 ${index % 3 === 1 ? "bg-[#35d0e5]/[0.045] sm:translate-y-8" : "bg-[#071824]/60"}`}>
                  <span aria-hidden="true" className="absolute -right-3 -top-8 font-mono text-[8rem] font-black tracking-[-0.1em] text-white/[0.035]">0{index + 1}</span>
                  <div className="relative"><FormatLabel item={game} label={copy.formats.game} /></div>
                  <div className="absolute right-7 top-7"><ArtworkMark item={game} variant="game" /></div>
                  <h3 className="relative mt-28 max-w-[13ch] text-3xl font-black leading-[0.98] tracking-[-0.04em] text-white">{game.title}</h3>
                </li>
              ))}
            </ol>
          </div>
          <aside aria-labelledby="lobbify-title" className="ml-auto mt-12 max-w-4xl border-l border-[#35d0e5]/35 py-1 pl-6 sm:pl-8">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#35d0e5]">{copy.lobbifyEyebrow}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[0.72fr_1.28fr] sm:gap-8">
              <h3 id="lobbify-title" className="text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">{copy.lobbifyTitle}</h3>
              <div>
                <p className="leading-7 text-slate-300">{copy.lobbifyDescription}</p>
                <p className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.lobbifyPrinciple}</p>
              </div>
            </div>
          </aside>
        </section>

        <section aria-labelledby="music-title" className="border-b border-white/15 py-20 sm:py-28">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">05 / Sound</p>
          <h2 id="music-title" className="mt-5 text-5xl font-black tracking-[-0.05em] text-white sm:text-7xl">{copy.music}</h2>
          <div className="mt-14 grid gap-14 lg:grid-cols-2">
            <section aria-labelledby="current-artists-title">
              <h3 id="current-artists-title" className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#35d0e5]">{copy.currentlyIntoArtists}</h3>
              <ul className="mt-7 flex flex-wrap gap-3">
                {currentlyIntoArtists.map((artist) => <li key={artist.id} className="flex items-center gap-3 rounded-full border border-[#35d0e5]/35 bg-[#35d0e5]/[0.055] py-2 pl-2 pr-5 text-lg font-black text-white"><ArtworkMark item={artist} />{artist.title}</li>)}
              </ul>
              <h3 className="mt-12 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#c8bbff]">{copy.favoriteArtists}</h3>
              <ul className="mt-6 grid grid-cols-2 border-l border-t border-white/10 sm:grid-cols-3">
                {favoriteArtists.map((artist) => <li key={artist.id} className="flex items-center gap-3 border-b border-r border-white/10 p-4 font-bold text-slate-200 sm:p-5"><ArtworkMark item={artist} /><span>{artist.title}</span></li>)}
              </ul>
            </section>
            <section aria-labelledby="songs-title">
              <h3 id="songs-title" className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ff9a3d]">{copy.songs}</h3>
              <ol className="mt-7 border-t border-white/15">
                {currentlyIntoSongs.map((song, index) => (
                  <li key={song.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-5 border-b border-white/10 py-6">
                    <span className="font-mono text-xs text-slate-600">0{index + 1}</span>
                    <div className="flex items-start gap-4"><ArtworkMark item={song} /><div><p className="text-2xl font-black text-white">{song.title}</p><p className="mt-2 text-sm font-bold text-[#35d0e5]">{song.creator}</p></div></div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </section>

        <section aria-labelledby="streamory-title" className="py-20 sm:py-28">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#c8bbff]/25 bg-[#071824] p-8 sm:p-12 lg:p-16">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(184,165,255,0.2),transparent_25rem),radial-gradient(circle_at_14%_90%,rgba(53,208,229,0.12),transparent_23rem)]" />
            <div className="relative grid gap-12 lg:grid-cols-[0.55fr_1fr] lg:items-end">
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#c8bbff]">06 / {copy.streamoryEyebrow}</p>
              <div>
                <h2 id="streamory-title" className="max-w-4xl text-4xl font-black leading-[0.96] tracking-[-0.045em] text-white sm:text-6xl">{copy.streamoryTitle}</h2>
                <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{copy.streamoryDescription}</p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <span aria-disabled="true" className="inline-flex min-h-12 cursor-not-allowed items-center rounded-full border border-white/15 px-6 py-3 font-black text-slate-500">{copy.streamoryCta} · {copy.streamoryStatus}</span>
                  <Link href={localizeHref("/projects/streamory", locale)} className="inline-flex min-h-12 items-center rounded-full bg-[#c8bbff] px-6 py-3 font-black text-[#07111a] transition hover:-translate-y-0.5 hover:bg-white">{copy.streamoryProject} →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside aria-labelledby="media-credits-title" className="border-t border-white/10 py-10 text-sm text-slate-500">
          <h2 id="media-credits-title" className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{copy.mediaCreditsTitle}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <section aria-label="TMDB credit">
              <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="inline-flex flex-col items-start gap-2 font-bold text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white">
                <span aria-hidden="true" className="relative block aspect-[273.42/35.52] w-32 sm:w-36"><Image src="/brand/providers/tmdb-alt-short-blue.svg" alt="" fill sizes="(min-width: 640px) 144px, 128px" className="object-contain" unoptimized /></span>
                <span>TMDB / The Movie Database <span aria-hidden="true">↗</span></span>
              </a>
              <p lang="en" className="mt-2 max-w-xl leading-6">{tmdbRequiredNotice}</p>
            </section>
            <section aria-label="IGDB credit">
              <a href="https://www.igdb.com" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white">IGDB <span aria-hidden="true">↗</span></a>
              <p className="mt-2 max-w-xl leading-6">{copy.igdbCredit}</p>
            </section>
          </div>
        </aside>
      </div>
    </article>
  );
}
