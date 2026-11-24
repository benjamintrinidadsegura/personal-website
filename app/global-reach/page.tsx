import { permanentRedirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { localizeHref } from "@/lib/i18n/routing";

export default async function GlobalReachPage() {
  permanentRedirect(localizeHref("/community#global-reach", await getLocale()));
}