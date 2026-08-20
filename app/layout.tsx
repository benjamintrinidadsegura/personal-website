import type { Metadata } from "next";
import { LocaleProvider } from "@/components/i18n/locale-context";
import { DiscoveryProvider } from "@/components/discovery/discovery-context";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { NavigationFeedback } from "@/components/navigation/navigation-feedback";
import { createHqPulseDiscoveryItems, createPublishedWritingDiscoveryItems, discoveryIndex } from "@/data/discovery-index";
import { createHqPulseItems } from "@/data/hq-pulse";
import { getAccountState } from "@/lib/account/state";
import { getPublishedWriting } from "@/lib/writing/queries";
import { getLocale } from "@/lib/i18n/server";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localeDetails } from "@/lib/i18n/config";
import { getGlobalDictionary } from "@/data/i18n/global";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = "Benjamin Trinidad Segura | Digital HQ";
  const description = getGlobalDictionary(locale).siteDescription;
  return {
    metadataBase: new URL("https://bts.online"),
    applicationName: "bts.online",
    ...createLocalizedMetadata({ locale, pathname: "/", title, description }),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [publishedWriting, accountState, locale] = await Promise.all([
    getPublishedWriting(),
    getAccountState(),
    getLocale(),
  ]);
  const hasPublishedWriting = publishedWriting.length > 0;
  const staticDiscoveryItems = discoveryIndex.filter((item) => (
    !item.id.startsWith("pulse-") && (!hasPublishedWriting || !item.id.match(/^writing-\d+$/u))
  ));
  const resolvedPulseItems = createHqPulseItems({ publishedWriting });
  const discoveryItems = [
    ...staticDiscoveryItems,
    ...createPublishedWritingDiscoveryItems(publishedWriting),
    ...createHqPulseDiscoveryItems(resolvedPulseItems),
  ];
  return (
    <html lang={localeDetails[locale].htmlLang} data-scroll-behavior="smooth">
      <body className="min-h-full">
        <NavigationFeedback />
        <LocaleProvider locale={locale}>
          <a className="skip-link" href="#main-content">
            {getGlobalDictionary(locale).skipLink}
          </a>
          <DiscoveryProvider items={discoveryItems}>
            <Header accountState={accountState} />
            <main id="main-content">{children}</main>
          </DiscoveryProvider>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
