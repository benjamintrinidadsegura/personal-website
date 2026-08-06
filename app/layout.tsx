import type { Metadata } from "next";
import { DiscoveryProvider } from "@/components/discovery/discovery-context";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="min-h-full">
        <a className="skip-link" href="#main-content">
          Zum Inhalt springen
        </a>
        <DiscoveryProvider>
          <Header />
          <main id="main-content">{children}</main>
        </DiscoveryProvider>
        <Footer />
      </body>
    </html>
  );
}
