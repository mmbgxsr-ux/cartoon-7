import { test } from "node:test";
import assert from "node:assert/strict";
import { loadApp } from "./load.mjs";

const app = loadApp();
const plain = (v) => JSON.parse(JSON.stringify(v)); // normalise cross-realm objects
const base = () => ({
  title: "t",
  actors: [{ id: "a1", name: "A", kind: "cat", color: "#aabbcc", accent: "#ffffff" }],
  scenes: [{ id: "s1", title: "S", bg: "day", dur: 5, cast: [{ actor: "a1", x: 10, y: 80 }], steps: [] }],
});
const PNG = "data:image/png;base64,iVBORw0KGgo=";

test("cleanId keeps safe characters and never returns reserved names", () => {
  assert.equal(app.cleanId("ab_c-9"), "ab_c-9");
  assert.equal(app.cleanId("a b<c>!"), "abc");
  assert.equal(app.cleanId("x".repeat(40)).length, 12);
  for (const bad of ["__proto__", "constructor", "toString", "", null, undefined]) {
    const id = app.cleanId(bad);
    assert.match(id, /^[A-Za-z0-9_-]+$/);
    assert.ok(!(id in Object.prototype), String(bad));
  }
});

test("numOr clamps and falls back", () => {
  assert.equal(app.numOr("5", 1, 0, 10), 5);
  assert.equal(app.numOr(99, 1, 0, 10), 10);
  assert.equal(app.numOr("abc", 7, 0, 10), 7);
  assert.equal(app.numOr(Infinity, 7, 0, 10), 7);
});

test("own ignores inherited properties", () => {
  assert.equal(app.own({ a: 1 }, "a"), true);
  assert.equal(app.own({}, "toString"), false);
  assert.equal(app.own({ a: 1 }, 5), false);
});

test("esc escapes HTML-significant characters", () => {
  assert.equal(app.esc('<a href="x">&</a>'), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
});

test("cleanProject rejects structurally invalid projects", () => {
  for (const bad of [null, {}, { actors: [], scenes: [] }, { actors: [{}], scenes: [] }, { actors: "x", scenes: "y" }]) {
    assert.equal(app.cleanProject(bad), null);
  }
});

test("cleanProject accepts a minimal valid project", () => {
  const out = plain(app.cleanProject(base()));
  assert.equal(out.actors.length, 1);
  assert.equal(out.scenes.length, 1);
  assert.equal(out.scenes[0].cast[0].actor, out.actors[0].id);
});

test("cleanProject repairs colours, enums and numeric ranges", () => {
  const p = base();
  p.actors[0].color = "red; background:url(x)";
  p.actors[0].kind = "__proto__";
  p.scenes[0].bg = "constructor";
  p.scenes[0].cast[0].x = 9999;
  p.scenes[0].cast[0].y = -5;
  const out = plain(app.cleanProject(p));
  assert.match(out.actors[0].color, /^#[0-9a-f]{6}$/i);
  assert.equal(out.actors[0].kind, "cat");
  assert.equal(out.scenes[0].bg, "day");
  assert.equal(out.scenes[0].cast[0].x, 100);
  assert.equal(out.scenes[0].cast[0].y, 60);
});

test("cleanProject caps actors (6) and scenes (60)", () => {
  const p = base();
  p.actors = Array.from({ length: 20 }, (_, i) => ({ id: "a" + i, name: "n" + i, kind: "cat" }));
  p.scenes = Array.from({ length: 100 }, (_, i) => ({ id: "s" + i, title: "t", bg: "day", dur: 3, cast: [], steps: [] }));
  const out = plain(app.cleanProject(p));
  assert.equal(out.actors.length, 6);
  assert.equal(out.scenes.length, 60);
});

test("cleanProject makes duplicate ids unique and remaps references", () => {
  const p = base();
  p.actors = [
    { id: "dup", name: "A", kind: "cat" },
    { id: "dup", name: "B", kind: "boy" },
  ];
  const out = plain(app.cleanProject(p));
  assert.notEqual(out.actors[0].id, out.actors[1].id);
});

test("cleanProject drops unknown step types and sanitises step fields", () => {
  const p = base();
  p.scenes[0].steps = [
    { id: "1", type: "evil", t: 0, d: 1 },
    { id: "2", type: "say", actor: "a1", t: -3, d: 9999, text: "x".repeat(500), emo: "nope" },
    { id: "3", type: "move", actor: "a1", t: 1, d: 1, x: 50, y: 70, style: "fly", curve: "zzz" },
  ];
  const s = plain(app.cleanProject(p)).scenes[0].steps;
  assert.equal(s.length, 2);
  assert.equal(s[0].t, 0);
  assert.equal(s[0].d, 30);
  assert.equal(s[0].text.length, 200);
  assert.equal(s[0].emo, "neutral");
  assert.equal(s[1].style, "walk");
  assert.equal(s[1].curve, "auto");
});

test("cleanProject only keeps genuine image data URIs", () => {
  const good = base();
  good.actors[0].kind = "img";
  good.actors[0].img = PNG;
  assert.equal(plain(app.cleanProject(good)).actors[0].img, PNG);

  for (const evil of ["javascript:alert(1)", "data:text/html;base64,PHNjcmlwdD4=", 'data:image/png;base64,AAA"onerror="x']) {
    const p = base();
    p.actors[0].kind = "img";
    p.actors[0].img = evil;
    const a = plain(app.cleanProject(p)).actors[0];
    assert.notEqual(a.img, evil);
    assert.notEqual(a.kind, "img");
  }
});

test("cleanProject survives JSON with __proto__ keys without polluting Object", () => {
  const p = JSON.parse('{"__proto__":{"polluted":1},"actors":[{"id":"a","name":"A","kind":"cat","__proto__":{"polluted":2}}],"scenes":[{"id":"s","title":"S","bg":"day","dur":4,"cast":[],"steps":[]}]}');
  app.cleanProject(p);
  assert.equal({}.polluted, undefined);
});

test("round-trip: the demo project survives export, clean and recalc", () => {
  const exported = JSON.parse(JSON.stringify(app.P));
  const out = app.cleanProject(exported);
  assert.ok(out);
  assert.equal(out.scenes.length, app.P.scenes.length);
  assert.equal(out.actors.length, app.P.actors.length);
  assert.equal(out.title, app.P.title);
});

test("recalc builds the timeline from scene durations", () => {
  app.loadP(plain(app.cleanProject(base())));
  assert.equal(app.TOTAL, 5);
  assert.equal(app.SEG.length, 1);
  assert.equal(app.SEG[0].t1, 5);
});

test("recalc turns say/sfx steps into time-ordered audio events", () => {
  const p = base();
  p.scenes[0].steps = [
    { id: "b", type: "sfx", t: 2, d: 1, sfx: "pop" },
    { id: "a", type: "say", actor: "a1", t: 0.5, d: 2, text: "مرحبا", emo: "happy" },
  ];
  app.loadP(plain(app.cleanProject(p)));
  const ev = plain(app.EV);
  assert.ok(ev.some((e) => e.k === "sfx" && e.T === 2));
  assert.ok(ev.some((e) => e.k === "blip"));
  for (let i = 1; i < ev.length; i++) assert.ok(ev[i].T >= ev[i - 1].T);
});

test("cleanProject keeps a valid photo-head actor and clamps its framing", () => {
  const p = base();
  Object.assign(p.actors[0], { kind: "face", img: PNG, body: "girl", zoom: 9, fx: -5, fy: "x" });
  const a = plain(app.cleanProject(p)).actors[0];
  assert.equal(a.kind, "face");
  assert.equal(a.img, PNG);
  assert.equal(a.body, "girl");
  assert.equal(a.zoom, 3);
  assert.equal(a.fx, -1);
  assert.equal(a.fy, 0);

  const q = base();
  Object.assign(q.actors[0], { kind: "face", img: PNG, body: "robot" });
  assert.equal(plain(app.cleanProject(q)).actors[0].body, "boy");
});

test("cleanProject rejects a photo-head actor with a non-image source", () => {
  for (const evil of ["javascript:alert(1)", "data:text/html;base64,PHNjcmlwdD4=", 'data:image/png;base64,AAA"onerror="x']) {
    const p = base();
    Object.assign(p.actors[0], { kind: "face", img: evil });
    const a = plain(app.cleanProject(p)).actors[0];
    assert.equal(a.kind, "cat");
    assert.equal(a.img, undefined);
  }
});

test("photo-head actors draw in every emotion and action without throwing", () => {
  const calls = [];
  const g = new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : (...args) => { calls.push([k, args]); }),
    set: (t, k, v) => { t[k] = v; return true; },
  });
  const actor = { id: "x1", name: "F", kind: "face", body: "boy", color: "#3a86ff", accent: "#f1c27d", img: PNG, zoom: 1.5, fx: 0.3, fy: -0.2 };
  const pose = (extra) => Object.assign({ px: 100, py: 200, sc: 1, face: 1, lift: 0, rot: 0, sx: 1, sy: 1, phase: 1, walk: false, emo: "neutral", talk: false, seed: 1, vis: null }, extra);

  app.drawActor(g, actor, pose({}), 0); // first draw registers the image
  app.IMGC.fx1.ok = true; // pretend it finished loading
  calls.length = 0;

  const cases = [];
  for (const emo of Object.keys(app.EMO)) cases.push({ emo });
  for (const act of Object.keys(app.ACTN)) cases.push({ act });
  cases.push({ walk: true }, { walk: true, run: true, lift: 10 }, { talk: true, vis: [14, 11] }, { talk: true });
  for (const body of ["boy", "girl"]) {
    for (const c of cases) assert.doesNotThrow(() => app.drawActor(g, { ...actor, body }, pose(c), 0.4), JSON.stringify(c));
  }
  const photoDraws = calls.filter(([k, a]) => k === "drawImage" && a.length === 9);
  assert.equal(photoDraws.length, cases.length * 2);
});

test("cartoonize outlines edges and never touches alpha", () => {
  const w = 24, h = 24, data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const j = (y * w + x) * 4, v = x < 12 ? 240 : 15;
    data[j] = data[j + 1] = data[j + 2] = v;
    data[j + 3] = y < 2 ? 0 : 255;
  }
  let put = null;
  const canvas = { width: w, height: h, getContext: () => ({ getImageData: () => ({ data }), putImageData: (im) => { put = im; } }) };
  assert.equal(app.cartoonize(canvas), canvas);
  assert.ok(put, "putImageData was called");
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) assert.equal(data[(y * w + x) * 4 + 3], y < 2 ? 0 : 255);
  let outlined = 0;
  for (let y = 4; y < h - 1; y++) for (let x = 9; x <= 14; x++) {
    const j = (y * w + x) * 4;
    if (data[j] === 26 && data[j + 1] === 20 && data[j + 2] === 34) outlined++;
  }
  assert.ok(outlined > 0, "outline pixels appear along the colour edge");
  const far = (10 * w + 2) * 4;
  assert.ok(!(data[far] === 26 && data[far + 1] === 20 && data[far + 2] === 34), "flat areas are not outlined");

  const tiny = { width: 2, height: 2, getContext: () => ({ getImageData: () => ({ data: new Uint8ClampedArray(16) }), putImageData() {} }) };
  assert.doesNotThrow(() => app.cartoonize(tiny));
});

test("photo sprites draw every emotion with its overlay", () => {
  const calls = [];
  const g = new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : (...args) => { calls.push([k, args]); }),
    set: (t, k, v) => { t[k] = v; return true; },
  });
  const actor = { id: "y1", name: "I", kind: "img", color: "#8d99ae", accent: "#e8eaf0", img: PNG };
  const pose = (extra) => Object.assign({ px: 100, py: 200, sc: 1, face: 1, lift: 0, rot: 0, sx: 1, sy: 1, phase: 1, walk: false, emo: "neutral", talk: false, seed: 1, vis: null }, extra);
  app.drawActor(g, actor, pose({}), 0);
  app.IMGC.ay1.ok = true;
  calls.length = 0;
  const emos = Object.keys(app.EMO);
  for (const emo of emos) assert.doesNotThrow(() => app.drawActor(g, actor, pose({ emo }), 0.4), emo);
  assert.equal(calls.filter(([k, a]) => k === "drawImage" && a.length === 5).length, emos.length);
});

test("pose sheet maps grid cells to poses in reading order and skips blanks", () => {
  const names = app.sheetNames();
  assert.equal(names[0], "img");
  assert.deepEqual(plain(names.slice(1)), plain(Object.keys(app.POSEN)));
  assert.equal(app.sheetLabel("img"), "عادي");
  assert.match(app.sheetHint(), /1\. عادي/);
  const flat = new Uint8ClampedArray(64 * 4).fill(200);
  assert.equal(app.cellBlank({ getImageData: () => ({ data: flat }) }, 8, 8), true);
  const varied = new Uint8ClampedArray(64 * 4).fill(255);
  for (let i = 0; i < 32; i++) varied[i * 4] = varied[i * 4 + 1] = varied[i * 4 + 2] = 20;
  assert.equal(app.cellBlank({ getImageData: () => ({ data: varied }) }, 8, 8), false);
});

/* ---------- motion strips ---------- */
function rgba(w, h, fill) {
  const d = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { d[i * 4] = fill[0]; d[i * 4 + 1] = fill[1]; d[i * 4 + 2] = fill[2]; d[i * 4 + 3] = fill[3] ?? 255; }
  return d;
}
function rect(d, w, x0, x1, y0, y1, c) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const j = (y * w + x) * 4; d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255; }
}

test("detectKey recognises the background colour from the corners", () => {
  for (const [col, want] of [[[0, 255, 0], "green"], [[0, 0, 255], "blue"], [[255, 0, 255], "magenta"], [[250, 250, 250], "white"], [[128, 128, 128], null]]) {
    assert.equal(app.detectKey(rgba(40, 40, col), 40, 40), want, want);
  }
  assert.equal(app.detectKey(rgba(40, 40, [0, 0, 0, 0]), 40, 40), "none");
});

test("keyImage removes the key colour, keeps similar-looking clothes and despills edges", () => {
  const w = 5, h = 1, d = new Uint8Array(w * 4);
  const px = (i, c) => { d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; };
  px(0, [0, 255, 0]);      // pure key
  px(1, [240, 140, 40]);   // skin
  px(2, [100, 120, 50]);   // olive clothes: green-ish but not the key
  px(3, [100, 170, 100]);  // edge pixel mixed with the key
  px(4, [60, 200, 60]);    // almost key
  app.keyImage(d, w, h, "green");
  assert.equal(d[3], 0);
  assert.deepEqual([d[4], d[5], d[6], d[7]], [240, 140, 40, 255]);
  assert.deepEqual([d[8], d[9], d[10], d[11]], [100, 120, 50, 255]);
  assert.ok(d[15] > 0 && d[15] < 255, "edge pixel is semi-transparent");
  assert.ok(d[13] <= Math.max(d[12], d[14]), "green spill is removed from the edge pixel");
  assert.equal(d[19], 0);
});

test("stripLayout cuts frames at the gaps and anchors each on its body and feet", () => {
  const w = 600, h = 100, d = rgba(w, h, [0, 0, 0, 0]), c = [200, 100, 50];
  rect(d, w, 20, 70, 10, 90, c);     // frame 1: 51 wide (narrowest, tie with 3)
  rect(d, w, 230, 300, 20, 95, c);   // frame 2: 71 wide, feet a bit lower
  rect(d, w, 420, 470, 12, 90, c);   // frame 3
  const L = app.stripLayout(d, w, h, 3);
  assert.equal(L.mode, "gaps");
  assert.equal(L.frames.length, 3);
  assert.deepEqual(plain(L.frames.map((f) => [f.xmin, f.xmax])), [[20, 70], [230, 300], [420, 470]]);
  assert.equal(L.st, 0);
  assert.ok(L.cw >= 2 * 36 && L.H >= 80, "cell is big enough for the widest frame");
  assert.ok(Math.abs(L.frames[1].ax - 265) < 1, "anchor sits on the body centre");

  const bar = rgba(w, h, [0, 0, 0, 0]);   // a figure bridged by a ground line: no empty columns
  rect(bar, w, 20, 470, 90, 92, c);
  rect(bar, w, 20, 470, 10, 12, c);
  assert.equal(app.stripLayout(bar, w, h, 3).mode, "equal");
  assert.equal(app.stripLayout(rgba(10, 10, [0, 0, 0, 0]), 10, 10, 3), null);
});

test("stripPick chooses action, angle and frame, with sensible fallbacks", () => {
  const s = (n) => ({ img: PNG, n, cw: 100, ch: 200, h: 190 });
  const a = { strips: { "walk:side": s(8), "idle:front": s(4), "talk:front": s(4), "jump:side": s(6), "sit:front": s(4) } };
  const P0 = { phase: 0, walk: false, run: false, talk: false, act: null, vis: null, seed: 1, view: null, jp: null, ap: null };
  const pk = (extra, T = 0) => app.stripPick(a, { ...P0, ...extra }, T);
  let r = pk({ walk: true, view: "side", phase: Math.PI / 2 });
  assert.equal(r.key, "walk:side"); assert.equal(r.i, 2);
  r = pk({ walk: true, view: "front", phase: 0 });
  assert.equal(r.key, "walk:side", "missing front walk falls back to the side strip");
  r = pk({ walk: true, run: true, view: "side", phase: 0 });
  assert.equal(r.key, "walk:side", "missing run falls back to walk");
  assert.equal(pk({ jp: 0.5, view: "side" }).i, 3);
  assert.equal(pk({ jp: 0.999 }).i, 5);
  r = pk({}, 1);
  assert.equal(r.key, "idle:front"); assert.equal(r.i, 3);
  assert.equal(pk({ talk: true, vis: [14, 11] }).i, 3);
  assert.equal(pk({ talk: true, vis: [0, 10] }).i, 0);
  assert.equal(pk({ act: "sit", ap: 1 }).key, "sit:front");
  assert.equal(pk({ act: "sit", ap: 1 }).i, 3);
  assert.equal(pk({ act: "wave" }), null, "no wave strip: the normal drawing is used");
  assert.equal(app.stripPick({ strips: { "walk:side": s(8) } }, { ...P0 }, 0), null, "no idle strip: base image is used");
  assert.equal(app.stripPick({}, { ...P0 }, 0), null);
  assert.equal(app.stripPick({ strips: { "idle:front": s(4) } }, { ...P0, talk: true, vis: [14, 8] }, 0).key, "idle:front");
});

test("cleanProject keeps valid motion strips and drops bad ones", () => {
  const s = (over) => ({ img: PNG, n: 8, cw: 200, ch: 380, h: 370, ...over });
  const p = base();
  Object.assign(p.actors[0], { kind: "img", img: PNG, dir: "L", strips: {
    "walk:side": s(), "idle:front": s({ n: 4 }),
    "fly:side": s(), "walk:left": s(), "run:side": s({ n: 99 }), "jump:side": s({ img: "javascript:alert(1)" }), "talk:front": s({ h: 9999 }), "sit:back": null,
  } });
  const a = plain(app.cleanProject(p)).actors[0];
  assert.equal(a.dir, "L");
  assert.deepEqual(Object.keys(a.strips).sort(), ["idle:front", "walk:side"]);
  assert.equal(a.strips["walk:side"].n, 8);

  const q = base();
  Object.assign(q.actors[0], { kind: "img", img: PNG, dir: "X", strips: { "walk:side": s() } });
  assert.equal(plain(app.cleanProject(q)).actors[0].dir, undefined);
  const r = base();
  Object.assign(r.actors[0], { kind: "cat", strips: { "walk:side": s() }, dir: "L" });
  const c = plain(app.cleanProject(r)).actors[0];
  assert.equal(c.strips, undefined);
  assert.equal(c.dir, undefined);
});

test("pose reports the walking angle, uses 2D distance and exposes jump/action progress", () => {
  const mv = (o) => ({ id: "m", type: "move", actor: "a", t: 0, d: 2, style: "walk", ...o });
  const cast = { actor: "a", x: 50, y: 60, flip: false };
  let p = app.pose({ steps: [mv({ x: 50, y: 90 })] }, cast, 1, 1, 0);
  assert.equal(p.view, "front"); assert.equal(p.walk, true); assert.ok(p.phase > 0, "walking toward the camera animates the legs");
  assert.equal(app.pose({ steps: [mv({ x: 50, y: 40 })] }, cast, 1, 1, 0).view, "back");
  assert.equal(app.pose({ steps: [mv({ x: 90, y: 60 })] }, cast, 1, 1, 0).view, "side");
  assert.equal(app.pose({ steps: [mv({ x: 90, y: 62 })] }, cast, 1, 1, 0).view, "side");
  p = app.pose({ steps: [mv({ x: 90, y: 60, style: "hop" })] }, cast, 0.4, 1, 0);
  assert.ok(p.jp >= 0 && p.jp <= 1, "hop progress");
  p = app.pose({ steps: [{ id: "x", type: "act", actor: "a", t: 0, d: 2, act: "jump" }] }, cast, 0.5, 1, 0);
  assert.ok(p.jp >= 0 && p.jp <= 1 && p.ap === 0.25);
  p = app.pose({ steps: [] }, cast, 1, 1, 0);
  assert.equal(p.view, null); assert.equal(p.jp, null);
});
