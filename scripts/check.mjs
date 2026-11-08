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
console.log(`OK: ${list.length} scripts parse as one bundle`);
