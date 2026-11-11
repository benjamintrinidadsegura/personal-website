"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

import { labCopy } from "@/data/experience-lab/copy";
import { createLabSearch, labKinds, relatedLabItems, type LabItem, type LabKind } from "@/lib/experience-lab/search";
import { localeDetails, type Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import styles from "./experience-lab.module.css";

type Perspective = { query: string; kind: LabKind | "all"; selectedId: string };
const initial: Perspective = { query: "", kind: "all", selectedId: "personal-advantage" };

function CardVisual({ item }: { item: LabItem }) {
  return (
    <div className={styles.visual} data-kind={item.kind} aria-hidden="true">
      {item.image ? (
        <Image src={item.image.src} alt="" fill sizes="224px" className={styles.image} />
      ) : <div className={styles.constellation}><i /><i /><i /><i /><i /></div>}
      <span className={styles.visualName}>{item.kind === "world" ? "World Map" : item.kind === "project" ? "GOAT" : item.kind === "community" ? "Echo" : item.kind === "tool" ? "You." : "Aa"}</span>
    </div>
  );
}

export function ExperienceLab({ catalog, locale }: { catalog: readonly LabItem[]; locale: Locale }) {
  const copy = labCopy[locale];
  const [perspective, setPerspective] = useState<Perspective>(initial);
  const search = useMemo(() => createLabSearch(catalog), [catalog]);
  const matches = useMemo(() => search(perspective.query, perspective.kind), [search, perspective.query, perspective.kind]);
  const active = matches.find(({ item }) => item.id === perspective.selectedId)?.item ?? matches[0]?.item;
  const activeIndex = matches.findIndex(({ item }) => item.id === active?.id);
  const related = useMemo(() => active ? relatedLabItems(active, catalog) : [], [active, catalog]);
  const resultKey = matches.map(({ item }) => item.id).join("|");
  const rail = useRef<HTMLUListElement>(null);
  const drag = useRef<{ id: number; startX: number; startScroll: number } | null>(null);
  const didDrag = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const centerCard = useCallback((id: string) => {
    const viewport = rail.current;
    const card = viewport?.querySelector<HTMLElement>('[data-lab-card="' + id + '"]');
    if (!viewport || !card) return;
    viewport.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - viewport.clientWidth / 2 });
  }, []);

  useEffect(() => {
    if (active) centerCard(active.id);
  }, [active, resultKey, centerCard]);

  useEffect(() => () => clearTimeout(settle.current), []);

  const select = (id: string) => setPerspective(current => ({ ...current, selectedId: id }));
  const move = (index: number, focus = false) => {
    const match = matches[index];
    if (!match) return;
    select(match.item.id);
    if (focus) requestAnimationFrame(() => rail.current?.querySelector<HTMLButtonElement>('[data-lab-card="' + match.item.id + '"] button')?.focus({ preventScroll: true }));
  };

  const onCardKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? matches.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    move(next, true);
  };

  const pointerStart = (event: PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    didDrag.current = false;
    drag.current = { id: event.pointerId, startX: event.clientX, startScroll: event.currentTarget.scrollLeft };
  };
  const pointerMove = (event: PointerEvent<HTMLUListElement>) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const distance = event.clientX - start.startX;
    if (Math.abs(distance) < 7 && !didDrag.current) return;
    didDrag.current = true;
    event.currentTarget.dataset.dragging = "true";
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.scrollLeft = start.startScroll - distance;
  };
  const pointerEnd = (event: PointerEvent<HTMLUListElement>) => {
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const settleSelection = () => {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const viewport = rail.current;
      if (!viewport) return;
      const middle = viewport.scrollLeft + viewport.clientWidth / 2;
      const cards = [...viewport.querySelectorAll<HTMLElement>("[data-lab-card]")];
      const closest = cards.reduce<HTMLElement | null>((best, card) => (
        !best || Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - middle) ? card : best
      ), null);
      if (closest?.dataset.labCard) setPerspective(current => ({ ...current, selectedId: closest.dataset.labCard! }));
    }, 160);
  };

  return (
    <article className={styles.lab} aria-labelledby="lab-title">
      <div className={styles.shell}>
        <div className={styles.topline}>
          <span className={styles.prototype}>{copy.prototype}</span>
          <Link href={localizeHref("/", locale)} prefetch={false} className={styles.home}>BTSHQ <span aria-hidden="true">↗</span></Link>
        </div>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>BTSHQ · Blue Liquid Universe</p>
          <h1 id="lab-title">{copy.title.split("\n").map((line, index) => <span key={line} className={index === 1 ? styles.titleAccent : undefined}>{line}</span>)}</h1>
          <p className={styles.subtitle}>{copy.subtitle}</p>
        </header>

        <section className={styles.searchSection} aria-label={copy.search}>
          <label htmlFor="lab-search" className={styles.searchLabel}>{copy.search}</label>
          <div className={styles.searchSurface}>
            <span className={styles.searchIcon} aria-hidden="true">⌕</span>
            <input id="lab-search" type="search" maxLength={160} autoComplete="off" spellCheck={false}
              placeholder={copy.placeholder} value={perspective.query} aria-describedby="lab-results-status"
              onChange={event => setPerspective(current => ({ ...current, query: event.target.value, selectedId: "" }))} />
            {perspective.query ? <button type="button" onClick={() => setPerspective(current => ({ ...current, query: "", selectedId: initial.selectedId }))} aria-label={copy.clear}>×</button> : null}
          </div>
          <div className={styles.categories} role="group" aria-label={copy.categories}>
            {(["all", ...labKinds] as const).map(kind => (
              <button key={kind} type="button" aria-pressed={perspective.kind === kind}
                onClick={() => setPerspective(current => ({ ...current, kind, selectedId: "" }))}>
                {kind === "all" ? copy.all : copy.kinds[kind]}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.universe} aria-labelledby="lab-results-status">
          <div className={styles.orbit} aria-hidden="true" />
          <div className={styles.resultBar}>
            <p id="lab-results-status" role="status">{matches.length} {copy.results}</p>
            <button type="button" onClick={() => setPerspective(initial)} className={styles.reset}>{copy.reset}<span aria-hidden="true">↺</span></button>
          </div>
          {matches.length ? (
            <>
              <ul ref={rail} className={styles.rail} aria-label={copy.browse} onScroll={settleSelection}
                onPointerDown={pointerStart} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={event => { pointerEnd(event); didDrag.current = false; }}
                onClickCapture={event => {
                  if (didDrag.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); }
                  didDrag.current = false;
                }}>
                {matches.map(({ item }, index) => (
                  <li key={item.id} data-lab-card={item.id} className={styles.cardSlot}
                    style={{ "--turn": Math.max(-2, Math.min(2, index - activeIndex)) * -5 + "deg", "--lift": Math.min(2, Math.abs(index - activeIndex)) * 10 + "px" } as CSSProperties}>
                    <button type="button" aria-pressed={item.id === active?.id} aria-controls="lab-detail"
                      aria-label={copy.select + " · " + item.title + " · " + (item.source === "demo" ? copy.demo : copy.kinds[item.kind])}
                      className={styles.card} onClick={() => select(item.id)} onKeyDown={event => onCardKey(event, index)}>
                      <CardVisual item={item} />
                      <span className={styles.cardBody}>
                        <span className={styles.cardKind}>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</span>
                        <strong lang={item.language}>{item.title}</strong>
                      </span>
                      <span className={styles.cardArrow} aria-hidden="true">↘</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className={styles.deckControls}>
                <button type="button" aria-label={copy.previous} disabled={activeIndex <= 0} onClick={() => move(activeIndex - 1)}>←</button>
                <p className={styles.orientation}>{copy.browse}</p>
                <button type="button" aria-label={copy.next} disabled={activeIndex >= matches.length - 1} onClick={() => move(activeIndex + 1)}>→</button>
              </div>
              <p className={styles.selectionStatus} role="status">{copy.position} · {active?.title}</p>
            </>
          ) : (
            <div className={styles.empty}>
              <h2>{copy.emptyTitle}</h2><p>{copy.emptyBody}</p>
              <button type="button" onClick={() => setPerspective(initial)}>{copy.reset} <span aria-hidden="true">↗</span></button>
            </div>
          )}
        </section>

        {active ? (
          <section id="lab-detail" aria-labelledby="lab-detail-title" className={styles.detail}>
            <div className={styles.detailCopy} key={active.id}>
              <p className={styles.eyebrow}>{copy.details} <span aria-hidden="true">/</span> {active.source === "demo" ? copy.demo : copy.kinds[active.kind]}</p>
              <h2 id="lab-detail-title" lang={active.language}>{active.title}</h2>
              <p lang={active.language} className={styles.summary}>{active.summary}</p>
              <p className={styles.source}>{active.source === "demo" ? copy.demo : copy.public} · {copy.source} {localeDetails[active.language].languageName}</p>
              {active.source === "public" ? <Link className={styles.open} href={active.href} prefetch={false}>{copy.open}<span aria-hidden="true">↗</span></Link> : null}
            </div>
            {related.length ? (
              <aside className={styles.related} aria-labelledby="lab-related-title">
                <h3 id="lab-related-title">{copy.related}</h3>
                {related.map(item => (
                  <button key={item.id} type="button" onClick={() => setPerspective({ query: "", kind: "all", selectedId: item.id })}>
                    <span><small>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</small><strong lang={item.language}>{item.title}</strong></span>
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </aside>
            ) : null}
          </section>
        ) : null}
        <p className={styles.privacy}>{copy.privacy}</p>
      </div>
    </article>
  );
}
