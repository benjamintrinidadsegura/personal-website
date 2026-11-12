"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { labCopy } from "@/data/experience-lab/copy";
import { focusCopy } from "@/data/experience-lab/focus-copy";
import { createLabSearch, labKinds, relatedLabItems, type LabKind, type LabItem } from "@/lib/experience-lab/search";
import { composeLabSpace, labDirections, type LabDirection, type MotionPoint } from "@/lib/experience-lab/space";
import { labContext, sharedLabTopics } from "@/lib/experience-lab/context";
import { startLabMotion, type LabMotion } from "@/lib/experience-lab/motion";
import { type Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import { IslandVisual } from "./island-visual";
import { FocusSurface } from "./focus-surface";
import styles from "./experience-lab.module.css";

type Perspective = { query: string; kind: LabKind | "all"; selectedId: string };
const initial: Perspective = { query: "", kind: "all", selectedId: "personal-advantage" };

export function ExperienceLab({ catalog, locale }: { catalog: readonly LabItem[]; locale: Locale }) {
  const copy = labCopy[locale];
  const [perspective, setPerspective] = useState<Perspective>(initial);
  const [focused, setFocused] = useState(false);
  const [direction, setDirection] = useState<LabDirection>("atlas");
  const search = useMemo(() => createLabSearch(catalog), [catalog]);
  const unfiltered = useMemo(() => search(perspective.query), [search, perspective.query]);
  const matches = useMemo(() => unfiltered.filter(({ item }) => perspective.kind === "all" || item.kind === perspective.kind), [unfiltered, perspective.kind]);
  const active = matches.find(({ item }) => item.id === perspective.selectedId)?.item ?? matches[0]?.item;
  const scene = useMemo(() => composeLabSpace(matches, active?.id ?? "", focused, direction), [matches, active?.id, focused, direction]);
  const related = active ? relatedLabItems(active, matches.map(match => match.item)) : [];
  const activeMatch = matches.find(match => match.item.id === active?.id);
  const evidence = activeMatch ? labContext(activeMatch, perspective.query) : null;
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
    if (direction !== "atlas") currentMotion.finish();
    let focusFrame = 0;
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target) {
      if (target !== "@detail" && target !== "@search" && !target.startsWith("@restore:")) currentMotion.finish();
      let attempts = 0;
      const focusVisibleTarget = () => {
        const button = target === "@detail" ? document.getElementById("lab-detail")
          : target === "@search" ? document.getElementById("lab-search")
          : space.current?.querySelector<HTMLButtonElement>('[data-lab-card="' + target.replace("@restore:", "") + '"] button');
        if (!button) return;
        if (getComputedStyle(button).visibility === "visible") {
          button.focus({ preventScroll: target === "@detail" });
          if (target === "@detail" && typeof innerHeight === "number") {
            const field = document.getElementById("lab-search"), bounds = field?.getBoundingClientRect();
            if (bounds && (bounds.top < 85 || bounds.bottom > innerHeight - 8)) field?.scrollIntoView({ block:"center", behavior:"instant" });
          }
          if (target !== "@detail" && document.activeElement === button && typeof innerHeight === "number") {
            const bounds = button.getBoundingClientRect();
            if (bounds.top < 85 || bounds.bottom > innerHeight - 8) button.scrollIntoView({ block: "center", behavior: "instant" });
          }
        }
        if (document.activeElement !== button && ++attempts < 4) focusFrame = requestAnimationFrame(focusVisibleTarget);
      };
      focusFrame = requestAnimationFrame(focusVisibleTarget);
    }
    return () => { cancelAnimationFrame(focusFrame); currentMotion.stop(); };
  }, [scene, direction]);

  const select = (id: string) => setPerspective(current => ({ ...current, selectedId: id }));
  const enterFocus = (id: string) => {
    if (focused && active?.id === id) { document.getElementById("lab-detail")?.focus(); return; }
    pendingFocus.current = "@detail"; select(id); setFocused(true);
  };
  const leaveFocus = () => { pendingFocus.current = active ? "@restore:" + active.id : "@search"; setFocused(false); };
  const refine = () => { pendingFocus.current = "@search"; setFocused(false); };
  const reset = () => { setFocused(false); setPerspective(initial); };
  const move = (index: number, focus = false) => {
    const item = matches[index]?.item;
    if (!item) return;
    if (focus && item.id !== active?.id) pendingFocus.current = item.id;
    select(item.id);
  };
  const onNodeKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? matches.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); move(next, true);
  };
  const startGesture = (event: PointerEvent<HTMLDivElement>) => {
    didDrag.current = false;
    const control = (event.target as Element).closest("button,a,input,label,select,summary");
    if (event.button !== 0 || (control && !control.hasAttribute("data-space-node"))) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, captured: false };
  };
  const dragGesture = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.captured && Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      start.captured = true; didDrag.current = true; event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (start.captured) motion.current?.pan(Math.max(-32, Math.min(32, dx * .2)));
  };
  const endGesture = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const start = gesture.current; gesture.current = null; motion.current?.release();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && start?.captured && Math.abs(event.clientX - start.x) > 45) move(scene.selectedIndex + (event.clientX < start.x ? 1 : -1));
  };

  return <article className={styles.lab} data-direction={direction} data-locale={locale} data-focused={focused} aria-labelledby="lab-title"
    onKeyDown={event => { if (focused && event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); leaveFocus(); } }}>
    <div className={styles.topline}>
      <span className={styles.prototype}><span className={styles.srOnly}>{copy.prototype}</span>LAB 5.2</span>
      <label className={styles.directionLabel}><span className={styles.srOnly}>{copy.prototype}</span>
        <select id="lab-direction" value={direction} onChange={event => {
          const next = labDirections.find(value => value.id === event.target.value);
          if (!next) return;
          pendingFocus.current = "@search"; setFocused(false); setDirection(next.id);
        }}>{labDirections.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select>
      </label>
      <Link href={localizeHref("/", locale)} prefetch={false}>BTSHQ ↗</Link>
    </div>
    <div className={styles.experience} data-focused={focused} data-world={active?.kind} data-searching={Boolean(perspective.query.trim())}>
      <div ref={space} className={styles.space} style={{ "--scene-wide": scene.height.wide + "px", "--scene-compact": scene.height.compact + "px", "--world-x":scene.world.wide.x, "--world-y":scene.world.wide.y, "--compact-world-x":scene.world.compact.x, "--compact-world-y":scene.world.compact.y } as CSSProperties}
        data-focus={focused} data-kind={perspective.kind} data-count={scene.nodes.length} data-searching={Boolean(perspective.query.trim())}
        onClickCapture={event => { if (didDrag.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); } didDrag.current = false; }}
        onPointerDown={startGesture} onPointerMove={dragGesture} onPointerUp={event => endGesture(event)} onPointerCancel={event => endGesture(event, true)}>
        <div className={styles.landscape} aria-hidden="true"><svg viewBox="0 0 1600 1000" preserveAspectRatio="none">
          <path d="M0 590C320 120 630 920 1600 170L1600 1000H0Z" fill="#0966ad" fillOpacity=".22" />
          <path d="M0 640C420 60 820 990 1600 260" fill="none" stroke="#7bdfff" strokeOpacity=".18" />
          <path d="M0 710C530 180 840 1080 1600 430" fill="none" stroke="#91eaff" strokeOpacity=".09" />
        </svg><span>BTSHQ</span></div>
        <svg className={styles.connections} data-space-strings aria-hidden="true">
          {catalog.map(item => <path key={item.id} data-connection={item.id} data-active={item.id === active?.id}
            style={{ strokeOpacity: item.id === active?.id ? 1 : .45 }} />)}
        </svg>
        <div className={styles.controlColumn}>
          <header className={styles.intro}>
            <p className={styles.eyebrow}>BTSHQ / {labDirections.find(value => value.id === direction)?.name}</p>
            <h1 id="lab-title">{copy.title.replace("\n", " ")}</h1>
            <p>{copy.subtitle}</p>
          </header>
          <section className={styles.center} data-search-center aria-label={copy.search}>
            <label htmlFor="lab-search" className={styles.searchLabel}>{copy.search}</label>
            <div className={styles.searchSurface} data-search-lens>
              <span className={styles.searchIcon} aria-hidden="true">⌕</span>
              <input id="lab-search" type="search" maxLength={160} autoComplete="off" spellCheck={false}
                placeholder={copy.placeholder} value={perspective.query} aria-describedby="lab-results-status"
                onChange={event => { setFocused(false); setPerspective(current => ({ ...current, query: event.target.value, selectedId: "" })); }} />
              {perspective.query ? <button type="button" onClick={() => { setFocused(false); setPerspective(current => ({ ...current, query: "", selectedId: initial.selectedId })); }} aria-label={copy.clear}>×</button> : <span className={styles.inputStar} aria-hidden="true">↗</span>}
            </div>
            <details className={styles.categoryDisclosure} data-lab-categories open={focused ? false : undefined}>
              <summary>{copy.categories}</summary>
              <div className={styles.categories} role="group" aria-label={copy.categories}>
                {(["all", ...labKinds] as const).map(kind => {
                  const count = kind === "all" ? unfiltered.length : unfiltered.filter(({ item }) => item.kind === kind).length;
                  const label = kind === "all" ? copy.all : copy.kinds[kind];
                  return <button key={kind} type="button" aria-pressed={perspective.kind === kind} aria-label={label + " · " + count} data-available={count > 0}
                    onClick={() => { setFocused(false); setPerspective(current => ({ ...current, kind, selectedId: "" })); }}>{label}<span aria-hidden="true">{count}</span></button>;
                })}
              </div>
            </details>
            <div className={styles.resultBar}>
              <details className={styles.resultList} data-lab-results><summary>{copy.list} · {matches.length}</summary>
                <ul>{matches.map(({ item }) => <li key={item.id}><button type="button" onClick={event => {
                  const disclosure = event.currentTarget.closest("details"); if (disclosure) disclosure.open = false; enterFocus(item.id);
                }}><span lang={item.language}>{item.title}</span><small>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</small></button></li>)}</ul>
              </details>
              <button type="button" onClick={reset}>{copy.reset} <span aria-hidden="true">↺</span></button>
            </div>
            <p id="lab-results-status" className={styles.sceneHint} role="status">{matches.length} {copy.results}
              {evidence?.topics.length && !focused ? <> · {focusCopy[locale].topics}: {evidence.topics.slice(0, 2).join(" · ")}</> : null}</p>
          </section>
        </div>
        <ul className={styles.nodes} aria-label={copy.results}>
          {catalog.map(item => {
            const node = scene.nodes.find(node => node.item.id === item.id);
            const selected = item.id === active?.id, visible = Boolean(node);
            return <li key={item.id} className={styles.nodePosition} data-lab-object={item.id} data-lab-card={visible ? item.id : undefined}
              data-source={item.source} data-visible={visible} data-selected={selected} data-kind={item.kind} data-role={node?.role} data-related={Boolean(node?.relation)} inert={!visible} aria-hidden={!visible}
              style={{ visibility: visible ? "visible" : undefined, "--x": node?.desktop.x ?? 50, "--y": node?.desktop.y ?? 0, "--mx": node?.compact.x ?? 50, "--my": node?.compact.y ?? 0,
                "--s": focused ? node?.focusScale : node?.scale, "--ms": focused ? node?.focusCompactScale : node?.compactScale } as CSSProperties}>
              <IslandVisual item={item} featured={selected} />
              <button type="button" data-space-node data-kind={item.kind} aria-pressed={selected} aria-controls={visible && focused ? "lab-detail" : undefined} tabIndex={visible ? 0 : -1}
                aria-label={copy.select + " · " + item.title + " · " + (item.source === "demo" ? copy.demo : copy.kinds[item.kind])}
                className={styles.node} onClick={() => enterFocus(item.id)} onKeyDown={event => onNodeKey(event, node?.index ?? 0)}>
                <span className={styles.cardKind}>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</span>
                <strong lang={item.language}><span>{item.title}</span></strong>
                <span className={styles.nodeFoot}><span>{node?.role === "feature" && active && sharedLabTopics(active,item).length ? focusCopy[locale].shared + " · " + sharedLabTopics(active,item).slice(0,2).join(" · ") : selected ? copy.details : copy.select}</span><span aria-hidden="true">↗</span></span>
              </button>
              {focused && node?.relation && active ? <span className={styles.connectionCaption}>{sharedLabTopics(active, item).slice(0, 2).join(" · ")}</span> : null}
            </li>;
          })}
        </ul>
        {!scene.nodes.length ? <div className={styles.empty}><h2>{copy.emptyTitle}</h2><p>{copy.emptyBody}</p><button type="button" onClick={reset}>{copy.reset} <span aria-hidden="true">↗</span></button></div> : null}
      </div>
      {focused && active ? <FocusSurface match={activeMatch!} query={perspective.query} kind={perspective.kind} locale={locale} related={related} onBack={leaveFocus} onRefine={refine} onSelect={enterFocus} /> : null}
    </div>
    {active ? <div className={styles.spaceControls}>
      <button type="button" aria-label={copy.previous} disabled={scene.selectedIndex <= 0} onClick={() => move(scene.selectedIndex - 1)}>←</button>
      <p><span aria-hidden="true">{scene.start + 1}–{scene.end} / {matches.length}</span><span id="lab-selection-status" role="status">{copy.position} · {active.title}</span></p>
      <button type="button" aria-label={copy.next} disabled={scene.selectedIndex >= matches.length - 1} onClick={() => move(scene.selectedIndex + 1)}>→</button>
      <button type="button" className={styles.focusAction} onClick={() => enterFocus(active.id)}>{focusCopy[locale].focus} ↗</button>
    </div> : null}
    <p className={styles.privacy}>{copy.privacy}</p>
  </article>;
}
