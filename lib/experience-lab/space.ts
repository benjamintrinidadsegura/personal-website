import { relatedLabItems, type LabMatch } from "./search";

export const labDirections = [
  { id: "atlas", name: "Cinematic Atlas" },
  { id: "editorial", name: "Living Editorial" },
  { id: "gallery", name: "Liquid Spatial Gallery" },
] as const;
export type LabDirection = (typeof labDirections)[number]["id"];
export const labWindowSize = 6;
export type SpacePoint = { x: number; y: number };
export type MotionPoint = SpacePoint & { opacity: number; scale: number; turn: number };
type Slot = SpacePoint & { scale: number };
/** Finite, reversible scrubbing. Neither velocity nor elapsed time can change selection. */
export const dragStride = (width: number) => Math.max(180, Math.min(300, width * .22));
export function dragSelection(dx: number, width: number, index: number, count: number) {
  return Math.abs(dx) < dragStride(width) * .32 ? index
    : Math.max(0, Math.min(count - 1, index + (dx < 0 ? 1 : -1)));
}

function atlasSlots(count: number): { wide: readonly Slot[]; compact: readonly Slot[] } {
  const wide = count === 1 ? [{x:50,y:145,scale:1}]
    : count === 2 ? [{x:24,y:165,scale:1},{x:76,y:185,scale:.86}]
    : [{x:24,y:165,scale:1},{x:77,y:165,scale:.8},{x:79,y:465,scale:.76},
      {x:24,y:565,scale:.68},{x:50,y:660,scale:.64},{x:78,y:685,scale:.62}];
  return {wide, compact:[{x:50,y:128,scale:.94},{x:25,y:575,scale:.54},{x:75,y:575,scale:.54},
    {x:25,y:575,scale:.54},{x:50,y:575,scale:.54},{x:75,y:575,scale:.54}]};
}
const slots: Record<LabDirection, { wide: readonly Slot[]; compact: readonly Slot[] }> = {
  atlas: {
    wide: [{x:22,y:300,scale:1},{x:78,y:555,scale:1},{x:78,y:235,scale:1},
      {x:22,y:660,scale:1},{x:50,y:710,scale:1},{x:78,y:710,scale:1}],
    compact: [{x:50,y:125,scale:1},{x:25,y:592,scale:1},{x:75,y:592,scale:1},
      {x:25,y:595,scale:1},{x:50,y:595,scale:1},{x:75,y:595,scale:1}],
  },
  editorial: {
    wide: [{x:38,y:320,scale:1},{x:79,y:590,scale:1},{x:79,y:920,scale:1},
      {x:18,y:1120,scale:1},{x:50,y:1120,scale:1},{x:82,y:1120,scale:1}],
    compact: [{x:50,y:580,scale:1},{x:50,y:970,scale:1},{x:50,y:1280,scale:1},
      {x:50,y:1480,scale:1},{x:50,y:1660,scale:1},{x:50,y:1840,scale:1}],
  },
  gallery: {
    wide: [{x:37,y:690,scale:1},{x:19,y:1000,scale:1},{x:81,y:1000,scale:1},
      {x:18,y:1200,scale:1},{x:50,y:1200,scale:1},{x:82,y:1200,scale:1}],
    compact: [{x:50,y:580,scale:1},{x:50,y:960,scale:1},{x:50,y:1140,scale:1},
      {x:50,y:1320,scale:1},{x:50,y:1500,scale:1},{x:50,y:1680,scale:1}],
  },
};
/** Editorial roles change from actual selection and index evidence, never fabricated query lists. */
export function composeLabSpace(matches: readonly LabMatch[], selectedId: string, focus = false, direction: LabDirection = "atlas") {
  const selectedIndex = Math.max(0, matches.findIndex(({ item }) => item.id === selectedId));
  const selected = matches[selectedIndex];
  const start = Math.floor(selectedIndex / labWindowSize) * labWindowSize;
  const window = matches.slice(start, start + labWindowSize);
  const strongest = matches[0]?.score || 1;
  const relations = focus && selected ? relatedLabItems(selected.item, matches.map(match => match.item)) : [];
  const focusItems = new Set([selected?.item.id, ...relations.map(item => item.id)]);
  const displayed = focus ? matches.filter(match => focusItems.has(match.item.id)) : window;
  const contextual = selected ? relatedLabItems(selected.item, displayed.map(match => match.item)) : [];
  const visualOrder = selected ? [selected.item.id, ...contextual.map(item => item.id),
    ...displayed.filter(match => match.item.id !== selected.item.id && !contextual.some(item => item.id === match.item.id)).map(match => match.item.id)] : [];
  const leadKind = selected?.item.kind;
  const worldX = direction === "editorial" ? 34 : leadKind === "person" ? 64 : leadKind === "writing" ? 68 : 50;
  return {
    direction, focus, matches, selectedIndex, start, end: start + window.length,
    canvas: direction === "atlas",
    height: direction === "atlas" ? {wide:760,compact:640} : {wide:1330,compact:2000},
    world: { wide: {x:worldX,y:direction === "editorial" ? 630 : leadKind === "writing" ? 300 : 350}, compact:{x:50,y:direction === "atlas" ? 230 : 490} },
    nodes: displayed.map((match) => {
      const isSelected = match.item.id === selected?.item.id;
      const order = visualOrder.indexOf(match.item.id);
      const relation = relations.findIndex(item => item.id === match.item.id);
      // A query changes the composition, never the authoritative ordering or membership.
      const arrangement = direction === "atlas" ? atlasSlots(displayed.length) : slots[direction];
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
        desktop: direction === "atlas" ? adaptedDesktop : focus ? isSelected ? {x:32,y:520} : {x:79,y:relation===0?760:950} : desktop,
        compact: direction === "atlas" ? compact : focus ? isSelected ? {x:50,y:420} : {x:50,y:relation===0?980:1160} : compact,
        depth: focus && !isSelected ? .86 : 1,
        scale: desktop.scale * weight, compactScale: compact.scale * weight,
        focusScale: focus ? isSelected ? 1.08 : .72 * weight : desktop.scale * weight,
        focusCompactScale: focus ? isSelected ? .98 : .54 * weight : compact.scale * weight,
        strength, turn: 0,
      };
    }),
  };
}
export type LabScene = ReturnType<typeof composeLabSpace>;

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
export function labConnection(from: SpacePoint, to: SpacePoint): string {
  const dx = to.x - from.x, dy = to.y - from.y;
  return "M " + from.x.toFixed(2) + " " + from.y.toFixed(2)
    + " C " + (from.x + dx * .28).toFixed(2) + " " + (from.y + dy * .68).toFixed(2)
    + ", " + (to.x - dx * .24).toFixed(2) + " " + (to.y - dy * .1).toFixed(2)
    + ", " + to.x.toFixed(2) + " " + to.y.toFixed(2);
}
