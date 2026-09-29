"use client";

import { createContext, useContext, type ReactNode } from "react";

const CanonicalSiteUrlContext = createContext<string | null>(null);

export function CanonicalSiteUrlProvider({
  canonicalSiteUrl,
  children,
}: {
  canonicalSiteUrl: string;
  children: ReactNode;
}) {
  return (
    <CanonicalSiteUrlContext.Provider value={canonicalSiteUrl}>
      {children}
    </CanonicalSiteUrlContext.Provider>
  );
}

export function useCanonicalSiteUrl(): string {
  const canonicalSiteUrl = useContext(CanonicalSiteUrlContext);
  if (!canonicalSiteUrl) throw new Error("useCanonicalSiteUrl must be used within CanonicalSiteUrlProvider");
  return canonicalSiteUrl;
}
