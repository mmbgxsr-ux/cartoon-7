// Builds dist/: a single self-contained HTML file (works offline from disk, easy to share).
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, read, scriptFiles } from "./lib.mjs";

const { html, list } = scriptFiles();
const js = list.map((f) => read(f)).join("\n");
if (/<\/script/i.test(js)) throw new Error("JS contains </script>; escape it before building");
const css = read("src/styles.css");
let out = html
  .replace('<link rel="stylesheet" href="src/styles.css">', () => "<style>\n" + css + "</style>")
  .replace(/<script src="src\/js\/[^"]+"><\/script>\n?/g, "");
out = out.replace("</body>", () => "<script>\n(function(){\n" + js + "\n})();\n</script>\n</body>");
mkdirSync(join(ROOT, "dist"), { recursive: true });
writeFileSync(join(ROOT, "dist/index.html"), out);
copyFileSync(join(ROOT, "dist/index.html"), join(ROOT, "dist/cartoon-studio.html"));
console.log(`dist/index.html  ${(out.length / 1024).toFixed(0)} KB  (${list.length} scripts)`);
