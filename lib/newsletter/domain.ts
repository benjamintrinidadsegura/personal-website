export const NEWSLETTER_CONSENT_VERSION = "newsletter-consent-v1";
export const NEWSLETTER_PRIVACY_VERSION = "newsletter-privacy-v1";

export const newsletterPromise = {
  en: "New Writing and occasional updates from the Digital HQ. No fixed schedule, no spam.",
  de: "Neue Texte und gelegentliche Updates aus dem Digital HQ. Kein fester Rhythmus, kein Spam.",
} as const;

export const newsletterConsentCopy = {
  en: `I consent to receive the bts.online newsletter by email: ${newsletterPromise.en} I can unsubscribe at any time.`,
  de: `Ich willige ein, den bts.online Newsletter per E-Mail zu erhalten: ${newsletterPromise.de} Ich kann mich jederzeit abmelden.`,
} as const;
