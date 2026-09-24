import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import manifest from "../app/manifest";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFileSync(new URL(path, root), "utf8");

function pngSize(path: string) {
  const bytes = readFileSync(new URL(path, root));
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${path}: PNG signature`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("browser metadata points to the simplified favicon and approved large-format icons", () => {
  const layout = source("app/layout.tsx");
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/u);
  assert.match(layout, /"\/favicon\.ico", sizes: "16x16 32x32 48x48"/u);
  assert.match(layout, /"\/icons\/bts-apple-touch-icon-180\.png", sizes: "180x180"/u);
  assert.match(layout, /"\/icons\/bts-app-icon-192\.png", sizes: "192x192"/u);
  assert.match(layout, /"\/icons\/bts-app-icon-512\.png", sizes: "512x512"/u);
  assert.match(layout, /themeColor: "#04111b"/u);
});

test("favicon is a valid three-frame ICO for 16, 32 and 48 pixel browser contexts", () => {
  const bytes = readFileSync(new URL("app/favicon.ico", root));
  assert.equal(bytes.readUInt16LE(0), 0);
  assert.equal(bytes.readUInt16LE(2), 1);
  assert.equal(bytes.readUInt16LE(4), 3);
  const sizes = Array.from({ length: 3 }, (_, index) => bytes.readUInt8(6 + index * 16));
  assert.deepEqual(sizes, [16, 32, 48]);
  for (let index = 0; index < 3; index += 1) {
    const offset = bytes.readUInt32LE(6 + index * 16 + 12);
    assert.deepEqual([...bytes.subarray(offset, offset + 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(bytes.readUInt8(offset + 25), 6, "Turbopack requires RGBA PNG frames inside ICO");
  }
});

test("large approved icon derivatives have exact native sizes and all referenced assets exist", () => {
  assert.deepEqual(pngSize("public/icons/bts-apple-touch-icon-180.png"), { width: 180, height: 180 });
  assert.deepEqual(pngSize("public/icons/bts-app-icon-192.png"), { width: 192, height: 192 });
  assert.deepEqual(pngSize("public/icons/bts-app-icon-512.png"), { width: 512, height: 512 });
  for (const path of ["app/favicon.ico", "public/icons/bts-apple-touch-icon-180.png", "public/icons/bts-app-icon-192.png", "public/icons/bts-app-icon-512.png"]) {
    assert.equal(existsSync(new URL(path, root)), true, path);
  }
});

test("manifest exposes only the required 192 and 512 icons without an unsafe maskable claim", () => {
  const value = manifest();
  assert.equal(value.name, "bts.online Digital HQ");
  assert.equal(value.short_name, "BTS");
  assert.equal(value.start_url, "/");
  assert.equal(value.display, "standalone");
  assert.equal(value.background_color, "#04111b");
  assert.equal(value.theme_color, "#04111b");
  assert.deepEqual(value.icons, [
    { src: "/icons/bts-app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/bts-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  ]);
});
