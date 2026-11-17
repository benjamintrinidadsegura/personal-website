import { relatedUniverseItems, type UniverseMatch } from "./content";

export type UniverseDirection = "atlas";
export const universeWindowSize = 6;
export type SpacePoint = { x: number; y: number };
export type MotionPoint = SpacePoint & { opacity: number; scale: number; turn: number };

/** Current public choices stay legible during collision/entry choreography.
 * Retiring choices are already inert and may still fade out normally. */
export function visibleContentOpacity(opacity: number, targetOpacity: number): number {
  return targetOpacity > 0 ? Math.max(opacity, Math.min(.9, targetOpacity)) : opacity;
}
type Slot = SpacePoint & { scale: number };
/** Finite, reversible scrubbing. Neither velocity nor elapsed time can change selection. */
export const dragStride = (width: number) => Math.max(180, Math.min(300, width * .22));
export function dragSelection(dx: number, width: number, index: number, count: number) {
  return Math.abs(dx) < dragStride(width) * .32 ? index
    : Math.max(0, Math.min(count - 1, index + (dx < 0 ? 1 : -1)));
}

function atlasSlots(count: number): { wide: readonly Slot[]; compact: readonly Slot[] } {
  const wide = count === 1 ? [{x:24,y:350,scale:1.04}]
    : count === 2 ? [{x:23,y:315,scale:1},{x:77,y:350,scale:.94}]
    : count <= 4 ? [{x:22,y:220,scale:1},{x:78,y:215,scale:.9},{x:78,y:606,scale:.84},{x:22,y:630,scale:.8}]
    : [{x:19,y:170,scale:.94},{x:81,y:170,scale:.84},{x:81,y:560,scale:.8},
      {x:19,y:560,scale:.78},{x:50,y:115,scale:.7},{x:50,y:680,scale:.64}];
  return {wide, compact:[{x:50,y:128,scale:.84},{x:25,y:566,scale:.54},{x:75,y:566,scale:.54},
    {x:25,y:566,scale:.54},{x:50,y:566,scale:.54},{x:75,y:566,scale:.54}]};
}
/** Editorial roles change from actual selection and index evidence, never fabricated query lists. */
export function composeUniverseSpace(matches: readonly UniverseMatch[], selectedId: string, focus = false, direction: UniverseDirection = "atlas", mode: "discovery" | "search" = "search") {
  const selectedIndex = Math.max(0, matches.findIndex(({ item }) => item.id === selectedId));
  const selected = matches[selectedIndex];
  const windowSize = mode === "discovery" ? 4 : universeWindowSize;
  const start = Math.floor(selectedIndex / windowSize) * windowSize;
  const window = matches.slice(start, start + windowSize);
  const strongest = matches[0]?.score || 1;
  const relations = focus && selected ? relatedUniverseItems(selected.item, matches.map(match => match.item)) : [];
  const focusItems = new Set([selected?.item.id, ...relations.map(item => item.id)]);
  const displayed = focus ? matches.filter(match => focusItems.has(match.item.id)) : window;
  const contextual = selected ? relatedUniverseItems(selected.item, displayed.map(match => match.item)) : [];
  const visualOrder = selected ? [selected.item.id, ...contextual.map(item => item.id),
    ...displayed.filter(match => match.item.id !== selected.item.id && !contextual.some(item => item.id === match.item.id)).map(match => match.item.id)] : [];
  const leadKind = selected?.item.kind;
  const worldX = leadKind === "person" ? 64 : leadKind === "writing" ? 68 : 50;
  return {
    direction, mode, focus, matches, selectedIndex, start, end: start + window.length,
    canvas: direction === "atlas",
    height: direction === "atlas" ? {wide:760,compact:640} : {wide:1330,compact:2000},
    world: { wide: {x:worldX,y:leadKind === "writing" ? 300 : 350}, compact:{x:50,y:direction === "atlas" ? 230 : 490} },
    nodes: displayed.map((match) => {
      const isSelected = match.item.id === selected?.item.id;
      const order = visualOrder.indexOf(match.item.id);
      // A query changes the composition, never the authoritative ordering or membership.
      const arrangement = atlasSlots(displayed.length);
      const desktop = arrangement.wide[order], compact = arrangement.compact[order];
      const adaptedDesktop = direction === "atlas"
        ? isSelected && leadKind === "writing" ? {...desktop,y:desktop.y+12}
          : isSelected && leadKind === "world" ? {...desktop,y:desktop.y-8} : desktop
        : desktop;
      const strength = match.score ? Math.max(.35, match.score / strongest) : .7;
      const weight = isSelected ? 1 : match.score ? .9 + .1 * strength : 1;
      return {
        ...match, index: matches.indexOf(match), relation: focus && !isSelected,
        role: isSelected ? "lead" : focus || order < 3 ? "feature" : "note",
        desktop: adaptedDesktop,
        compact: compact,
        depth: focus && !isSelected ? .86 : 1,
        scale: desktop.scale * weight, compactScale: compact.scale * weight,
        focusScale: focus ? isSelected ? 1.08 : .72 * weight : desktop.scale * weight,
        focusCompactScale: focus ? isSelected ? .98 : .54 * weight : compact.scale * weight,
        strength, turn: 0,
      };
    }),
  };
}
export type UniverseScene = ReturnType<typeof composeUniverseSpace>;

/** Fit measured page chrome; short screens grow only as much as content needs. */
export function universeRoomHeight(viewportHeight: number, sceneTop: number, controlsHeight: number, compact: boolean, count: number): number {
  // Reserve the measured long-caption desktop envelope before the first paint.
  // The later measured fit can still grow for unusually long localized content.
  const minimum = compact ? 590 : count > 4 ? 700 : 600;
  return Math.ceil(Math.max(minimum, viewportHeight - sceneTop - controlsHeight - 16));
}

/** Two-sided room around a fixed central lens; measured only on content intent. */
export function compactContentRoomHeight(lowerContentHeight: number, controlsBelowLens: number): number {
  return Math.max(640,Math.ceil(2 * (controlsBelowLens + lowerContentHeight + 8 + 12)));
}

/** Fit the measured painted silhouettes in their existing desktop slots.
 * Only intent/resize measurement calls this; it does not change order or scale. */
export function wideContentRoomHeight(items: readonly { x:number; y:number; width:number; height:number; offsetY:number; scale:number }[], width:number, minimum:number): number {
  let height=minimum;
  for(const item of items){
    const fraction=item.y/760,top=(item.offsetY-item.height/2)*item.scale,bottom=(item.offsetY+item.height/2)*item.scale;
    if(fraction>0)height=Math.max(height,(12-top)/fraction);
    if(fraction<1)height=Math.max(height,(12+bottom)/(1-fraction));
  }
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const a=items[i],b=items[j];
    if(Math.abs(a.x-b.x)*width/100>=(a.width*a.scale+b.width*b.scale)/2+12)continue;
    const [upper,lower]=a.y<b.y?[a,b]:[b,a],separation=(lower.y-upper.y)/760;
    if(separation<=0)continue;
    const upperBottom=(upper.offsetY+upper.height/2)*upper.scale,lowerTop=(lower.offsetY-lower.height/2)*lower.scale;
    height=Math.max(height,(upperBottom-lowerTop+12)/separation);
  }
  return Math.ceil(height);
}

export function mixMotion(from: MotionPoint, to: MotionPoint, progress: number): MotionPoint {
  const t = Math.max(0, Math.min(1, progress));
  const value = (key: keyof MotionPoint) => from[key] + (to[key] - from[key]) * t;
  return { x: value("x"), y: value("y"), opacity: value("opacity"), scale: value("scale"), turn: value("turn") };
}
/** One edge calculation for every frame, including rotation and entry scaling. */
export function edgeAnchor(from: SpacePoint, center: SpacePoint, width: number, height: number, turn = 0): SpacePoint {
  const angle = -turn * Math.PI / 180;
  const dx = from.x - center.x, dy = from.y - center.y;
  const x = dx * Math.cos(angle) - dy * Math.sin(angle);
  const y = dx * Math.sin(angle) + dy * Math.cos(angle);
  const ratio = 1 / (Math.hypot(x / Math.max(1,width / 2), y / Math.max(1,height / 2)) || 1);
  return { x: center.x + dx * ratio, y: center.y + dy * ratio };
}
export function universeConnection(from: SpacePoint, to: SpacePoint): string {
  const dx = to.x - from.x, dy = to.y - from.y;
  return "M " + from.x.toFixed(2) + " " + from.y.toFixed(2)
    + " C " + (from.x + dx * .28).toFixed(2) + " " + (from.y + dy * .68).toFixed(2)
    + ", " + (to.x - dx * .24).toFixed(2) + " " + (to.y - dy * .1).toFixed(2)
    + ", " + to.x.toFixed(2) + " " + to.y.toFixed(2);
}
