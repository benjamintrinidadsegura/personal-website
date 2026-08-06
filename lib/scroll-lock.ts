interface ScrollLockSnapshot {
  scrollX: number;
  scrollY: number;
  bodyOverflow: string;
  bodyPaddingRight: string;
  bodyHadScrollLock: boolean;
  rootCompensation: string;
}

const activeLocks = new Set<symbol>();
let snapshot: ScrollLockSnapshot | null = null;

function applyScrollLock() {
  const root = document.documentElement;
  const body = document.body;
  const clientWidthBeforeLock = root.clientWidth;
  const computedPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

  snapshot = {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
    bodyHadScrollLock: "scrollLocked" in body.dataset,
    rootCompensation: root.style.getPropertyValue("--scrollbar-compensation"),
  };

  body.dataset.scrollLocked = "true";
  body.style.overflow = "hidden";

  const supportsStableScrollbarGutter = typeof CSS !== "undefined" && CSS.supports("scrollbar-gutter: stable");
  const removedScrollbarWidth = supportsStableScrollbarGutter
    ? 0
    : Math.max(0, root.clientWidth - clientWidthBeforeLock);
  root.style.setProperty("--scrollbar-compensation", `${removedScrollbarWidth}px`);
  if (removedScrollbarWidth > 0) {
    body.style.paddingRight = `${computedPaddingRight + removedScrollbarWidth}px`;
  }
}

function restoreScrollLock() {
  if (!snapshot) return;

  const root = document.documentElement;
  const body = document.body;
  const previous = snapshot;
  snapshot = null;

  body.style.overflow = previous.bodyOverflow;
  body.style.paddingRight = previous.bodyPaddingRight;
  if (!previous.bodyHadScrollLock) delete body.dataset.scrollLocked;

  if (previous.rootCompensation) {
    root.style.setProperty("--scrollbar-compensation", previous.rootCompensation);
  } else {
    root.style.removeProperty("--scrollbar-compensation");
  }

  if (window.scrollX !== previous.scrollX || window.scrollY !== previous.scrollY) {
    root.dataset.scrollRestoring = "true";
    window.scrollTo(previous.scrollX, previous.scrollY);
    window.requestAnimationFrame(() => delete root.dataset.scrollRestoring);
  }
}

/**
 * Locks background scrolling without changing the window scroll position.
 * Every caller owns an independent token so overlapping UI surfaces cannot
 * release another surface's lock.
 */
export function acquireScrollLock() {
  if (typeof window === "undefined") return () => undefined;

  const token = Symbol("scroll-lock");
  if (activeLocks.size === 0) applyScrollLock();
  activeLocks.add(token);
  let released = false;

  return () => {
    if (released) return;
    released = true;
    activeLocks.delete(token);
    if (activeLocks.size === 0) restoreScrollLock();
  };
}
