// Tiny zero-dependency static server for local development: npm run dev
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { ROOT } from "./lib.mjs";
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".ttf": "font/ttf", ".css": "text/css; charset=utf-8" };
const port = process.env.PORT || 5173;
createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[\/\\])+/, "");
  try { const f = join(ROOT, p === "/" ? "index.html" : p); res.writeHead(200, { "content-type": T[extname(f)] || "application/octet-stream" }); res.end(await readFile(f)); }
  catch { res.writeHead(404); res.end("Not found"); }
}).listen(port, () => console.log("http://localhost:" + port));
