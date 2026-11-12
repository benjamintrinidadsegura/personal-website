"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { labCopy } from "@/data/experience-lab/copy";
import { createLabSearch, labKinds, relatedLabItems, type LabKind, type LabItem } from "@/lib/experience-lab/search";
import { composeLabSpace, labConnection } from "@/lib/experience-lab/space";
import { localeDetails, type Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import styles from "./experience-lab.module.css";

type Perspective = { query: string; kind: LabKind | "all"; selectedId: string };
const initial: Perspective = { query: "", kind: "all", selectedId: "personal-advantage" };

export function ExperienceLab({ catalog, locale }: { catalog: readonly LabItem[]; locale: Locale }) {
  const copy = labCopy[locale];
  const [perspective, setPerspective] = useState<Perspective>(initial);
  const search = useMemo(() => createLabSearch(catalog), [catalog]);
  const unfiltered = useMemo(() => search(perspective.query), [search, perspective.query]);
  const matches = useMemo(() => unfiltered.filter(({ item }) => perspective.kind === "all" || item.kind === perspective.kind), [unfiltered, perspective.kind]);
  const active = matches.find(({ item }) => item.id === perspective.selectedId)?.item ?? matches[0]?.item;
  const scene = composeLabSpace(matches, active?.id ?? "");
  const related = active ? relatedLabItems(active, catalog) : [];
  const space = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; captured: boolean } | null>(null);
  const didDrag = useRef(false);
  const resultKey = scene.nodes.map(({ item }) => item.id).join("|");
  const select = (id: string) => setPerspective(current => ({ ...current, selectedId: id }));
  const move = (index: number, focus = false) => {
    const item = matches[index]?.item;
    if (!item) return;
    select(item.id);
    if (focus) requestAnimationFrame(() => space.current?.querySelector<HTMLButtonElement>('[data-lab-card="' + item.id + '"] button')?.focus());
  };
  const onNodeKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? matches.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    move(next, true);
  };
  const startGesture = (event: PointerEvent<HTMLDivElement>) => {
    didDrag.current = false;
    const control = (event.target as Element).closest("button,a,input,label");
    if (event.button !== 0 || (control && !control.hasAttribute("data-space-node"))) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, captured: false };
  };
  const dragGesture = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.captured && Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      start.captured = true;
      didDrag.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (start.captured) event.currentTarget.style.setProperty("--gesture", Math.max(-24, Math.min(24, dx * .15)) + "px");
  };
  const endGesture = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const start = gesture.current;
    gesture.current = null;
    event.currentTarget.style.removeProperty("--gesture");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && start?.captured && Math.abs(event.clientX - start.x) > 45) move(scene.selectedIndex + (event.clientX < start.x ? 1 : -1));
  };

  return (
    <article className={styles.lab} aria-labelledby="lab-title">
      <div className={styles.topline}>
        <span className={styles.prototype}>{copy.prototype} <span>02</span></span>
        <Link href={localizeHref("/", locale)} prefetch={false}>BTSHQ <span aria-hidden="true">↗</span></Link>
      </div>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>BTSHQ · Mini Universe</p>
        <h1 id="lab-title">{copy.title.replace("\n", " ")}</h1>
        <p>{copy.subtitle}</p>
      </header>
      <div className={styles.resultBar}>
        <p id="lab-results-status" role="status">{matches.length} {copy.results}</p>
        <button type="button" onClick={() => setPerspective(initial)}>{copy.reset} <span aria-hidden="true">↺</span></button>
      </div>
      <div ref={space} className={styles.space} data-count={scene.nodes.length} data-searching={Boolean(perspective.query.trim())}
        onClickCapture={event => {
          if (didDrag.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); }
          didDrag.current = false;
        }}
        onPointerDown={startGesture} onPointerMove={dragGesture} onPointerUp={event => endGesture(event)} onPointerCancel={event => endGesture(event, true)}>
        <div className={styles.atmosphere} aria-hidden="true"><i /><i /><i /></div>
        <svg className={styles.connections} viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" key={"wide-" + resultKey}>
          {scene.nodes.map(node => <path key={node.item.id} d={labConnection(node.desktop)} data-active={node.item.id === active?.id} />)}
        </svg>
        <svg className={styles.compactConnections} viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" key={"compact-" + resultKey}>
          {scene.nodes.map(node => <path key={node.item.id} d={labConnection(node.compact, true)} data-active={node.item.id === active?.id} />)}
        </svg>
        <section className={styles.center} aria-label={copy.search}>
          <div className={styles.core} aria-hidden="true"><span /><span /></div>
          <label htmlFor="lab-search" className={styles.searchLabel}>{copy.search}</label>
          <div className={styles.searchSurface}>
            <span className={styles.searchIcon} aria-hidden="true">⌕</span>
            <input id="lab-search" type="search" maxLength={160} autoComplete="off" spellCheck={false}
              placeholder={copy.placeholder} value={perspective.query} aria-describedby="lab-results-status"
              onChange={event => setPerspective(current => ({ ...current, query: event.target.value, selectedId: "" }))} />
            {perspective.query ? <button type="button" onClick={() => setPerspective(current => ({ ...current, query: "", selectedId: initial.selectedId }))} aria-label={copy.clear}>×</button> : <span className={styles.inputStar} aria-hidden="true">✦</span>}
          </div>
          <div className={styles.categories} role="group" aria-label={copy.categories}>
            {(["all", ...labKinds] as const).map(kind => {
              const count = kind === "all" ? unfiltered.length : unfiltered.filter(({ item }) => item.kind === kind).length;
              const label = kind === "all" ? copy.all : copy.kinds[kind];
              return <button key={kind} type="button" aria-pressed={perspective.kind === kind} aria-label={label + " · " + count} data-available={count > 0}
                onClick={() => setPerspective(current => ({ ...current, kind, selectedId: "" }))}>
                {label}<span aria-hidden="true">{count}</span>
              </button>;
            })}
          </div>
          <p className={styles.sceneHint}>{copy.browse}</p>
        </section>
        {scene.nodes.length ? (
          <ul className={styles.nodes} aria-label={copy.results}>
            {scene.nodes.map(node => {
              const { item } = node, selected = item.id === active?.id;
              return <li data-lab-card={item.id} data-selected={selected} className={styles.nodePosition} key={item.id}
                style={{ "--dx": node.desktop.x - 50, "--dy": node.desktop.y - 44, "--mx": node.compact.x - 50, "--my": node.compact.y - 35, "--turn": node.turn + "deg", "--strength": node.strength } as CSSProperties}>
                <button type="button" data-space-node aria-pressed={selected} aria-controls="lab-detail"
                  aria-label={copy.select + " · " + item.title + " · " + (item.source === "demo" ? copy.demo : copy.kinds[item.kind])}
                  className={styles.node} data-kind={item.kind} onClick={() => select(item.id)} onKeyDown={event => onNodeKey(event, node.index)}>
                  <span className={styles.nodeTop}>
                    <span className={styles.nodeGlyph} aria-hidden="true">
                      {item.image ? <Image src={item.image.src} alt="" fill sizes="48px" /> : item.kind === "world" ? "◎" : item.kind === "writing" ? "Aa" : item.kind === "community" ? "◌" : item.kind === "project" ? "G" : item.kind === "idea" ? "✦" : "↟"}
                    </span>
                    <span className={styles.cardKind}>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</span>
                    <span className={styles.nodeLight} aria-hidden="true" />
                  </span>
                  <strong lang={item.language}>{item.title}</strong>
                  <span className={styles.nodeFoot}><span>{selected ? copy.details : copy.select}</span><span aria-hidden="true">{selected ? "↓" : "+"}</span></span>
                </button>
              </li>;
            })}
          </ul>
        ) : <div className={styles.empty}><h2>{copy.emptyTitle}</h2><p>{copy.emptyBody}</p><button type="button" onClick={() => setPerspective(initial)}>{copy.reset} ↗</button></div>}
      </div>
      {active ? <div className={styles.spaceControls}>
        <button type="button" aria-label={copy.previous} disabled={scene.selectedIndex <= 0} onClick={() => move(scene.selectedIndex - 1)}>←</button>
        <p><span aria-hidden="true">{scene.start + 1}–{scene.end} / {matches.length}</span><span id="lab-selection-status" role="status">{copy.position} · {active.title}</span></p>
        <button type="button" aria-label={copy.next} disabled={scene.selectedIndex >= matches.length - 1} onClick={() => move(scene.selectedIndex + 1)}>→</button>
        <a href="#lab-detail">{copy.details} ↓</a>
      </div> : null}
      {active ? <section id="lab-detail" tabIndex={-1} aria-labelledby="lab-detail-title" className={styles.detail}>
        <div className={styles.detailCopy} key={active.id}>
          <p className={styles.eyebrow}>{copy.details} / {active.source === "demo" ? copy.demo : copy.kinds[active.kind]}</p>
          <h2 id="lab-detail-title" lang={active.language}>{active.title}</h2>
          <p lang={active.language} className={styles.summary}>{active.summary}</p>
          <p className={styles.source}>{active.source === "demo" ? copy.demo : copy.public} · {copy.source} {localeDetails[active.language].languageName}</p>
          {active.source === "public" ? <Link className={styles.open} href={active.href} prefetch={false}>{copy.open}<span aria-hidden="true">↗</span></Link> : null}
        </div>
        {related.length ? <aside className={styles.related} aria-labelledby="lab-related-title">
          <h3 id="lab-related-title">{copy.related}</h3>
          {related.map(item => <button key={item.id} type="button" onClick={() => {
            setPerspective({ query: "", kind: "all", selectedId: item.id });
            requestAnimationFrame(() => document.getElementById("lab-detail")?.focus({ preventScroll: true }));
          }}>
            <span><small>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</small><strong lang={item.language}>{item.title}</strong></span><span aria-hidden="true">↗</span>
          </button>)}
        </aside> : null}
      </section> : null}
      <p className={styles.privacy}>{copy.privacy}</p>
    </article>
  );
}
