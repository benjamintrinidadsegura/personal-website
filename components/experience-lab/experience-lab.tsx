"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { labCopy } from "@/data/experience-lab/copy";
import { createLabSearch, labKinds, relatedLabItems, type LabKind, type LabItem } from "@/lib/experience-lab/search";
import { composeLabSpace, type MotionPoint } from "@/lib/experience-lab/space";
import { localeDetails, type Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import { startLabMotion, type LabMotion } from "@/lib/experience-lab/motion";
import { IslandVisual } from "./island-visual";
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
  const scene = useMemo(() => composeLabSpace(matches, active?.id ?? ""), [matches, active?.id]);
  const related = active ? relatedLabItems(active, catalog) : [];
  const space = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; captured: boolean } | null>(null);
  const didDrag = useRef(false);
  const motion = useRef<LabMotion | null>(null);
  const positions = useRef(new Map<string, MotionPoint>());
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!space.current) return;
    const currentMotion = startLabMotion(space.current, scene, positions.current);
    motion.current = currentMotion;
    let focusFrame = 0;
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target && scene.nodes.some(node => node.item.id === target && node.index === scene.selectedIndex)) {
      currentMotion.finish();
      // Let the browser finish retiring the old inert focus target first.
      let attempts = 0;
      const focusVisibleTarget = () => {
        const button = space.current?.querySelector<HTMLButtonElement>('[data-lab-card="' + target + '"] button');
        if (!button) return;
        if (getComputedStyle(button).visibility === "visible") button.focus();
        if (document.activeElement !== button && ++attempts < 4) focusFrame = requestAnimationFrame(focusVisibleTarget);
      };
      focusFrame = requestAnimationFrame(focusVisibleTarget);
    }
    return () => { cancelAnimationFrame(focusFrame); currentMotion.stop(); };
  }, [scene]);
  const select = (id: string) => setPerspective(current => ({ ...current, selectedId: id }));
  const move = (index: number, focus = false) => {
    const item = matches[index]?.item;
    if (!item) return;
    if (focus && item.id !== active?.id) pendingFocus.current = item.id;
    select(item.id);
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
    if (start.captured) motion.current?.pan(Math.max(-32, Math.min(32, dx * .2)));
  };
  const endGesture = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const start = gesture.current;
    gesture.current = null;
    motion.current?.release();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && start?.captured && Math.abs(event.clientX - start.x) > 45) move(scene.selectedIndex + (event.clientX < start.x ? 1 : -1));
  };

  return (
    <article className={styles.lab} aria-labelledby="lab-title">
      <div className={styles.topline}>
        <span className={styles.prototype}>{copy.prototype} <span>2.5</span></span>
        <Link href={localizeHref("/", locale)} prefetch={false}>BTSHQ <span aria-hidden="true">↗</span></Link>
      </div>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>BTSHQ · Liquid Constellations</p>
        <h1 id="lab-title">{copy.title.replace("\n", " ")}</h1>
        <p>{copy.subtitle}</p>
      </header>
      <div className={styles.resultBar}>
        <details className={styles.resultList}>
          <summary>{copy.list} · {matches.length}</summary>
          <ul>{matches.map(({ item }) => <li key={item.id}><button type="button" onClick={() => {
            select(item.id);
            requestAnimationFrame(() => document.getElementById("lab-detail")?.focus());
          }}><span lang={item.language}>{item.title}</span><small>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</small></button></li>)}</ul>
        </details>
        <p id="lab-results-status" role="status">{matches.length} {copy.results}</p>
        <button type="button" onClick={() => setPerspective(initial)}>{copy.reset} <span aria-hidden="true">↺</span></button>
      </div>
      <div ref={space} className={styles.space} data-count={scene.nodes.length} data-solo={scene.nodes.length === 1} data-searching={Boolean(perspective.query.trim())}
        onClickCapture={event => {
          if (didDrag.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); }
          didDrag.current = false;
        }}
        onPointerDown={startGesture} onPointerMove={dragGesture} onPointerUp={event => endGesture(event)} onPointerCancel={event => endGesture(event, true)}>
        <div className={styles.atmosphere} aria-hidden="true"><i /><i /><i /></div>
        <div className={styles.selectionLight} aria-hidden="true" />
        <svg className={styles.connections} data-space-strings aria-hidden="true">
          {catalog.map(item => <path key={item.id} data-connection={item.id} data-active={item.id === active?.id}
            style={{ strokeOpacity: item.id === active?.id ? 1 : Math.max(.45,scene.nodes.find(node => node.item.id === item.id)?.strength ?? .45) }} />)}
        </svg>
        <section className={styles.center} aria-label={copy.search}>
          <div className={styles.core} aria-hidden="true"><span /><span /></div>
          <label htmlFor="lab-search" className={styles.searchLabel}>{copy.search}</label>
          <div className={styles.searchSurface} data-search-lens>
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
        <ul className={styles.nodes} aria-label={copy.results}>
          {catalog.map(item => {
            const node = scene.nodes.find(node => node.item.id === item.id);
            const selected = item.id === active?.id, visible = Boolean(node);
            return <li data-lab-object={item.id} data-lab-card={visible ? item.id : undefined} data-visible={visible} data-selected={selected}
              data-kind={item.kind} inert={!visible} aria-hidden={!visible} className={styles.nodePosition} key={item.id}
              style={{ visibility: visible ? "visible" : undefined, "--x": node?.desktop.x ?? 50, "--y": node?.desktop.y ?? 0, "--mx": node?.compact.x ?? 50, "--my": node?.compact.y ?? 0, "--turn": (node?.turn ?? 0) + "deg", "--strength": node?.strength ?? 0 } as CSSProperties}>
              <button type="button" data-space-node aria-pressed={selected} aria-controls={visible ? "lab-detail" : undefined} tabIndex={visible ? 0 : -1}
                aria-label={copy.select + " · " + item.title + " · " + (item.source === "demo" ? copy.demo : copy.kinds[item.kind])}
                className={styles.node} data-kind={item.kind} onClick={() => {
                  if (selected) requestAnimationFrame(() => document.getElementById("lab-detail")?.focus());
                  else select(item.id);
                }} onKeyDown={event => onNodeKey(event, node?.index ?? 0)}>
                <span className={styles.cardKind}>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</span>
                <IslandVisual item={item} />
                <strong lang={item.language}>{item.title}</strong>
                <span className={styles.nodeFoot}><span>{selected ? copy.details : copy.select}</span><span aria-hidden="true">{selected ? "↘" : "+"}</span></span>
              </button>
            </li>;
          })}
        </ul>
        {!scene.nodes.length ? <div className={styles.empty}><h2>{copy.emptyTitle}</h2><p>{copy.emptyBody}</p><button type="button" onClick={() => setPerspective(initial)}>{copy.reset} ↗</button></div> : null}
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
