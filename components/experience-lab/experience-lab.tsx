"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { labCopy } from "@/data/experience-lab/copy";
import { createLabSearch, labKinds, relatedLabItems, type LabKind, type LabItem } from "@/lib/experience-lab/search";
import { composeLabSpace, type MotionPoint } from "@/lib/experience-lab/space";
import { type Locale } from "@/lib/i18n/config";
import { focusCopy } from "@/data/experience-lab/focus-copy";
import { labContext, sharedLabTopics } from "@/lib/experience-lab/context";
import { localizeHref } from "@/lib/i18n/routing";
import { startLabMotion, type LabMotion } from "@/lib/experience-lab/motion";
import { IslandVisual } from "./island-visual";
import { FocusSurface } from "./focus-surface";
import styles from "./experience-lab.module.css";

type Perspective = { query: string; kind: LabKind | "all"; selectedId: string };
const initial: Perspective = { query: "", kind: "all", selectedId: "personal-advantage" };

export function ExperienceLab({ catalog, locale }: { catalog: readonly LabItem[]; locale: Locale }) {
  const copy = labCopy[locale];
  const [perspective, setPerspective] = useState<Perspective>(initial);
  const [focused,setFocused]=useState(false);
  const search = useMemo(() => createLabSearch(catalog), [catalog]);
  const unfiltered = useMemo(() => search(perspective.query), [search, perspective.query]);
  const matches = useMemo(() => unfiltered.filter(({ item }) => perspective.kind === "all" || item.kind === perspective.kind), [unfiltered, perspective.kind]);
  const active = matches.find(({ item }) => item.id === perspective.selectedId)?.item ?? matches[0]?.item;
  const scene = useMemo(() => composeLabSpace(matches, active?.id ?? "",focused), [matches, active?.id,focused]);
  const related = active ? relatedLabItems(active, matches.map(match=>match.item)) : [];
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
    let focusFrame = 0;
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target) {
      if(target!=="@detail" && target!=="@search" && !target.startsWith("@restore:"))currentMotion.finish();
      // Let the browser finish retiring the old inert focus target first.
      let attempts = 0;
      const focusVisibleTarget = () => {
        const button = target==="@detail" ? document.getElementById("lab-detail") : target==="@search" ? document.getElementById("lab-search") : space.current?.querySelector<HTMLButtonElement>('[data-lab-card="' + target.replace("@restore:","") + '"] button');
        if (!button) return;
        if (getComputedStyle(button).visibility === "visible") {
          button.focus({preventScroll:target==="@detail"});
          if(target==="@detail" && matchMedia("(max-width: 1199px)").matches)space.current?.scrollIntoView?.({block:"start",behavior:"instant"});
          if(target!=="@detail" && document.activeElement===button && typeof innerHeight==="number"){
            const bounds=button.getBoundingClientRect();
            if(bounds.top<85 || bounds.bottom>innerHeight-8)button.scrollIntoView({block:"center",behavior:"instant"});
          }
        }
        if (document.activeElement !== button && ++attempts < 4) focusFrame = requestAnimationFrame(focusVisibleTarget);
      };
      focusFrame = requestAnimationFrame(focusVisibleTarget);
    }
    return () => { cancelAnimationFrame(focusFrame); currentMotion.stop(); };
  }, [scene]);
  const select = (id: string) => setPerspective(current => ({ ...current, selectedId: id }));
  const enterFocus=(id:string)=>{
    if(focused && active?.id===id){document.getElementById("lab-detail")?.focus();return;}
    pendingFocus.current="@detail";select(id);setFocused(true);
  };
  const leaveFocus=()=>{pendingFocus.current=active?"@restore:"+active.id:"@search";setFocused(false);};
  const refine=()=>{pendingFocus.current="@search";setFocused(false);};
  const reset=()=>{setFocused(false);setPerspective(initial);};
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
    <article className={styles.lab} aria-labelledby="lab-title" onKeyDown={event=>{if(focused && event.key==="Escape" && !event.defaultPrevented){event.preventDefault();leaveFocus();}}}>
      <div className={styles.topline}>
        <span className={styles.prototype}>{copy.prototype} <span>4.0</span></span>
        <Link href={localizeHref("/", locale)} prefetch={false}>BTSHQ <span aria-hidden="true">↗</span></Link>
      </div>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>BTSHQ · Adaptive Liquid Universe</p>
        <h1 id="lab-title">{copy.title.replace("\n", " ")}</h1>
        <p>{copy.subtitle}</p>
      </header>
      <div className={styles.resultBar}>
        <details className={styles.resultList}>
          <summary>{copy.list} · {matches.length}</summary>
          <ul>{matches.map(({ item }) => <li key={item.id}><button type="button" onClick={event => {
            const disclosure=event.currentTarget.closest("details");if(disclosure)disclosure.open=false;
            enterFocus(item.id);
          }}><span lang={item.language}>{item.title}</span><small>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</small></button></li>)}</ul>
        </details>
        <p id="lab-results-status" role="status">{matches.length} {copy.results}</p>
        <button type="button" onClick={reset}>{copy.reset} <span aria-hidden="true">↺</span></button>
      </div>
      <div className={styles.experience} data-focused={focused} data-world={active?.kind} data-searching={Boolean(perspective.query.trim())}>
      <div ref={space} className={styles.space} style={{"--scene-wide":scene.height.wide+"px","--scene-compact":scene.height.compact+"px"} as CSSProperties} data-focus={focused} data-kind={perspective.kind} data-count={scene.nodes.length} data-solo={scene.nodes.length === 1} data-searching={Boolean(perspective.query.trim())}
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
        <section className={styles.center} data-search-center aria-label={copy.search}>
          <div className={styles.core} aria-hidden="true"><span /><span /></div>
          <label htmlFor="lab-search" className={styles.searchLabel}>{copy.search}</label>
          <div className={styles.searchSurface} data-search-lens>
            <span className={styles.searchIcon} aria-hidden="true">⌕</span>
            <input id="lab-search" type="search" maxLength={160} autoComplete="off" spellCheck={false}
              placeholder={copy.placeholder} value={perspective.query} aria-describedby="lab-results-status"
              onChange={event => {setFocused(false);setPerspective(current => ({ ...current, query: event.target.value, selectedId: "" }));}} />
            {perspective.query ? <button type="button" onClick={() => {setFocused(false);setPerspective(current => ({ ...current, query: "", selectedId: initial.selectedId }));}} aria-label={copy.clear}>×</button> : <span className={styles.inputStar} aria-hidden="true">✦</span>}
          </div>
          <details className={styles.categoryDisclosure} open={!focused}>
          <summary>{copy.categories}</summary>
          <div className={styles.categories} role="group" aria-label={copy.categories}>
            {(["all", ...labKinds] as const).map(kind => {
              const count = kind === "all" ? unfiltered.length : unfiltered.filter(({ item }) => item.kind === kind).length;
              const label = kind === "all" ? copy.all : copy.kinds[kind];
              return <button key={kind} type="button" aria-pressed={perspective.kind === kind} aria-label={label + " · " + count} data-available={count > 0}
                onClick={() => {setFocused(false);setPerspective(current => ({ ...current, kind, selectedId: "" }));}}>
                {label}<span aria-hidden="true">{count}</span>
              </button>;
            })}
          </div>
          </details>
          <p className={styles.sceneHint}>{evidence?.topics.length && !focused ? <><span>{focusCopy[locale].topics}</span> · {evidence.topics.slice(0,2).join(" · ")}</> : copy.browse}</p>
        </section>
        <ul className={styles.nodes} aria-label={copy.results}>
          {catalog.map(item => {
            const node = scene.nodes.find(node => node.item.id === item.id);
            const selected = item.id === active?.id, visible = Boolean(node);
            return <li data-lab-object={item.id} data-lab-card={visible ? item.id : undefined} data-visible={visible} data-selected={selected}
              data-kind={item.kind} data-related={Boolean(node?.relation)} inert={!visible} aria-hidden={!visible} className={styles.nodePosition} key={item.id}
              style={{ visibility: visible ? "visible" : undefined, "--x": node?.desktop.x ?? 50, "--y": node?.desktop.y ?? 0, "--mx": node?.compact.x ?? 50, "--my": node?.compact.y ?? 0, "--turn": (node?.turn ?? 0) + "deg", "--strength": node?.strength ?? 0 } as CSSProperties}>
              <button type="button" data-space-node aria-pressed={selected} aria-controls={visible && focused ? "lab-detail" : undefined} tabIndex={visible ? 0 : -1}
                aria-label={copy.select + " · " + item.title + " · " + (item.source === "demo" ? copy.demo : copy.kinds[item.kind])}
                className={styles.node} data-kind={item.kind} onClick={() => enterFocus(item.id)} onKeyDown={event => onNodeKey(event, node?.index ?? 0)}>
                <span className={styles.cardKind}>{item.source === "demo" ? copy.demo : copy.kinds[item.kind]}</span>
                <IslandVisual item={item} />
                <strong lang={item.language}>{item.title}</strong>
                <span className={styles.nodeFoot}><span>{selected ? copy.details : copy.select}</span><span aria-hidden="true">{selected ? "↘" : "+"}</span></span>
              </button>
              {focused && node?.relation && active ? <span className={styles.connectionCaption}>{sharedLabTopics(active,item).slice(0,2).join(" · ")}</span> : null}
            </li>;
          })}
        </ul>
        {!scene.nodes.length ? <div className={styles.empty}><h2>{copy.emptyTitle}</h2><p>{copy.emptyBody}</p><button type="button" onClick={reset}>{copy.reset} ↗</button></div> : null}
      </div>
      {focused && active?<FocusSurface match={matches.find(match=>match.item.id===active.id)!} query={perspective.query} kind={perspective.kind} locale={locale} related={related} onBack={leaveFocus} onRefine={refine} onSelect={enterFocus}/>:null}
      </div>
      {active ? <div className={styles.spaceControls}>
        <button type="button" aria-label={copy.previous} disabled={scene.selectedIndex <= 0} onClick={() => move(scene.selectedIndex - 1)}>←</button>
        <p><span aria-hidden="true">{scene.start + 1}–{scene.end} / {matches.length}</span><span id="lab-selection-status" role="status">{copy.position} · {active.title}</span></p>
        <button type="button" aria-label={copy.next} disabled={scene.selectedIndex >= matches.length - 1} onClick={() => move(scene.selectedIndex + 1)}>→</button>
        <button type="button" className={styles.focusAction} onClick={()=>enterFocus(active.id)}>{focusCopy[locale].focus} ↗</button>
      </div> : null}
      <p className={styles.privacy}>{copy.privacy}</p>
    </article>
  );
}
