type Dependencies = readonly unknown[];
type Slot = { value?: unknown; deps?: Dependencies; cleanup?: () => void };
const same = (left?: Dependencies, right?: Dependencies) => Boolean(left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index])));

/** Minimal hook scheduler for state/effect contracts; does not model a browser or React DOM. */
export function hookHarness() {
  const slots: Slot[] = [];
  let cursor = 0;
  let dirty = false;
  let effects: Array<() => void> = [];
  const memo = <T>(compute: () => T, deps: Dependencies): T => {
    const index = cursor++;
    if (!slots[index] || !same(slots[index].deps, deps)) slots[index] = { value: compute(), deps };
    return slots[index].value as T;
  };
  const hooks = {
    useState: <T>(initial: T | (() => T)) => {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? (initial as () => T)() : initial };
      return [slots[index].value as T, (next: T | ((previous: T) => T)) => {
        const value = typeof next === "function" ? (next as (previous: T) => T)(slots[index].value as T) : next;
        if (!Object.is(value, slots[index].value)) { slots[index].value = value; dirty = true; }
      }] as const;
    },
    useRef: <T>(initial: T) => {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: { current: initial } };
      return slots[index].value as { current: T };
    },
    useMemo: memo,
    useCallback: <T>(callback: T, deps: Dependencies) => memo(() => callback, deps),
    useEffect: (effect: () => void | (() => void), deps: Dependencies) => {
      const index = cursor++;
      const previous = slots[index];
      if (same(previous?.deps, deps)) return;
      slots[index] = { deps, cleanup: previous?.cleanup };
      effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = effect() || undefined; });
    },
  };
  return {
    hooks,
    render<T>(component: () => T): T {
      let output: T;
      let attempts = 0;
      do {
        if (++attempts > 20) throw new Error("Hook fixture did not settle");
        cursor = 0;
        dirty = false;
        effects = [];
        output = component();
        for (const effect of effects) effect();
      } while (dirty);
      return output;
    },
    unmount: () => { for (const slot of slots) slot.cleanup?.(); },
  };
}
