import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("footer keeps the exact discreet, unlocalized personal signature at its bottom edge", () => {
  const footer = readFileSync(new URL("../components/layout/footer.tsx", import.meta.url), "utf8");
  assert.equal((footer.match(/trust in gods plan/gu) ?? []).length, 1);
  assert.match(
    footer,
    /<p className="mx-auto mt-10 max-w-\[90rem\] text-right font-mono text-\[10px\] tracking-\[0\.16em\] text-slate-700 sm:mt-12">trust in gods plan<\/p>\s*<\/footer>/u,
  );
  assert.doesNotMatch(footer, /trust in god['’]s plan|Trust in gods plan/u);
  const signature = footer.split("trust in gods plan")[0]?.split("\n").at(-1) ?? "";
  assert.doesNotMatch(signature, /href=|<Link|title=|onClick=|aria-label=/u);
});
