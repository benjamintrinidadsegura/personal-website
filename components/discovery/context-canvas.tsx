"use client";

import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

import { ContextDiscoveryView } from "@/components/discovery/context-discovery-view";
import { useDiscovery } from "@/components/discovery/discovery-context";
import { acquireScrollLock } from "@/lib/scroll-lock";

function DiscoveryCanvasSurface({ overlayOpen }: { overlayOpen: boolean }) {
  const isPresent = useIsPresent();
  const reduceMotion = useReducedMotion();
  const hiddenFromInteraction = overlayOpen || !isPresent;

  useEffect(() => acquireScrollLock(), []);

  return (
    <motion.section
      key="context-discovery-view"
      data-context-discovery-view
      aria-labelledby="context-discovery-title"
      aria-hidden={hiddenFromInteraction || undefined}
      inert={hiddenFromInteraction}
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="section-lines fixed inset-x-0 bottom-0 top-20 z-40 overflow-y-auto overscroll-contain bg-[#061521] [scrollbar-gutter:stable]"
    >
      <ContextDiscoveryView />
    </motion.section>
  );
}

export function ContextCanvas({ children }: { children: ReactNode }) {
  const { query, overlayOpen } = useDiscovery();
  const reduceMotion = useReducedMotion();
  const discoveryActive = Boolean(query.trim());

  return (
    <>
      <motion.div
        data-context-home-view
        aria-hidden={discoveryActive || undefined}
        inert={discoveryActive}
        animate={{ opacity: discoveryActive ? 0 : 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={discoveryActive ? "pointer-events-none" : undefined}
      >
        {children}
      </motion.div>

      <AnimatePresence initial={false}>
        {discoveryActive && <DiscoveryCanvasSurface overlayOpen={overlayOpen} />}
      </AnimatePresence>
    </>
  );
}
