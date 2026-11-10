// Builds dist/: a single self-contained HTML file (works offline from disk, easy to share).
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, read, scriptFiles } from "./lib.mjs";

const { html, list } = scriptFiles();
const js = list.map((f) => read(f)).join("\n");
if (/<\/script/i.test(js)) throw new Error("JS contains </script>; escape it before building");
const css = read("src/styles.css");
let out = html
  .replace('<link rel="stylesheet" href="src/styles.css">', () => "<style>\n" + css + "</style>")
  .replace(/<script src="src\/js\/[^"]+"><\/script>\n?/g, "");
// Optional vendored mp4-muxer (see `npm run vendor`): embedded so MP4 export needs no internet.
let vendor = "";
if (existsSync(join(ROOT, "src/vendor/mp4-muxer.mjs"))) {
  const lib = read("src/vendor/mp4-muxer.mjs");
  if (/<\/script/i.test(lib)) throw new Error("mp4-muxer contains </script>; cannot embed");
  vendor = '<script type="text/plain" id="vendor-mp4-muxer">\n' + lib + "\n</script>\n";
} else {
  console.warn("note: src/vendor/mp4-muxer.mjs not found; MP4 export will load the library from the CDN (run `npm run vendor`)");
}
out = out.replace("</body>", () => vendor + "<script>\n(function(){\n" + js + "\n})();\n</script>\n</body>");
mkdirSync(join(ROOT, "dist"), { recursive: true });
writeFileSync(join(ROOT, "dist/index.html"), out);
copyFileSync(join(ROOT, "dist/index.html"), join(ROOT, "dist/cartoon-studio.html"));
console.log(`dist/index.html  ${(out.length / 1024).toFixed(0)} KB  (${list.length} scripts)`);
