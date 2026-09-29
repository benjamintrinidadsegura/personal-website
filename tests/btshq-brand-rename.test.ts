import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { aiSummaryDictionaries, getAiSummaryCopy } from "../data/i18n/ai-summary";
import { siteConfig } from "../data/site";
import { absoluteSiteUrl, requireSiteUrl } from "../lib/site-url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const oldDotBrand = ["bts", "online"].join(".");
const oldSlugBrand = ["bts", "online"].join("-");
const allowedHistorical = new Set([
  "docs/bts-engineering-runner.md",
  "scripts/bts-engineering/config.json",
  "scripts/bts-engineering/production-migrations.mjs",
  "scripts/bts-engineering/production-writing-promotion.mjs",
  "scripts/bts-engineering/production-writing-brand-rename.mjs",
  "supabase/migrations/20260815000000_writing_account_identity.sql",
  "supabase/migrations/20260818000000_newsletter_subscription_foundation.sql",
  "supabase/migrations/20260930000000_btshq_online_brand_rename.sql",
  "tests/bts-engineering-runner.test.ts",
  "tests/production-writing-promotion.test.ts",
  "tests/production-writing-brand-rename.test.ts",
]);

function filesBelow(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

test("visible brand, canonical origin, and all seven AI prompts use btshq.online", () => {
  assert.equal(siteConfig.domain, "btshq.online");
  const siteUrl = requireSiteUrl({ SITE_URL: "https://btshq.online", NODE_ENV: "production", VERCEL_ENV: "production" });
  assert.equal(absoluteSiteUrl("/", siteUrl), "https://btshq.online/");
  for (const locale of Object.keys(aiSummaryDictionaries) as Array<keyof typeof aiSummaryDictionaries>) {
    const copy = getAiSummaryCopy(locale);
    assert.match(copy.headline, /btshq\.online/iu);
    assert.match(copy.prompt, /https:\/\/btshq\.online/u);
    assert.doesNotMatch(copy.prompt, new RegExp(oldDotBrand.replace(".", "\\."), "iu"));
  }
});

test("old identity remains only in the explicit immutable/external/transition allowlist", () => {
  const roots = ["app", "components", "data", "docs", "lib", "scripts", "supabase", "tests", "types"];
  const candidates = roots.flatMap((root) => filesBelow(join(repoRoot, root))).filter((path) => /\.(?:ts|tsx|mjs|json|md|sql)$/u.test(path) && !path.includes(`${join("supabase", ".temp")}\\`));
  const offenders = candidates.flatMap((path) => {
    const repositoryPath = relative(repoRoot, path).replaceAll("\\", "/");
    if (allowedHistorical.has(repositoryPath)) return [];
    const source = readFileSync(path, "utf8").toLowerCase();
    return source.includes(oldDotBrand) || source.includes(oldSlugBrand) ? [repositoryPath] : [];
  });
  assert.deepEqual(offenders, []);
});

test("hero, newsletter, PWA, sharing and current documentation expose the new identity", () => {
  const files = [
    "components/sections/hero.tsx",
    "lib/newsletter/domain.ts",
    "lib/newsletter/provider.ts",
    "lib/newsletter/template.ts",
    "app/manifest.ts",
    "app/layout.tsx",
    "lib/sharing/destinations.ts",
    "README.md",
  ];
  for (const file of files) {
    const source = readFileSync(join(repoRoot, file), "utf8");
    assert.equal(source.toLowerCase().includes(oldDotBrand), false, file);
  }
  assert.match(readFileSync(join(repoRoot, "components/sections/hero.tsx"), "utf8"), /btshq\.online/u);
});
