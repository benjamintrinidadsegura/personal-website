import Link from "next/link";
import { communityCopy } from "@/data/i18n/community";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";

export function CommunityNav({ locale, current }: { locale: Locale; current?: string }) {
  const copy = communityCopy[locale];
  const destinations = [
    { href: "/community", label: copy.community },
    { href: "/global-reach", label: copy.reach },
    { href: "/echowall", label: "EchoWall" },
    { href: "/world", label: "Connection Map" },
  ];
  return <nav aria-label={copy.community} className="community-nav">
    {destinations.map(({ href, label }) => <Link key={href} href={localizeHref(href, locale)}
      aria-current={current === href ? "page" : undefined}>{label}</Link>)}
  </nav>;
}
