// Real-browser smoke test of the built single file. Needs Playwright + Chromium;
// when Playwright is not installed the suite is skipped (so `npm test` stays dependency-free).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { ROOT } from "../scripts/lib.mjs";

let chromium = null;
try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch { /* optional */ }
const skip = chromium ? false : "playwright is not installed (npm i --no-save playwright)";

let browser, page;
const pageErrors = [];

before(async () => {
  if (!chromium) return;
  execFileSync(process.execPath, [join(ROOT, "scripts/build.mjs")], { stdio: "ignore" });
  browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(pathToFileURL(join(ROOT, "dist/index.html")).href, { waitUntil: "load" });
  await page.waitForFunction(() => document.fonts.check("700 20px Lahb"));
});
after(async () => { if (browser) await browser.close(); });

const seek = (t) => page.evaluate((t) => {
  const s = document.getElementById("scrub");
  s.value = t; s.dispatchEvent(new Event("input", { bubbles: true }));
}, t);
const canvasStats = () => page.evaluate(() => {
  const c = document.getElementById("cv"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  const colours = new Set(); let lit = 0;
  for (let i = 0; i < d.length; i += 4 * 97) { colours.add((d[i] >> 4) + "," + (d[i + 1] >> 4) + "," + (d[i + 2] >> 4)); if (d[i] + d[i + 1] + d[i + 2] > 30) lit++; }
  return { colours: colours.size, lit };
});

test("page loads without script errors and bundles the heading font", { skip }, async () => {
  assert.deepEqual(pageErrors, []);
  assert.match(await page.evaluate(() => getComputedStyle(document.querySelector("h1")).fontFamily), /Lahb/);
  assert.equal(await page.locator("#tabs button").count(), 5);
  assert.equal(await page.locator("#strip .chip").count(), 2);
});

test("recording badge is hidden when not recording", { skip }, async () => {
  assert.equal(await page.locator("#recbadge").isVisible(), false);
});

test("the stage draws a real scene (not blank) once past the fade-in", { skip }, async () => {
  await seek(3);
  const s = await canvasStats();
  assert.ok(s.colours > 12, "expected a varied picture, got " + s.colours + " colours");
  assert.ok(s.lit > 500, "expected a lit picture");
});

test("every tab renders its panel without errors", { skip }, async () => {
  for (const tab of ["plan", "chars", "prod", "rev", "out"]) {
    await page.locator(`#tabs button[data-v="${tab}"]`).click();
    assert.ok((await page.locator("#panel").innerHTML()).length > 200, "empty panel: " + tab);
    assert.equal(await page.locator(`#tabs button[data-v="${tab}"]`).getAttribute("aria-selected"), "true");
  }
  assert.deepEqual(pageErrors, []);
});

test("adding a scene updates the scene strip and total time", { skip }, async () => {
  await page.locator('#tabs button[data-v="plan"]').click();
  const before = await page.locator("#time").textContent();
  await page.locator('[data-a="add-scene"]').first().click();
  assert.equal(await page.locator("#strip .chip").count(), 3);
  assert.notEqual(await page.locator("#time").textContent(), before);
  assert.deepEqual(pageErrors, []);
});

test("playback stays in sync with real time after the page stalls (audio clock is master)", { skip }, async () => {
  await page.locator('#tabs button[data-v="plan"]').click();
  await seek(1);
  const t0 = await page.evaluate(() => +document.getElementById("scrub").value);
  const w0 = Date.now();
  await page.click("#bPlay");
  await page.waitForTimeout(400);
  await page.evaluate((ms) => { const e = performance.now() + ms; while (performance.now() < e); }, 1500); // freeze the main thread
  await page.waitForTimeout(600);
  const t1 = await page.evaluate(() => +document.getElementById("scrub").value);
  const wall = (Date.now() - w0) / 1000;
  await page.click("#bPlay"); // pause
  const lag = wall - (t1 - t0);
  assert.ok(Math.abs(lag) < 0.35, `film clock drifted ${lag.toFixed(2)}s from real time`);
  assert.deepEqual(pageErrors, []);
});

test("built file embeds mp4-muxer and it loads offline from the page itself", { skip }, async (t) => {
  const r = await page.evaluate(async () => {
    const el = document.getElementById("vendor-mp4-muxer");
    if (!el) return { embedded: false };
    const M = await import(URL.createObjectURL(new Blob([el.textContent], { type: "text/javascript" })));
    const target = new M.ArrayBufferTarget();
    const mux = new M.Muxer({ target, video: { codec: "avc", width: 640, height: 360 }, fastStart: false });
    mux.finalize();
    const head = new Uint8Array(target.buffer).slice(0, 12);
    return { embedded: true, api: [typeof M.Muxer, typeof M.ArrayBufferTarget], ftyp: String.fromCharCode(...head.slice(4, 8)) };
  });
  if (!r.embedded) return t.skip("src/vendor/mp4-muxer.mjs is not committed, so nothing is embedded");
  assert.deepEqual(r.api, ["function", "function"]);
  assert.equal(r.ftyp, "ftyp", "muxer should emit an MP4 container");
});

test("page identity: description, theme colour, favicon, language", { skip }, async () => {
  const h = await page.evaluate(() => ({
    lang: document.documentElement.lang, dir: document.documentElement.dir,
    desc: document.querySelector('meta[name=description]')?.content || "",
    theme: document.querySelectorAll("meta[name=theme-color]").length,
    icon: document.querySelector('link[rel=icon]')?.href || "",
    og: document.querySelector('meta[property="og:title"]')?.content || "",
  }));
  assert.equal(h.lang, "ar"); assert.equal(h.dir, "rtl");
  assert.ok(h.desc.length > 40, "description too short");
  assert.equal(h.theme, 2);
  assert.match(h.icon, /^data:image\/svg\+xml,/);
  assert.ok(h.og);
});

test("crash banner: shows details, de-duplicates, offers a backup download, ignores AbortError", { skip }, async () => {
  const throwLater = (msg) => page.evaluate((m) => { setTimeout(() => { throw new Error(m); }, 0); }, msg);
  assert.equal(await page.locator("#errbar").count(), 0, "no banner before any error");
  // Headless Chromium reports any non-Latin download name as "download", so use a Latin title to check the name.
  await page.locator('#tabs button[data-v="plan"]').click();
  await page.locator('input[data-k="title"]').first().fill("Boom Test");

  await throwLater("boom-test");
  await page.locator("#errbar").waitFor();
  assert.equal(await page.locator("#errbar").getAttribute("role"), "alert");
  assert.match(await page.locator("#errdetails").textContent(), /boom-test/);
  assert.equal(await page.locator("#errbar button").count(), 3);

  await throwLater("boom-test");
  await page.waitForFunction(() => /×2/.test(document.getElementById("errdetails").textContent));

  await page.evaluate(() => { Promise.reject(new Error("rej-test")); });
  await page.waitForFunction(() => /rej-test/.test(document.getElementById("errdetails").textContent));

  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#errbar button", { hasText: "حفظ نسخة" }).click()]);
  assert.equal(dl.suggestedFilename(), "Boom Test.cartoon.json");

  await page.locator("#errbar button", { hasText: "إغلاق" }).click();
  assert.equal(await page.locator("#errbar").count(), 0);

  await page.evaluate(() => { Promise.reject(new DOMException("cancelled", "AbortError")); });
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#errbar").count(), 0, "AbortError must not raise the banner");

  pageErrors.length = 0; // these errors were thrown on purpose
});
