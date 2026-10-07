import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { LocaleProvider } from "@/components/i18n/locale-context";
import { DiscoveryProvider } from "@/components/discovery/discovery-context";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { NavigationFeedback } from "@/components/navigation/navigation-feedback";
import { CanonicalSiteUrlProvider } from "@/components/site/canonical-site-url-context";
import { createHqPulseDiscoveryItems, createPublishedWritingDiscoveryItems, discoveryIndex } from "@/data/discovery-index";
import { createHqPulseItems } from "@/data/hq-pulse";
import { getAccountState } from "@/lib/account/state";
import { getPublishedWriting } from "@/lib/writing/queries";
import { getLocale } from "@/lib/i18n/server";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localeDetails, locales } from "@/lib/i18n/config";
import { getGlobalDictionary } from "@/data/i18n/global";
import { getSiteVerificationMetadata } from "@/lib/search-discovery";
import { absoluteSiteUrl, isCanonicalIndexingEnvironment, requireSiteUrl } from "@/lib/site-url";
import { cloudflareAnalyticsHeader, cloudflareBeaconData, cloudflareBeaconUrl, isCloudflareAnalyticsEnabled } from "@/lib/cloudflare-web-analytics";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = "Benjamin Trinidad Segura | Digital HQ";
  const description = getGlobalDictionary(locale).siteDescription;
  const verification = getSiteVerificationMetadata();
  const siteUrl = requireSiteUrl();
  return {
    metadataBase: siteUrl,
    applicationName: "btshq.online",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
        { url: "/icons/bts-app-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/bts-app-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
      apple: [{ url: "/icons/bts-apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
    },
    ...createLocalizedMetadata({ locale, pathname: "/", title, description }),
    ...(verification ? { verification } : {}),
    ...(!isCanonicalIndexingEnvironment() ? { robots: { index: false, follow: false, noarchive: true } } : {}),
  };
}

export const viewport: Viewport = { themeColor: "#04111b" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const siteUrl = requireSiteUrl();
  const requestHeaders = await headers();
  const analyticsEnabled = requestHeaders.get(cloudflareAnalyticsHeader) === "1" && isCloudflareAnalyticsEnabled({
    siteOrigin: siteUrl.origin, requestHost: requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"), nodeEnv: process.env.NODE_ENV, vercelEnv: process.env.VERCEL_ENV,
  });
  const [publishedWriting, accountState] = await Promise.all([
    getPublishedWriting(locale),
    getAccountState(),
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
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteSiteUrl("/#website", siteUrl),
    url: absoluteSiteUrl("/", siteUrl),
    name: "btshq.online Digital HQ",
    description: getGlobalDictionary(locale).siteDescription,
    inLanguage: locales.map((candidate) => localeDetails[candidate].htmlLang),
    publisher: { "@id": absoluteSiteUrl("/about#benjamin", siteUrl) },
  };
  return (
    <html lang={localeDetails[locale].htmlLang} data-scroll-behavior="adaptive">
      <body className="min-h-full">
        <NavigationFeedback />
        <LocaleProvider locale={locale}>
          <CanonicalSiteUrlProvider canonicalSiteUrl={siteUrl.origin}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</gu, "\\u003c") }} />
            <a className="skip-link" href="#main-content">
              {getGlobalDictionary(locale).skipLink}
            </a>
            <DiscoveryProvider items={discoveryItems}>
              <Header accountState={accountState} />
              <main id="main-content">{children}</main>
            </DiscoveryProvider>
            <Footer />
          </CanonicalSiteUrlProvider>
        </LocaleProvider>
        {analyticsEnabled ? <Script id="cloudflare-web-analytics" type="module" src={cloudflareBeaconUrl} data-cf-beacon={cloudflareBeaconData} strategy="afterInteractive" /> : null}
      </body>
    </html>
  );
}
