import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("footer keeps the exact discreet, unlocalized personal signature at its bottom edge", () => {
  const footer = readFileSync(new URL("../components/layout/footer.tsx", import.meta.url), "utf8");
  assert.equal((footer.match(/trust in gods plan/gu) ?? []).length, 1);
  assert.match(
    footer,
    /<p className="mx-auto mt-10 max-w-\[90rem\] text-right font-mono text-\[10px\] tracking-\[0\.16em\] text-slate-400 sm:mt-12">trust in gods plan<\/p>\s*<\/footer>/u,
  );
  assert.doesNotMatch(footer, /trust in god['’]s plan|Trust in gods plan/u);
  const signature = footer.split("trust in gods plan")[0]?.split("\n").at(-1) ?? "";
  assert.doesNotMatch(signature, /href=|<Link|title=|onClick=|aria-label=/u);
});

test("footer secondary copy uses a readable token without changing its content", () => {
  const footer = readFileSync(new URL("../components/layout/footer.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(footer, /text-slate-(500|600|700)/u);
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = ([red, green, blue]: number[]) =>
    0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
  // Compiled slate-400 against the footer's actual solid environment.
  assert.ok((luminance([144, 161, 185]) + 0.05) / (luminance([2, 8, 13]) + 0.05) >= 4.5);
});
