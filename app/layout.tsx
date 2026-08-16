import type { Metadata } from "next";
import { DiscoveryProvider } from "@/components/discovery/discovery-context";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { createHqPulseDiscoveryItems, createPublishedWritingDiscoveryItems, discoveryIndex } from "@/data/discovery-index";
import { createHqPulseItems } from "@/data/hq-pulse";
import { getAccountState } from "@/lib/account/state";
import { getPublishedWriting } from "@/lib/writing/queries";
import "./globals.css";

const title = "Benjamin Trinidad Segura | Digital HQ";
const description =
  "Persönliche Website von Benjamin Trinidad Segura über Recruiting, Projekte, Stories, Careers und Communities.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bts.online"),
  title,
  description,
  applicationName: "bts.online",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    siteName: "bts.online",
    title,
    description,
    images: [{ url: "/og.png", width: 1732, height: 909, alt: "Benjamin Trinidad Segura – Digital HQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [publishedWriting, accountState] = await Promise.all([
    getPublishedWriting(),
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
  return (
    <html lang="de">
      <body className="min-h-full">
        <a className="skip-link" href="#main-content">
          Zum Inhalt springen
        </a>
        <DiscoveryProvider items={discoveryItems}>
          <Header accountState={accountState} />
          <main id="main-content">{children}</main>
        </DiscoveryProvider>
        <Footer />
      </body>
    </html>
  );
}
