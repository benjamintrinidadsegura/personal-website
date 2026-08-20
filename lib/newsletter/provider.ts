import type { NewsletterRuntimeConfiguration } from "@/lib/newsletter/config";
import { createNewsletterEditionEmailContent, type NewsletterEditionEmail } from "@/lib/newsletter/template";
import { getNewsletterDictionary } from "@/data/i18n/newsletter";
import { localeDetails, type Locale } from "@/lib/i18n/config";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
export const NEWSLETTER_PROVIDER_TIMEOUT_MS = 5_000;

export type ConfirmationEmail = {
  to: string;
  confirmationUrl: string;
  expiresAt: string;
  locale?: Locale;
};

export type SendConfirmationEmail = (email: ConfirmationEmail) => Promise<boolean>;

export type NewsletterProviderResult =
  | { status: "accepted"; messageReference: string }
  | { status: "rejected"; code: string }
  | { status: "ambiguous"; code: "timeout_or_network" | "provider_uncertain" };

export type SendNewsletterEditionEmail = (
  email: NewsletterEditionEmail & { to: string; deliveryId: string },
) => Promise<NewsletterProviderResult>;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createConfirmationEmailContent(input: ConfirmationEmail) {
  const locale = input.locale ?? "en";
  const copy = getNewsletterDictionary(locale).email;
  const safeUrl = escapeHtml(input.confirmationUrl);
  const expires = new Intl.DateTimeFormat(localeDetails[locale].htmlLang, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(input.expiresAt));
  const subject = copy.subject;
  const textContent = [
    copy.heading,
    "",
    copy.body,
    "",
    `${copy.confirmLabel}: ${input.confirmationUrl}`,
    "",
    `${copy.expiresPrefix} ${expires} (Europe/Berlin). ${copy.ignore}`,
  ].join("\n");
  const htmlContent = `<!doctype html><html lang="${localeDetails[locale].htmlLang}"><body style="margin:0;background:#041018;color:#e8f3f8;font-family:Arial,sans-serif"><main style="max-width:620px;margin:0 auto;padding:48px 24px"><p style="color:#35d0e5;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">bts.online · Newsletter</p><h1 style="font-size:32px;line-height:1.1">${escapeHtml(copy.heading)}</h1><p style="font-size:17px;line-height:1.7;color:#c4d3dc">${escapeHtml(copy.body)}</p><p style="margin:32px 0"><a href="${safeUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#35d0e5;color:#041018;font-weight:800;text-decoration:none">${escapeHtml(copy.action)}</a></p><p style="font-size:13px;line-height:1.6;color:#8295a3">${escapeHtml(copy.expiresPrefix)} ${escapeHtml(expires)} (Europe/Berlin). ${escapeHtml(copy.ignore)}</p></main></body></html>`;
  return { subject, textContent, htmlContent };
}

export function createBrevoConfirmationSender(
  configuration: NewsletterRuntimeConfiguration,
  fetcher: typeof fetch = fetch,
  timeoutMs = NEWSLETTER_PROVIDER_TIMEOUT_MS,
): SendConfirmationEmail {
  return async (email) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const content = createConfirmationEmailContent(email);
      const response = await fetcher(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": configuration.providerApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "bts.online", email: configuration.fromEmail },
          replyTo: { name: "Benjamin Trinidad Segura", email: configuration.replyToEmail },
          to: [{ email: email.to }],
          subject: content.subject,
          textContent: content.textContent,
          htmlContent: content.htmlContent,
          tags: ["newsletter-double-opt-in"],
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      return response.status === 201;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };
}

export function createBrevoNewsletterSender(
  configuration: NewsletterRuntimeConfiguration,
  fetcher: typeof fetch = fetch,
  timeoutMs = NEWSLETTER_PROVIDER_TIMEOUT_MS,
): SendNewsletterEditionEmail {
  return async (email) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const content = createNewsletterEditionEmailContent(email);
      const response = await fetcher(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": configuration.providerApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "bts.online", email: configuration.fromEmail },
          replyTo: { name: "bts.online", email: configuration.replyToEmail },
          to: [{ email: email.to }],
          subject: content.subject,
          textContent: content.textContent,
          htmlContent: content.htmlContent,
          tags: ["newsletter-writing"],
          headers: { "X-BTS-Delivery-ID": email.deliveryId },
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.status === 201) {
        const payload = await response.json().catch(() => null) as { messageId?: unknown } | null;
        return typeof payload?.messageId === "string" && payload.messageId.length <= 300
          ? { status: "accepted", messageReference: payload.messageId }
          : { status: "ambiguous", code: "provider_uncertain" };
      }
      if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
        return { status: "rejected", code: `provider_http_${response.status}` };
      }
      return { status: "ambiguous", code: "provider_uncertain" };
    } catch {
      return { status: "ambiguous", code: "timeout_or_network" };
    } finally {
      clearTimeout(timer);
    }
  };
}
