import type { SocialLink } from "@/types/content";

export const siteConfig = {
  name: "Benjamin Trinidad Segura",
  domain: "bts.online",
  // TODO: Vor Veröffentlichung mit Benjamin bestätigen.
  email: "hello@bts.online",
  socialLinks: [
    { label: "LinkedIn", url: null, placeholder: true },
    { label: "YouTube", url: null, placeholder: true },
    { label: "Spotify", url: null, placeholder: true },
  ] satisfies SocialLink[],
};
