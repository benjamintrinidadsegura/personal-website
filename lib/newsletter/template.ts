export type NewsletterEditionEmail = {
  subject: string;
  preheader: string;
  introduction: string;
  articleTitle: string;
  articleExcerpt: string;
  canonicalUrl: string;
  unsubscribeUrl: string;
  privacyUrl: string;
  controllerAddress: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraph(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

export function createNewsletterEditionEmailContent(input: NewsletterEditionEmail) {
  const introductionText = input.introduction ? [input.introduction, ""] : [];
  const textContent = [
    input.preheader,
    "",
    ...introductionText,
    input.articleTitle,
    input.articleExcerpt,
    "",
    `Read the Writing: ${input.canonicalUrl}`,
    "",
    "Writing delivered thoughtfully.",
    `Unsubscribe: ${input.unsubscribeUrl}`,
    `Privacy: ${input.privacyUrl}`,
    `bts.online · ${input.controllerAddress}`,
  ].filter((line, index, lines) => line !== "" || lines[index - 1] !== "").join("\n");
  const intro = input.introduction
    ? `<p style="margin:0 0 28px;font-size:17px;line-height:1.7;color:#c4d3dc">${paragraph(input.introduction)}</p>`
    : "";
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(input.preheader)}</div>`
    : "";
  const htmlContent = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#041018;color:#e8f3f8;font-family:Arial,Helvetica,sans-serif"><main style="max-width:640px;margin:0 auto;padding:48px 24px">${preheader}<header><p style="margin:0 0 28px;color:#35d0e5;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">bts.online · Newsletter</p></header>${intro}<article aria-labelledby="article-title"><h1 id="article-title" style="margin:0;font-size:34px;line-height:1.14;color:#fff">${escapeHtml(input.articleTitle)}</h1><p style="margin:20px 0 0;font-size:18px;line-height:1.7;color:#c4d3dc">${paragraph(input.articleExcerpt)}</p><p style="margin:34px 0"><a href="${escapeHtml(input.canonicalUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#35d0e5;color:#041018;font-weight:800;text-decoration:none">Read the Writing</a></p></article><footer style="margin-top:48px;padding-top:24px;border-top:1px solid #29404d;font-size:13px;line-height:1.7;color:#91a5b1"><p>Writing delivered thoughtfully.</p><p><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#c4d3dc">Unsubscribe</a> · <a href="${escapeHtml(input.privacyUrl)}" style="color:#c4d3dc">Privacy</a></p><p>bts.online · ${escapeHtml(input.controllerAddress)}</p></footer></main></body></html>`;
  return { subject: input.subject, textContent, htmlContent };
}
