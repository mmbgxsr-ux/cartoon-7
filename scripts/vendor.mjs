// One-time helper: downloads third-party runtime files into src/vendor/ so the app
// (and the single-file build) works with no internet. Run `npm run vendor`, then commit the result.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

const MUXER_VERSION = "5.1.3";
const url = `https://cdn.jsdelivr.net/npm/mp4-muxer@${MUXER_VERSION}/build/mp4-muxer.mjs`;

const res = await fetch(url);
if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
const text = await res.text();
if (text.length < 10000 || !/class\s+Muxer|Muxer\s*=/.test(text) || !/ArrayBufferTarget/.test(text)) {
  throw new Error("Downloaded file does not look like mp4-muxer; refusing to save it");
}
mkdirSync(join(ROOT, "src/vendor"), { recursive: true });
writeFileSync(join(ROOT, "src/vendor/mp4-muxer.mjs"), text);
console.log(`src/vendor/mp4-muxer.mjs  v${MUXER_VERSION}  ${(text.length / 1024).toFixed(0)} KB`);
