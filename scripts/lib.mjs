import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const read = (p) => readFileSync(join(ROOT, p), "utf8");
/** Script files in load order, exactly as listed in index.html. */
export function scriptFiles() {
  const html = read("index.html");
  const list = [...html.matchAll(/<script src="(src\/js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
  const onDisk = readdirSync(join(ROOT, "src/js")).filter((f) => f.endsWith(".js")).map((f) => "src/js/" + f).sort();
  return { html, list, onDisk };
}
