import type { WritingShareFormat } from "@/types/writing";

export const shareCardPixelSize: Record<WritingShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
};

type ShareNavigator = Pick<Navigator, "canShare" | "share">;

export function supportsNativeFileShare(target: Partial<ShareNavigator>, file: File): boolean {
  if (typeof target.share !== "function" || typeof target.canShare !== "function") return false;
  try {
    return target.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function shareCardFallbackOrder(canCopyImage: boolean): readonly ("download" | "copy-image" | "screenshot")[] {
  return canCopyImage ? ["download", "copy-image", "screenshot"] : ["download", "screenshot"];
}

function isVisibleColor(value: string): boolean {
  return value !== "transparent" && value !== "rgba(0, 0, 0, 0)" && value !== "rgb(0 0 0 / 0)";
}

function elementOpacity(element: Element, root: HTMLElement): number {
  let opacity = 1;
  let current: Element | null = element;
  while (current && current !== root) {
    opacity *= Number.parseFloat(window.getComputedStyle(current).opacity || "1");
    current = current.parentElement;
  }
  return opacity;
}

function drawCardBackground(context: CanvasRenderingContext2D, element: HTMLElement, width: number, height: number) {
  const style = window.getComputedStyle(element);
  context.fillStyle = isVisibleColor(style.backgroundColor) ? style.backgroundColor : "#071826";
  context.fillRect(0, 0, width, height);
  const accent = style.getPropertyValue("--fyns-character-accent").trim() || "#35d0e5";
  const cool = context.createRadialGradient(width * 0.82, height * 0.18, 0, width * 0.82, height * 0.18, width * 0.55);
  cool.addColorStop(0, `${accent}38`);
  cool.addColorStop(1, `${accent}00`);
  context.fillStyle = cool;
  context.fillRect(0, 0, width, height);
  const warm = context.createRadialGradient(width * 0.12, height * 0.82, 0, width * 0.12, height * 0.82, width * 0.48);
  warm.addColorStop(0, "#ff7a001f");
  warm.addColorStop(1, "#ff7a0000");
  context.fillStyle = warm;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(255,255,255,.028)";
  context.lineWidth = 1;
  for (let x = width / 8; x < width; x += width / 8) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
  for (let y = height / 8; y < height; y += height / 8) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
}

function drawElementBox(context: CanvasRenderingContext2D, element: HTMLElement, root: HTMLElement, rootBounds: DOMRect) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0 || style.display === "none" || style.visibility === "hidden") return;
  const x = rect.left - rootBounds.left;
  const y = rect.top - rootBounds.top;
  context.save();
  context.globalAlpha = elementOpacity(element, root);
  if (isVisibleColor(style.backgroundColor)) {
    context.fillStyle = style.backgroundColor;
    context.fillRect(x, y, rect.width, rect.height);
  }
  const borders = [["top", x, y, x + rect.width, y], ["right", x + rect.width, y, x + rect.width, y + rect.height], ["bottom", x, y + rect.height, x + rect.width, y + rect.height], ["left", x, y, x, y + rect.height]] as const;
  for (const [side, x1, y1, x2, y2] of borders) {
    const width = Number.parseFloat(style.getPropertyValue(`border-${side}-width`));
    const color = style.getPropertyValue(`border-${side}-color`);
    if (width > 0 && isVisibleColor(color)) { context.strokeStyle = color; context.lineWidth = width; context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke(); }
  }
  context.restore();
}

type CanvasTextLine = { text: string; left: number; top: number };

function visualTextLines(node: Text, rootBounds: DOMRect): CanvasTextLine[] {
  const lines: CanvasTextLine[] = [];
  let offset = 0;
  for (const character of Array.from(node.data)) {
    const length = character.length;
    if (character === "\n") { offset += length; continue; }
    const range = document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset + length);
    offset += length;
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && character.trim() === "") continue;
    const top = rect.top - rootBounds.top;
    const current = lines.at(-1);
    if (!current || Math.abs(current.top - top) > 1.5) lines.push({ text: character, left: rect.left - rootBounds.left, top });
    else current.text += character;
  }
  return lines;
}

function transformedText(value: string, transform: string): string {
  if (transform === "uppercase") return value.toLocaleUpperCase();
  if (transform === "lowercase") return value.toLocaleLowerCase();
  if (transform === "capitalize") return value.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
  return value;
}

function drawElementText(context: CanvasRenderingContext2D, element: HTMLElement, root: HTMLElement, rootBounds: DOMRect) {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || !isVisibleColor(style.color)) return;
  const textNodes = [...element.childNodes].filter((node): node is Text => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()));
  if (textNodes.length === 0) return;
  context.save();
  context.globalAlpha = elementOpacity(element, root);
  context.fillStyle = style.color;
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.textBaseline = "top";
  context.direction = style.direction as CanvasDirection;
  const extendedContext = context as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in extendedContext) extendedContext.letterSpacing = style.letterSpacing;
  for (const node of textNodes) {
    for (const line of visualTextLines(node, rootBounds)) context.fillText(transformedText(line.text, style.textTransform), line.left, line.top);
  }
  context.restore();
}

function paintShareCard(context: CanvasRenderingContext2D, element: HTMLElement, bounds: DOMRect, size: { width: number; height: number }) {
  context.save();
  context.scale(size.width / bounds.width, size.height / bounds.height);
  drawCardBackground(context, element, bounds.width, bounds.height);
  for (const child of [element, ...element.querySelectorAll<HTMLElement>("*")]) {
    if (child !== element) drawElementBox(context, child, element, bounds);
    drawElementText(context, child, element, bounds);
  }
  context.restore();
}

async function withDeadline<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error(message)), milliseconds); }),
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return withDeadline(new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The share card image could not be encoded.")), "image/png")), 8_000, "The share card image timed out.");
}

function mountExportCard(element: HTMLElement, size: { width: number; height: number }): { card: HTMLElement; dispose: () => void } {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${size.width}px;height:${size.height}px;pointer-events:none;contain:strict;z-index:-1;`;
  const card = element.cloneNode(true) as HTMLElement;
  card.style.setProperty("width", `${size.width}px`, "important");
  card.style.setProperty("height", `${size.height}px`, "important");
  card.style.setProperty("max-width", "none", "important");
  card.style.setProperty("max-height", "none", "important");
  card.style.setProperty("margin", "0", "important");
  host.appendChild(card);
  document.body.appendChild(host);
  return { card, dispose: () => host.remove() };
}

export async function renderShareCardFile(element: HTMLElement, format: WritingShareFormat, fileName: string): Promise<File> {
  if (document.fonts) await withDeadline(document.fonts.ready, 8_000, "The share card fonts timed out.");
  const size = shareCardPixelSize[format];
  const exportCard = mountExportCard(element, size);
  try {
    await withDeadline(new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())), 3_000, "The share card layout timed out.");
    const bounds = exportCard.card.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The share card canvas is unavailable.");
    paintShareCard(context, exportCard.card, bounds, size);
    const blob = await canvasBlob(canvas);
    const safeName = fileName.replace(/[^a-z0-9._-]+/giu, "-").replace(/-+/gu, "-").replace(/^-|-$/gu, "") || "bts-share-card";
    return new File([blob], safeName.endsWith(".png") ? safeName : `${safeName}.png`, { type: "image/png", lastModified: Date.now() });
  } finally {
    exportCard.dispose();
  }
}

export function downloadShareCardFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  // The browser may still be reading the blob after the click event returns.
  // Revoking on the next tick cancels real downloads in Edge.
  window.setTimeout(() => { link.remove(); URL.revokeObjectURL(url); }, 30_000);
}

export async function copyShareCardFile(file: File): Promise<void> {
  if (typeof ClipboardItem === "undefined" || typeof navigator.clipboard?.write !== "function") throw new Error("Image clipboard unavailable");
  await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
}

export async function shareCardFile(file: File, input: { title: string; text: string; url?: string | null }): Promise<void> {
  if (!supportsNativeFileShare(navigator, file)) throw new Error("Native file sharing unavailable");
  const text = [input.text, input.url].filter(Boolean).join("\n");
  await navigator.share({ files: [file], title: input.title, text });
}
