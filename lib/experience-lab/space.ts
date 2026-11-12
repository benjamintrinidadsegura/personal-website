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
const slots: Record<LabDirection, { wide: readonly Slot[]; compact: readonly Slot[] }> = {
  atlas: {
    wide: [{x:35,y:720,scale:1},{x:79,y:650,scale:1},{x:79,y:820,scale:1},
      {x:18,y:980,scale:1},{x:50,y:980,scale:1},{x:82,y:980,scale:1}],
    compact: [{x:50,y:600,scale:1},{x:50,y:910,scale:1},{x:50,y:1090,scale:1},
      {x:50,y:1270,scale:1},{x:50,y:1450,scale:1},{x:50,y:1630,scale:1}],
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
    direction, focus, selectedIndex, start, end: start + window.length,
    height: { wide: focus ? 1150 : direction === "atlas" ? 1100 : 1330, compact: focus ? 900 : !displayed.length ? 1200 : Math.max(900, slots[direction].compact[displayed.length - 1].y + 160) },
    world: { wide: {x:worldX,y:direction === "editorial" ? 630 : leadKind === "writing" ? 300 : 350}, compact:{x:50,y:direction === "atlas" ? 230 : 490} },
    nodes: displayed.map((match) => {
      const isSelected = match.item.id === selected?.item.id;
      const order = visualOrder.indexOf(match.item.id);
      const relation = relations.findIndex(item => item.id === match.item.id);
      const desktop = slots[direction].wide[order], compact = slots[direction].compact[order];
      const adaptedDesktop = direction === "atlas" && !focus
        ? isSelected && leadKind === "writing" ? { ...desktop, x:35, y:700 }
          : isSelected && leadKind === "world" ? { ...desktop, x:32, y:720 }
          : order === 1 && displayed.length <= 2 ? { ...desktop, y:760 } : desktop
        : desktop;
      const strength = match.score ? Math.max(.35, match.score / strongest) : .7;
      const weight = isSelected ? 1 : match.score ? .97 + .03 * strength : 1;
      return {
        ...match, index: matches.indexOf(match), relation: focus && !isSelected,
        role: isSelected ? "lead" : focus || order < 3 ? "feature" : "note",
        desktop: focus ? isSelected ? { x: 32, y: 520 } : { x: 79, y: relation === 0 ? 760 : 950 } : adaptedDesktop,
        compact: focus ? isSelected ? { x: 50, y: 420 } : { x: 50, y: relation === 0 ? 980 : 1160 } : compact,
        depth: focus && !isSelected ? .86 : 1, scale: desktop.scale * weight, compactScale: compact.scale * weight,
        focusScale: focus ? isSelected ? 1 : .96 : desktop.scale,
        focusCompactScale: focus ? isSelected ? 1 : .96 : compact.scale,
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
