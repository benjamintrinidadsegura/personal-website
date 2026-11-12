import type { LabMatch } from "./search";

export const labWindowSize = 6;
export type SpacePoint = { x: number; y: number };
const desktop: Record<number, readonly SpacePoint[]> = {
  1: [{ x: 50, y: 80 }],
  2: [{ x: 18, y: 44 }, { x: 82, y: 47 }],
  3: [{ x: 18, y: 25 }, { x: 82, y: 29 }, { x: 50, y: 82 }],
  4: [{ x: 18, y: 24 }, { x: 82, y: 24 }, { x: 19, y: 73 }, { x: 81, y: 75 }],
  5: [{ x: 18, y: 23 }, { x: 82, y: 22 }, { x: 15, y: 65 }, { x: 85, y: 67 }, { x: 50, y: 85 }],
  6: [{ x: 18, y: 22 }, { x: 82, y: 22 }, { x: 15, y: 64 }, { x: 85, y: 64 }, { x: 37, y: 86 }, { x: 63, y: 86 }],
};
const compact: Record<number, readonly SpacePoint[]> = {
  1: [{ x: 50, y: 67 }],
  2: [{ x: 25, y: 65 }, { x: 75, y: 65 }],
  3: [{ x: 50, y: 11 }, { x: 25, y: 65 }, { x: 75, y: 65 }],
  4: [{ x: 25, y: 11 }, { x: 75, y: 11 }, { x: 25, y: 65 }, { x: 75, y: 65 }],
  5: [{ x: 25, y: 11 }, { x: 75, y: 11 }, { x: 25, y: 62 }, { x: 75, y: 62 }, { x: 50, y: 86 }],
  6: [{ x: 25, y: 11 }, { x: 75, y: 11 }, { x: 25, y: 62 }, { x: 75, y: 62 }, { x: 25, y: 86 }, { x: 75, y: 86 }],
};

/** Bounded, deterministic compositions; all matches remain reachable through selection. */
export function composeLabSpace(matches: readonly LabMatch[], selectedId: string) {
  const selectedIndex = Math.max(0, matches.findIndex(({ item }) => item.id === selectedId));
  const start = Math.floor(selectedIndex / labWindowSize) * labWindowSize;
  const window = matches.slice(start, start + labWindowSize);
  const strongest = matches[0]?.score || 1;
  return {
    selectedIndex, start, end: start + window.length,
    nodes: window.map((match, index) => ({
      ...match, index: start + index,
      desktop: desktop[window.length][index],
      compact: compact[window.length][index],
      strength: match.score ? Math.max(.35, match.score / strongest) : .7,
      turn: [-3, 3, -2, 2, -2, 2][index],
    })),
  };
}

export function labConnection(point: SpacePoint, compact = false): string {
  const origin = compact ? 350 : 440;
  const x = point.x * 10, y = point.y * 10;
  return "M 500 " + origin + " C 500 " + (origin + (y - origin) * .5) + ", " + x + " " + (origin + (y - origin) * .65) + ", " + x + " " + y;
}
