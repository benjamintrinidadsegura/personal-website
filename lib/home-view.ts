export const homeViewStorageKey = "btshq:home-view:v1";
export const homeViews = ["discover", "explore"] as const;
export type HomeView = (typeof homeViews)[number];
type ViewStorage = Pick<Storage, "getItem" | "setItem">;
type HomeRoot = HTMLElement & { btsHomeRestored?: boolean; btsHomeRestorePreference?: () => void };

export function isHomeView(value: unknown): value is HomeView {
  return value === "discover" || value === "explore";
}

export function readHomeViewPreference(storage: () => ViewStorage): HomeView | null {
  try {
    const value = storage().getItem(homeViewStorageKey);
    return isHomeView(value) ? value : null;
  } catch { return null; }
}

export function saveHomeViewPreference(storage: () => ViewStorage, view: HomeView): void {
  try { storage().setItem(homeViewStorageKey, view); } catch { /* The current view still works without storage. */ }
}

function viewInput(root: HTMLElement, view: HomeView) {
  return root.querySelector<HTMLInputElement>(`input[name="home-view"][value="${view}"]`);
}

export function selectHomeView(root: HTMLElement, view: HomeView): void {
  const input = viewInput(root, view);
  if (input) input.checked = true;
}

/** Reveal before measuring, scrolling or focusing. Anchor navigation never saves a preference. */
export function revealHomeAnchor(target: HTMLElement): void {
  const restorePreference = (target as HomeRoot).btsHomeRestorePreference;
  if (restorePreference) {
    restorePreference();
    return;
  }
  const panel = target.closest<HTMLElement>("[data-home-panel]");
  const root = panel?.closest<HTMLElement>("[data-home-views]");
  const view = panel?.dataset.homePanel;
  if (root && isHomeView(view)) selectHomeView(root, view);
}

export function connectHomeViews(root: HomeRoot, browser: Window): () => void {
  const storage = () => browser.localStorage;
  let preference = readHomeViewPreference(storage) ?? "discover";
  // On hard loads the parser script already restored the native radio property.
  // On soft navigations this layout-effect initialization runs before paint.
  if (!root.btsHomeRestored) selectHomeView(root, preference);
  // Same-document navigation uses pushState and does not emit hashchange.
  // Keep the restoration bound to this controller's latest in-memory preference,
  // including explicit selections made while browser storage is unavailable.
  root.btsHomeRestorePreference = () => selectHomeView(root, preference);

  const reconcileLocation = () => {
    let id = "";
    try { id = decodeURIComponent(browser.location.hash.slice(1)); } catch { return; }
    if (!id || id === "home") selectHomeView(root, preference);
    else {
      const target = root.ownerDocument.getElementById(id);
      if (target && root.contains(target)) revealHomeAnchor(target);
    }
  };
  const onChange = (event: Event) => {
    const selected = homeViews.find((view) => event.target === viewInput(root, view));
    if (!selected) return;
    preference = selected;
    saveHomeViewPreference(storage, selected);
  };
  reconcileLocation();
  root.addEventListener("change", onChange);
  browser.addEventListener("popstate", reconcileLocation);
  browser.addEventListener("hashchange", reconcileLocation);
  browser.addEventListener("pageshow", reconcileLocation);
  return () => {
    delete root.btsHomeRestorePreference;
    root.removeEventListener("change", onChange);
    browser.removeEventListener("popstate", reconcileLocation);
    browser.removeEventListener("hashchange", reconcileLocation);
    browser.removeEventListener("pageshow", reconcileLocation);
  };
}

// Static, bounded script: only native checked properties are changed, not SSR text
// or attributes. React preserves those properties during hydration. Run before
// the panels are parsed; the full Explore tree is rendered exactly once.
export const homeViewBootstrap = `(()=>{const root=document.getElementById("home");if(!root)return;let view="discover";try{const saved=localStorage.getItem(${JSON.stringify(homeViewStorageKey)});if(saved==="discover"||saved==="explore")view=saved;}catch{}let id="";try{id=decodeURIComponent(location.hash.slice(1));}catch{}if(${JSON.stringify(["explore-home", "now", "quote", "pulse", "building", "writing", "interviews", "echowall", "about", "feedback", "contact"])}.includes(id))view="explore";const input=root.querySelector('input[name="home-view"][value="'+view+'"]');if(input)input.checked=true;root.btsHomeRestored=true;})();`;
