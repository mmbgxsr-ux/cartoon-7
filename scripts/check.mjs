// Cheap quality gate: every script is listed, loads in order, and the bundle parses.
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { read, scriptFiles } from "./lib.mjs";

const { list, onDisk } = scriptFiles();
const missing = onDisk.filter((f) => !list.includes(f));
if (missing.length) { console.error("Not referenced in index.html:", missing); process.exit(1); }
const dir = mkdtempSync(join(tmpdir(), "cs-"));
const bundle = join(dir, "bundle.js");
writeFileSync(bundle, "(function(){\n" + list.map((f) => read(f)).join("\n") + "\n})();");
try { execFileSync(process.execPath, ["--check", bundle], { stdio: "pipe" }); }
catch (e) { console.error(String(e.stderr || e)); process.exit(1); }
for (const id of ["cv", "scrub", "time"]) {
  if (!read("index.html").includes(`id="${id}"`)) { console.error("Missing element #" + id); process.exit(1); }
}
const html = read("index.html");
for (const [what, re] of [["meta description", /<meta name="description" content="[^"]{40,}"/], ["theme-color", /<meta name="theme-color"/], ["favicon", /<link rel="icon"/], ["lang/dir", /<html lang="ar" dir="rtl">/]]) {
  if (!re.test(html)) { console.error("index.html is missing: " + what); process.exit(1); }
}
console.log(`OK: ${list.length} scripts parse as one bundle`);
