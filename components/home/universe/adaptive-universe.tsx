"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { useLocale } from "@/components/i18n/locale-context";
import { DiscoveryNavigationStatus } from "@/components/discovery/discovery-results";
import { useDiscovery } from "@/components/discovery/discovery-context";
import { adaptiveHomeCopy } from "@/data/i18n/adaptive-home";
import { getDiscoveryUiCopy, getGuidedDiscoveryPrompts } from "@/data/i18n/discovery";
import { publicUniverse, universeMatches, relatedUniverseItems, sharedUniverseTopics, type UniverseKind } from "@/lib/discovery-universe/content";
import { composeUniverseSpace, dragSelection, type UniverseDirection, type MotionPoint } from "@/lib/discovery-universe/space";
import { canHandoffUniverseLink } from "@/lib/discovery-universe/navigation";
import { startUniverseMotion, type UniverseMotion } from "@/lib/discovery-universe/motion";
import { IslandVisual } from "./island-visual";
import styles from "./universe.module.css";

type Perspective = { selectionQuery: string; kind: UniverseKind | "all"; selectedId: string };
const initial: Perspective = { selectionQuery:"", kind:"all", selectedId:"" };
const kinds = ["Projects","Insights","Tools","People","Pages"] as const;
const kindGroup = {project:"Projects",writing:"Insights",tool:"Tools",person:"People",world:"Pages",community:"Tools",page:"Pages"} as const;
export function AdaptiveUniverse() {
  const locale=useLocale(), copy=adaptiveHomeCopy[locale], ui=getDiscoveryUiCopy(locale);
  const {items, matches:ranked, query, setQuery, writingStatus, beginCanvasNavigation, settleCanvasNavigation}=useDiscovery();
  const handoffId = useRef<number | null>(null);
  const [perspective,setPerspective]=useState<Perspective>(initial);
  const [focused,setFocused]=useState(false);
  const catalog=useMemo(()=>publicUniverse(items,locale),[items,locale]);
  const unfiltered=useMemo(()=>universeMatches(catalog,ranked,query),[catalog,ranked,query]);
  const matches=useMemo(()=>unfiltered.filter(({item})=>perspective.kind==="all" || kindGroup[item.kind]===kindGroup[perspective.kind]),[unfiltered,perspective.kind]);
  const active=(perspective.selectionQuery===query ? matches.find(({item})=>item.id===perspective.selectedId)?.item : undefined)??matches[0]?.item;
  const [focusQuery,setFocusQuery]=useState("");
  const focusActive=focused && focusQuery===query;
  const direction:UniverseDirection="atlas";
  const scene=useMemo(()=>composeUniverseSpace(matches,active?.id??"",focusActive,direction),[matches,active?.id,focusActive]);
  const related=active?relatedUniverseItems(active,matches.map(match=>match.item)):[];
  const space = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; captured: boolean } | null>(null);
  const didDrag = useRef(false);
  const motion = useRef<UniverseMotion | null>(null);
  const positions = useRef(new Map<string, MotionPoint>());
  const pendingFocus = useRef<string | null>(null);
  const returnPerspective = useRef<Perspective | null>(null);
  const returnViewport = useRef<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (!space.current) return;
    const currentMotion = startUniverseMotion(space.current, scene, positions.current);
    motion.current = currentMotion;
    let focusFrame = 0;
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target) {
      if (target.startsWith("@restore:") && returnViewport.current && typeof window !== "undefined") {
        const { x, y } = returnViewport.current;
        window.scrollTo({ left: x, top: y, behavior: "instant" });
        returnViewport.current = null;
      }
      if (target !== "@detail" && target !== "@search" && !target.startsWith("@restore:")) currentMotion.finish();
      let attempts = 0;
      const focusVisibleTarget = () => {
        const button = target === "@detail" ? document.getElementById("universe-detail")
          : target === "@search" ? document.getElementById("universe-search")
          : space.current?.querySelector<HTMLButtonElement>('[data-universe-card="' + target.replace("@restore:", "") + '"] button');
        if (!button) return;
        if (getComputedStyle(button).visibility === "visible") {
          button.focus({ preventScroll: target !== "@search" });
          if (target === "@detail" && typeof innerHeight === "number") {
            const field = document.getElementById("universe-search"), bounds = field?.getBoundingClientRect();
            if (bounds && (bounds.top < 85 || bounds.bottom > innerHeight - 8)) field?.scrollIntoView({ block:"center", behavior:"instant" });
          }
          if (target !== "@detail" && document.activeElement === button && typeof innerHeight === "number") {
            const visible = button.querySelector?.("strong") ?? button, bounds = visible.getBoundingClientRect();
            if (bounds.top < 85 || bounds.bottom > innerHeight - 8) visible.scrollIntoView({ block: "nearest", behavior: "instant" });
          }
        }
        if (document.activeElement !== button && ++attempts < 4) focusFrame = requestAnimationFrame(focusVisibleTarget);
      };
      focusFrame = requestAnimationFrame(focusVisibleTarget);
    }
    return () => { cancelAnimationFrame(focusFrame); currentMotion.stop(); };
  }, [scene, direction]);

  const select = (id: string) => setPerspective(current => ({ ...current, selectedId: id, selectionQuery: query }));
  const enterFocus = (id: string) => {
    if (focusActive && active?.id === id) { document.getElementById("universe-detail")?.focus(); return; }
    if (!focusActive) {
      returnPerspective.current = scene.nodes.some(node => node.item.id === id)
        ? { ...perspective } : { ...perspective, selectedId: id };
      if (typeof window !== "undefined") returnViewport.current = { x: window.scrollX, y: window.scrollY };
    }
    pendingFocus.current = "@detail"; select(id); setFocusQuery(query); setFocused(true);
  };
  const leaveFocus = () => {
    const previous = returnPerspective.current;
    const restored = previous ? composeUniverseSpace(matches, previous.selectedId) : scene;
    const destination = restored.nodes.some(node => node.item.id === active?.id) ? active?.id
      : restored.nodes.find(node => node.index === restored.selectedIndex)?.item.id;
    pendingFocus.current = destination ? "@restore:" + destination : "@search";
    if (previous) setPerspective(previous);
    returnPerspective.current = null; setFocused(false);
  };
  const refine = () => { returnViewport.current = null; pendingFocus.current = "@search"; setFocused(false); };
  const reset = () => { returnViewport.current = null; setFocused(false); setPerspective(initial); setQuery(""); };
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
    if (gesture.current) return;
    didDrag.current = false;
    const control = (event.target as Element).closest("button,a,input,label,select,summary");
    if (focusActive || event.button !== 0 || (control && !control.hasAttribute("data-space-node"))) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, captured: false };
  };
  const dragGesture = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.captured && Math.abs(dy) > 16 && Math.abs(dy) > Math.abs(dx)) { gesture.current = null; return; }
    if (!start.captured && Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      start.captured = true; didDrag.current = true; event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (start.captured) motion.current?.pan(dx);
  };
  const endGesture = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    gesture.current = null;
    const next = !cancelled && start.captured ? dragSelection(event.clientX-start.x,space.current?.clientWidth ?? 1200,scene.selectedIndex,matches.length) : scene.selectedIndex;
    motion.current?.release();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (next !== scene.selectedIndex) move(next);
  };

  const changeQuery = (value:string) => { returnViewport.current=null; setFocused(false); setPerspective(current=>({...current,selectedId:""})); setQuery(value); };
  const resultStatus = query.trim() ? ([
    [copy.results, matches.filter(match=>match.presentation==="match").length],
    [copy.suggestions, matches.filter(match=>match.presentation==="suggestion").length],
    [copy.related, matches.filter(match=>match.presentation==="related").length],
  ] as const).filter(([,count])=>count>0).map(([label,count])=>label+" · "+count).join(" / ") || ui.noResults : copy.suggestions+" · "+matches.length;
  const category = (kind:UniverseKind) => ui.groups[kindGroup[kind]];
  return <article className={styles.universe} data-adaptive-universe data-focused={focusActive} aria-labelledby="universe-title"
    onKeyDown={event=>{if(focusActive && event.key==="Escape" && !event.defaultPrevented){event.preventDefault();leaveFocus();}}}>
    <header className={styles.topline}><div><p className={styles.prototype}>BTSHQ / Discover</p><h1 id="universe-title">{copy.title}</h1><p className={styles.subtitle}>{copy.subtitle}</p></div></header>
    <div className={styles.experience} data-focused={focusActive} data-world={active?.kind}>
      <div ref={space} className={styles.space} data-focus={focusActive} data-count={scene.nodes.length}
        style={{"--scene-wide":scene.height.wide+"px","--scene-compact":scene.height.compact+"px"} as CSSProperties}
        onClickCapture={event=>{if(didDrag.current && event.detail>0){event.preventDefault();event.stopPropagation();}didDrag.current=false;}}
        onPointerDown={startGesture} onPointerMove={dragGesture} onPointerUp={event=>endGesture(event)} onPointerCancel={event=>endGesture(event,true)} onLostPointerCapture={event=>endGesture(event,true)}>
        <svg className={styles.connections} data-space-strings aria-hidden="true">{catalog.map(item=><path key={item.id} data-connection={item.id} data-active={item.id===active?.id} data-related={related.some(other=>other.id===item.id)} data-relevant={Boolean(query.trim()) && matches.some(match=>match.item.id===item.id)} />)}</svg>
        <section className={styles.center} data-search-center aria-label={ui.searchLabel}>
          <label htmlFor="universe-search" className={styles.searchLabel}>{ui.searchLabel}</label>
          <div className={styles.searchSurface} data-search-lens><span className={styles.searchIcon} aria-hidden="true">⌕</span>
            <input id="universe-search" type="search" autoComplete="off" spellCheck={false} maxLength={160} placeholder={ui.placeholder} value={query} aria-describedby="universe-status"
              onChange={event=>changeQuery(event.target.value)} onKeyDown={event=>{if(event.key==="Enter" && active){event.preventDefault();enterFocus(active.id);}if(event.key==="Escape" && !focusActive && query){event.preventDefault();changeQuery("");}}} />
            {query ? <button type="button" aria-label={copy.reset} onClick={()=>changeQuery("")}>×</button>:<span className={styles.inputStar} aria-hidden="true">✧</span>}
          </div>
          <details className={styles.categoryDisclosure} data-universe-categories><summary>{copy.categories} · {perspective.kind==="all"?copy.all:category(perspective.kind)}</summary>
            <div className={styles.categories}><button type="button" aria-pressed={perspective.kind==="all"} onClick={()=>{setFocused(false);setPerspective(initial);}}>{copy.all}</button>
              {kinds.map(group=>{const kind=Object.keys(kindGroup).find(key=>kindGroup[key as UniverseKind]===group) as UniverseKind;return <button key={group} type="button" aria-pressed={perspective.kind!=="all" && kindGroup[perspective.kind]===group} onClick={()=>{setFocused(false);setPerspective({kind,selectedId:"",selectionQuery:query});}}>{ui.groups[group]}</button>;})}
            </div>
          </details>
          <div className={styles.resultBar}><details className={styles.resultList} data-universe-list><summary>{copy.list}</summary><ul>{matches.map(({item})=><li key={item.id}><button type="button" onClick={()=>{document.querySelector<HTMLDetailsElement>("[data-universe-list]")?.removeAttribute("open");enterFocus(item.id);}}><span lang={item.language}>{item.title}</span><small>{category(item.kind)}</small></button></li>)}</ul></details><button type="button" onClick={reset}>{copy.reset} ↺</button></div>
          <p id="universe-status" className={styles.sceneHint} role="status">{resultStatus}</p>
        </section>
        <ul className={styles.nodes} aria-label={ui.resultsLabel}>{catalog.map(item=>{
          const node=scene.nodes.find(node=>node.item.id===item.id), selected=item.id===active?.id, visible=Boolean(node);
          return <li key={item.id} className={styles.nodePosition} data-universe-object={item.id} data-universe-card={visible?item.id:undefined} data-visible={visible} data-selected={selected} data-kind={item.kind} data-role={node?.role} inert={!visible} aria-hidden={!visible}
            style={{visibility:visible?"visible":undefined,"--x":node?.desktop.x??50,"--y":node?.desktop.y??0,"--mx":node?.compact.x??50,"--my":node?.compact.y??0,"--s":focusActive?node?.focusScale:node?.scale,"--ms":focusActive?node?.focusCompactScale:node?.compactScale} as CSSProperties}>
            <IslandVisual item={item} featured={selected || node?.role==="feature"}/>
            <button type="button" data-space-node className={styles.node} aria-label={copy.select+" · "+item.title} aria-pressed={selected} tabIndex={visible?0:-1} aria-hidden={focusActive && selected?true:undefined} onClick={()=>enterFocus(item.id)} onKeyDown={event=>onNodeKey(event,node?.index??0)}>
              <span className={styles.cardKind}>{category(item.kind)}{item.status!=="Live"?" · "+ui.statuses[item.status]:""}</span><strong lang={item.language}><span>{item.title}</span></strong><span className={styles.nodeFoot}><span>{selected?copy.focus:copy.select}</span><span aria-hidden="true">↗</span></span>
            </button>
            {focusActive && node?.relation && active?<span className={styles.connectionCaption}>{sharedUniverseTopics(active,item).slice(0,2).join(" · ")}</span>:null}
          </li>;
        })}</ul>
        {!matches.length?<div className={styles.empty}><h2>{copy.empty}</h2><p>{copy.help}</p>{getGuidedDiscoveryPrompts(locale).slice(0,3).map(prompt=><button key={prompt.id} type="button" onClick={()=>changeQuery(prompt.query)}>{prompt.label} ↗ </button>)}</div>:null}
      </div>
      {focusActive && active?<section id="universe-detail" tabIndex={-1} aria-labelledby="universe-detail-title" className={styles.focusSurface}>
        <div className={styles.focusToolbar}><button type="button" onClick={leaveFocus}>← {copy.back}</button><button type="button" onClick={refine}>{ui.searchLabel} ↗</button></div>
        <h2 id="universe-detail-title" className={styles.srOnly} lang={active.language}>{active.title}</h2>
        <div className={styles.focusBody} data-focus-body>{active.status!=="Live"?<p className={styles.source}>{ui.statuses[active.status]}</p>:null}<p className={styles.summary} lang={active.language}>{active.summary}</p><Link className={styles.open} href={active.href} prefetch={false} onClick={event=>{if(canHandoffUniverseLink(event,active.href,window.location.href))handoffId.current=beginCanvasNavigation(active.href);}}>{copy.open} ↗<DiscoveryNavigationStatus targetHref={active.href} handoffIdRef={handoffId} onSettle={settleCanvasNavigation}/></Link>
          {related.length?<details className={styles.focusNotes}><summary>{copy.related}</summary><div className={styles.related}>{related.map(other=><button key={other.id} type="button" onClick={()=>enterFocus(other.id)}><span><small>{sharedUniverseTopics(active,other).slice(0,2).join(" · ")}</small><strong lang={other.language}>{other.title}</strong></span><span aria-hidden="true">↗</span></button>)}</div></details>:null}
        </div>
      </section>:null}
    </div>
    <noscript><nav aria-label={copy.list}><ul>{catalog.map(item=><li key={item.id}><Link href={item.href}>{item.title}</Link></li>)}</ul></nav></noscript>
    {active?<div className={styles.spaceControls}><button type="button" aria-label={copy.previous} disabled={scene.selectedIndex===0} onClick={()=>move(scene.selectedIndex-1)}>←</button><p><span>{scene.selectedIndex+1} / {matches.length}</span><span role="status">{active.title}</span></p><button type="button" aria-label={copy.nextItem} disabled={scene.selectedIndex===matches.length-1} onClick={()=>move(scene.selectedIndex+1)}>→</button><button type="button" className={styles.focusAction} onClick={()=>enterFocus(active.id)}>{copy.focus} ↗</button></div>:null}
    {writingStatus==="unavailable"?<p className={styles.unavailable} role="status">{copy.writingUnavailable}</p>:null}<p className={styles.privacy}>{copy.privacy}</p>
  </article>;
}
