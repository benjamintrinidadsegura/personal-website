import { relatedLabItems, type LabMatch } from "./search";

export const labWindowSize = 6;
export type SpacePoint = { x: number; y: number };
export type MotionPoint = SpacePoint & { opacity: number; scale: number; turn: number };
const wide: Record<number, readonly SpacePoint[]> = {
  1:[{x:50,y:570}],2:[{x:19,y:240},{x:81,y:255}],
  3:[{x:17,y:120},{x:83,y:125},{x:50,y:565}],
  4:[{x:17,y:115},{x:83,y:125},{x:19,y:475},{x:82,y:505}],
  5:[{x:17,y:115},{x:83,y:125},{x:18,y:440},{x:83,y:450},{x:50,y:590}],
  6:[{x:17,y:115},{x:83,y:125},{x:17,y:410},{x:83,y:430},{x:40,y:560},{x:65,y:590}],
};
const compact: Record<number, readonly SpacePoint[]> = {
  1:[{x:50,y:500}],2:[{x:25,y:500},{x:75,y:520}],
  3:[{x:50,y:120},{x:25,y:700},{x:75,y:700}],
  4:[{x:25,y:120},{x:75,y:130},{x:25,y:710},{x:75,y:710}],
  5:[{x:25,y:120},{x:75,y:130},{x:25,y:710},{x:75,y:710},{x:50,y:1000}],
  6:[{x:25,y:120},{x:75,y:130},{x:25,y:710},{x:75,y:710},{x:25,y:1000},{x:75,y:1000}],
};
const wideHeight=[540,770,660,710,740,750,750];
const compactHeight=[540,710,710,850,870,1130,1130];
/** Deterministic compositions. Y is a pixel offset, keeping the search anchor stable. */
export function composeLabSpace(matches: readonly LabMatch[], selectedId: string, focus = false) {
  const selectedIndex = Math.max(0, matches.findIndex(({ item }) => item.id === selectedId));
  const start = Math.floor(selectedIndex / labWindowSize) * labWindowSize;
  const window = matches.slice(start, start + labWindowSize);
  const strongest = matches[0]?.score || 1;
  const selected = matches[selectedIndex];
  // Focus is a world of the selected object and at most two evidenced relations.
  // Search ranking and the complete result window remain authoritative on return.
  const relations = focus && selected ? relatedLabItems(selected.item, matches.map(match => match.item)) : [];
  const focusItems = new Set([selected?.item.id, ...relations.map(item => item.id)]);
  const displayed = focus ? matches.filter(match => focusItems.has(match.item.id)) : window;
  return {
    height:{wide:focus?900:wideHeight[window.length],compact:focus?900:compactHeight[window.length]}, focus, selectedIndex, start, end: start + window.length,
    nodes: displayed.map((match, index) => {
      const selected=match.item.id===selectedId;
      const relation = relations.findIndex(item => item.id === match.item.id);
      const strength = match.score ? Math.max(.35, match.score / strongest) : .7;
      // Evidence changes visual hierarchy, never the underlying match order.
      const scale = match.score ? .88 + .12 * strength : index < 2 ? 1 : .94;
      return {
      ...match, index: focus ? matches.indexOf(match) : start + index, relation: focus && !selected,
      desktop: focus ? selected ? {x:50,y:565} : {x:relation === 0 ? 17 : 83,y:610} : wide[window.length][index],
      compact: focus ? selected ? {x:50,y:510} : {x:relation === 0 ? 25 : 75,y:785} : compact[window.length][index],
      depth: focus && !selected ? .78 : 1, scale,
      focusScale: focus ? selected ? 1.65 : .72 : scale, focusCompactScale: focus ? selected ? 1.4 : .8 : scale,
      strength,
      turn: [-3, 2, -2, 3, -2, 2][index],
    }; }),
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
