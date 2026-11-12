import type { LabMatch } from "./search";

export const labWindowSize = 6;
export type SpacePoint = { x: number; y: number };
export type MotionPoint = SpacePoint & { opacity: number; scale: number; turn: number };
const wide: Record<number, readonly SpacePoint[]> = {
  1:[{x:50,y:585}],2:[{x:16,y:310},{x:84,y:320}],
  3:[{x:16,y:105},{x:84,y:105},{x:50,y:535}],
  4:[{x:16,y:105},{x:84,y:105},{x:16,y:470},{x:84,y:470}],
  5:[{x:16,y:105},{x:84,y:105},{x:15,y:400},{x:85,y:400},{x:50,y:555}],
  6:[{x:16,y:105},{x:84,y:105},{x:15,y:390},{x:85,y:405},{x:39,y:555},{x:65,y:555}],
};
const compact: Record<number, readonly SpacePoint[]> = {
  1:[{x:50,y:480}],2:[{x:25,y:490},{x:75,y:510}],
  3:[{x:50,y:110},{x:25,y:660},{x:75,y:660}],
  4:[{x:25,y:110},{x:75,y:110},{x:25,y:660},{x:75,y:660}],
  5:[{x:25,y:110},{x:75,y:110},{x:25,y:660},{x:75,y:660},{x:50,y:940}],
  6:[{x:25,y:110},{x:75,y:110},{x:25,y:660},{x:75,y:660},{x:25,y:940},{x:75,y:940}],
};
const wideHeight=[540,760,650,690,690,690,690];
const compactHeight=[520,680,680,820,820,1100,1100];
/** Deterministic compositions. Y is a pixel offset, keeping the search anchor stable. */
export function composeLabSpace(matches: readonly LabMatch[], selectedId: string, focus = false) {
  const selectedIndex = Math.max(0, matches.findIndex(({ item }) => item.id === selectedId));
  const start = Math.floor(selectedIndex / labWindowSize) * labWindowSize;
  const window = matches.slice(start, start + labWindowSize);
  const strongest = matches[0]?.score || 1;
  return {
    height:{wide:focus?900:wideHeight[window.length],compact:focus?620:compactHeight[window.length]}, focus, selectedIndex, start, end: start + window.length,
    nodes: window.map((match, index) => {
      const selected=match.item.id===selectedId;

      return {
      ...match, index: start + index,
      desktop: focus && selected ? {x:26,y:500} : wide[window.length][index],
      compact: focus && selected ? {x:50,y:430} : compact[window.length][index],
      depth: focus && !selected ? 0 : 1,
      focusScale: focus ? selected ? 1.8 : .9 : 1, focusCompactScale: focus ? selected ? 1.22 : .9 : 1,
      strength: match.score ? Math.max(.35, match.score / strongest) : .7,
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
