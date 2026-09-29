import type { SocialLink } from "@/types/content";

export const PUBLIC_CANONICAL_SOURCE_URL = "https://btshq.online" as const;

export const siteConfig = {
  name: "Benjamin Trinidad Segura",
  domain: "btshq.online",
  email: "goatrecrutainer@gmail.com",
  socialLinks: [
    { label: "TikTok", url: "https://www.tiktok.com/@goatrecrutainer", context: "GOATRECRUTAINER" },
    { label: "Instagram", url: "https://www.instagram.com/goatrecrutainer", context: "GOATRECRUTAINER" },
    { label: "YouTube", url: "https://www.youtube.com/@goatrecrutainer", context: "GOATRECRUTAINER" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/benjamín-trinidad-segura-590760158/", context: "Benjamin Trinidad Segura" },
  ] satisfies SocialLink[],
  booking: {
    label: "Termin buchen",
    url: null as string | null,
  },
};
