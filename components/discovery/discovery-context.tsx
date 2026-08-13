"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { discoveryIndex } from "@/data/discovery-index";
import { createAdaptiveDiscoveryView, discoverItems, groupDiscoveryItems } from "@/lib/discovery";
import type { AdaptiveDiscoveryView, DiscoveryGroup, DiscoveryItem, DiscoveryMatch } from "@/types/discovery";

interface DiscoveryContextValue {
  query: string;
  setQuery: (query: string) => void;
  matches: DiscoveryMatch[];
  groups: Map<DiscoveryGroup, DiscoveryMatch[]>;
  adaptiveView: AdaptiveDiscoveryView;
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
  selectedMatchId: string | null;
  selectMatch: (id: string) => void;
  navigationPending: boolean;
  beginCanvasNavigation: (targetHref: string) => number;
  settleCanvasNavigation: (targetHref: string, handoffId: number) => void;
  clearDiscovery: () => void;
}

interface CanvasNavigationHandoff {
  id: number;
  targetHref: string;
  sourcePathname: string;
}

function isCurrentLocation(targetHref: string) {
  const target = new URL(targetHref, window.location.href);

  return target.origin === window.location.origin
    && target.pathname === window.location.pathname
    && target.search === window.location.search
    && target.hash === window.location.hash;
}

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

export function DiscoveryProvider({ children, items = discoveryIndex }: { children: ReactNode; items?: DiscoveryItem[] }) {
  const pathname = usePathname();
  const [query, setQueryState] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [canvasNavigation, setCanvasNavigation] = useState<CanvasNavigationHandoff | null>(null);
  const [pendingAnchorId, setPendingAnchorId] = useState<string | null>(null);
  const canvasNavigationRef = useRef<CanvasNavigationHandoff | null>(null);
  const navigationSequence = useRef(0);

  const setNavigation = useCallback((navigation: CanvasNavigationHandoff | null) => {
    canvasNavigationRef.current = navigation;
    setCanvasNavigation(navigation);
  }, []);

  const resetDiscoveryState = useCallback(() => {
    setQueryState("");
    setSelectedMatchId(null);
    setNavigation(null);
    setPendingAnchorId(null);
  }, [setNavigation]);

  const completeCanvasNavigation = useCallback((targetHref: string) => {
    const target = new URL(targetHref, window.location.href);
    let anchorId: string | null = null;

    if (target.hash.length > 1) {
      try {
        anchorId = decodeURIComponent(target.hash.slice(1));
      } catch {
        anchorId = target.hash.slice(1);
      }
    }

    setQueryState("");
    setSelectedMatchId(null);
    setNavigation(null);
    setPendingAnchorId(anchorId);
  }, [setNavigation]);

  const setQuery = useCallback((nextQuery: string) => {
    setQueryState(nextQuery);
    setSelectedMatchId(null);
    setNavigation(null);
    setPendingAnchorId(null);
  }, [setNavigation]);
  const selectMatch = useCallback((id: string) => {
    setSelectedMatchId(id);
    setNavigation(null);
    setPendingAnchorId(null);
  }, [setNavigation]);
  const beginCanvasNavigation = useCallback((targetHref: string) => {
    const navigation = {
      id: navigationSequence.current + 1,
      targetHref,
      sourcePathname: pathname,
    };

    navigationSequence.current = navigation.id;
    setPendingAnchorId(null);
    setNavigation(navigation);
    return navigation.id;
  }, [pathname, setNavigation]);
  const settleCanvasNavigation = useCallback((targetHref: string, handoffId: number) => {
    const navigation = canvasNavigationRef.current;

    if (!navigation || navigation.id !== handoffId || navigation.targetHref !== targetHref) return;

    if (isCurrentLocation(targetHref)) {
      completeCanvasNavigation(targetHref);
      return;
    }

    setNavigation(null);
  }, [completeCanvasNavigation, setNavigation]);
  const clearDiscovery = resetDiscoveryState;

  useEffect(() => {
    const navigation = canvasNavigationRef.current;

    if (!navigation || pathname === navigation.sourcePathname) return;

    if (isCurrentLocation(navigation.targetHref)) {
      completeCanvasNavigation(navigation.targetHref);
      return;
    }

    setNavigation(null);
  }, [completeCanvasNavigation, pathname, setNavigation]);

  useEffect(() => {
    if (!canvasNavigation) return;

    const commitReachedTarget = () => {
      const navigation = canvasNavigationRef.current;
      if (navigation && isCurrentLocation(navigation.targetHref)) completeCanvasNavigation(navigation.targetHref);
    };

    commitReachedTarget();
    window.addEventListener("hashchange", commitReachedTarget);
    window.addEventListener("popstate", commitReachedTarget);
    return () => {
      window.removeEventListener("hashchange", commitReachedTarget);
      window.removeEventListener("popstate", commitReachedTarget);
    };
  }, [canvasNavigation, completeCanvasNavigation]);

  useEffect(() => {
    if (!pendingAnchorId) return;

    let frame = 0;
    const restoreAnchor = () => {
      if (document.querySelector("[data-context-discovery-view]")) return false;

      frame = window.requestAnimationFrame(() => {
        document.getElementById(pendingAnchorId)?.scrollIntoView();
        setPendingAnchorId((current) => current === pendingAnchorId ? null : current);
      });
      return true;
    };

    if (restoreAnchor()) return () => window.cancelAnimationFrame(frame);

    const observer = new MutationObserver(() => {
      if (!restoreAnchor()) return;
      observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [pendingAnchorId]);

  const matches = useMemo(() => discoverItems(items, query), [items, query]);
  const groups = useMemo(() => groupDiscoveryItems(matches), [matches]);
  const adaptiveView = useMemo(() => createAdaptiveDiscoveryView(matches, selectedMatchId), [matches, selectedMatchId]);
  const value = useMemo(
    () => ({
      query,
      setQuery,
      matches,
      groups,
      adaptiveView,
      overlayOpen,
      setOverlayOpen,
      selectedMatchId,
      selectMatch,
      navigationPending: canvasNavigation !== null,
      beginCanvasNavigation,
      settleCanvasNavigation,
      clearDiscovery,
    }),
    [adaptiveView, beginCanvasNavigation, canvasNavigation, clearDiscovery, groups, matches, overlayOpen, query, selectMatch, selectedMatchId, setQuery, settleCanvasNavigation],
  );

  return <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>;
}

export function useDiscovery() {
  const context = useContext(DiscoveryContext);

  if (!context) {
    throw new Error("useDiscovery must be used within a DiscoveryProvider");
  }

  return context;
}
