"use client";

import { useEffect } from "react";

export function useRelationshipPrintMode() {
  useEffect(() => {
    const root = document.documentElement;
    const previousMarker = root.getAttribute("data-fyns-result-print");
    root.setAttribute("data-fyns-result-print", "");
    return () => {
      if (previousMarker === null) root.removeAttribute("data-fyns-result-print");
      else root.setAttribute("data-fyns-result-print", previousMarker);
    };
  }, []);
}
