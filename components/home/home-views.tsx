"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

import { ContextCanvas } from "@/components/discovery/context-canvas";
import { useLocale } from "@/components/i18n/locale-context";
import { homeViewsCopy } from "@/data/i18n/home-views";
import { connectHomeViews } from "@/lib/home-view";

export function HomeViews({ discover, explore, bootstrap }: { discover: ReactNode; explore: ReactNode; bootstrap: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const copy = homeViewsCopy[useLocale()];

  useLayoutEffect(() => {
    if (!root.current) return;
    return connectHomeViews(root.current, window);
  }, []);

  return (
    <div id="home" ref={root} data-home-views className="home-views">
      <div className="home-view-toolbar" data-scroll-lock-compensate>
        <fieldset className="home-view-switch">
          <legend className="sr-only">{copy.label}</legend>
          <label className="home-view-choice">
            <input id="home-view-discover" type="radio" name="home-view" value="discover" defaultChecked aria-controls="home-discover-panel" aria-describedby="home-discover-description" />
            <span><strong>Discover</strong><small id="home-discover-description">{copy.discoverDescription}</small></span>
          </label>
          <label className="home-view-choice">
            <input id="home-view-explore" type="radio" name="home-view" value="explore" aria-controls="home-explore-panel" aria-describedby="home-explore-description" />
            <span><strong>Explore</strong><small id="home-explore-description">{copy.exploreDescription}</small></span>
          </label>
        </fieldset>
        {bootstrap}
      </div>
      <ContextCanvas>
        <div id="home-discover-panel" data-home-panel="discover" role="region" aria-label={`Discover — ${copy.discoverDescription}`}>
          {discover}
        </div>
        <div id="home-explore-panel" data-home-panel="explore" role="region" aria-label={`Explore — ${copy.exploreDescription}`}>
          {explore}
        </div>
      </ContextCanvas>
    </div>
  );
}
