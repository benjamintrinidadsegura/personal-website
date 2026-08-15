import type { NewsletterRuntimeConfiguration } from "@/lib/newsletter/config";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
export const NEWSLETTER_PROVIDER_TIMEOUT_MS = 5_000;

export type ConfirmationEmail = {
  to: string;
  confirmationUrl: string;
  expiresAt: string;
};

export type SendConfirmationEmail = (email: ConfirmationEmail) => Promise<boolean>;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createConfirmationEmailContent(input: ConfirmationEmail) {
  const safeUrl = escapeHtml(input.confirmationUrl);
  const expires = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(input.expiresAt));
  const subject = "Confirm your bts.online newsletter subscription";
  const textContent = [
    "Confirm your bts.online newsletter subscription.",
    "",
    "New Writing and occasional updates from the Digital HQ. No fixed schedule, no spam.",
    "",
    `Confirm: ${input.confirmationUrl}`,
    "",
    `This link expires ${expires} (Europe/Berlin). If you did not request this, ignore this email.`,
  ].join("\n");
  const htmlContent = `<!doctype html><html><body style="margin:0;background:#041018;color:#e8f3f8;font-family:Arial,sans-serif"><main style="max-width:620px;margin:0 auto;padding:48px 24px"><p style="color:#35d0e5;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">bts.online · Newsletter</p><h1 style="font-size:32px;line-height:1.1">Confirm your subscription.</h1><p style="font-size:17px;line-height:1.7;color:#c4d3dc">New Writing and occasional updates from the Digital HQ. No fixed schedule, no spam.</p><p style="margin:32px 0"><a href="${safeUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#35d0e5;color:#041018;font-weight:800;text-decoration:none">Review and confirm</a></p><p style="font-size:13px;line-height:1.6;color:#8295a3">This link expires ${escapeHtml(expires)} (Europe/Berlin). If you did not request this, ignore this email.</p></main></body></html>`;
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
