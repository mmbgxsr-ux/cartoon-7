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

test("boy/girl keep valid hair and pants colours only", () => {
  const o = base();
  o.actors = [
    { id: "a1", name: "B", kind: "boy", color: "#aabbcc", accent: "#ffffff", hair: "#112233", pants: "#445566" },
    { id: "a2", name: "G", kind: "girl", color: "#aabbcc", accent: "#ffffff", hair: "red", pants: "#445566" },
    { id: "a3", name: "C", kind: "cat", color: "#aabbcc", accent: "#ffffff", hair: "#112233" },
  ];
  o.scenes[0].cast = [{ actor: "a1", x: 10, y: 80 }];
  const r = plain(app.cleanProject(o));
  assert.equal(r.actors[0].hair, "#112233");
  assert.equal(r.actors[0].pants, "#445566");
  assert.equal(r.actors[1].hair, undefined);
  assert.equal(r.actors[1].pants, undefined);
  assert.equal(r.actors[2].hair, undefined);
});

test("lesson template is a valid project with dialogue", () => {
  const o = plain(app.cleanProject(plain(app.lessonProject())));
  assert.ok(o);
  assert.equal(o.actors.length, 3);
  assert.ok(o.scenes.length >= 10);
  assert.ok(o.scenes.some((s) => s.steps.some((x) => x.type === "say" && x.text)));
  assert.equal(o.actors[0].hair, "#7a4a2a");
});

test("voice file attach accepts audio data urls in projects", () => {
  const o = base();
  o.scenes[0].steps = [{ id: "x1", type: "say", actor: "a1", t: 0, d: 2, text: "hi", aud: "data:audio/mpeg;base64,AAAA" }];
  assert.equal(plain(app.cleanProject(o)).scenes[0].steps[0].aud, "data:audio/mpeg;base64,AAAA");
});

test("walk stride matches ground speed and ends on a half-cycle", () => {
  const cast = { actor: "a", x: 10, y: 80, flip: false };
  for (const dx of [20, 35, 60, 80]) {
    const st = { steps: [{ id: "m", type: "move", actor: "a", t: 0, d: 4, style: "walk", x: 10 + dx, y: 80 }] };
    const end = app.pose(st, cast, 3.999, 1, 0);
    const k = end.phase / Math.PI;
    assert.ok(Math.abs(k - Math.round(k)) < 0.05, `dx=${dx} ends mid-step (phase/pi=${k.toFixed(2)})`);
    // feet speed (px of stride per px of travel) stays near natural: one cycle covers 0.8 body heights
    const cyc = end.phase / (2 * Math.PI), px = dx * 1280 / 100, body = 270 * end.sc;
    const ratio = (px / cyc) / body;
    assert.ok(ratio > 0.55 && ratio < 1.2, `dx=${dx} foot sliding ratio ${ratio.toFixed(2)}`);
  }
});

test("speech nod: kick fades after a line starts and mouth amplitude is 0..1", () => {
  const cast = { actor: "a", x: 50, y: 80, flip: false };
  const st = { steps: [{ id: "s", type: "say", actor: "a", t: 1, d: 2, text: "مرحبا بكم", emo: "happy" }] };
  assert.equal(app.pose(st, cast, 0.5, 0, 0).kick, 0);
  assert.ok(Math.abs(app.pose(st, cast, 1.15, 0, 0).kick) > 0.01);
  assert.ok(Math.abs(app.pose(st, cast, 1.8, 0, 0).kick) < 0.001);
  for (const t of [1.1, 1.5, 2, 2.8]) { const a = app.pose(st, cast, t, 0, 0).amp; assert.ok(a >= 0 && a <= 1); }
});

test("lesson characters ship talk + idle strips (mouth frames, then gesture frames)", () => {
  for (const k of ["sami", "friend", "mona"]) {
    const st = app.ASSETS[k].strips, s = st["talk:front"], id = st["idle:front"];
    assert.ok(s && id, k + " has talk and idle strips");
    assert.match(s.img, /^data:image\/webp;base64,/);
    assert.equal(id.n, 1);
    assert.ok(s.m >= 4 && s.m < s.n, "mouth frames come first");
    assert.ok(s.g && s.g.point >= s.m && s.g.point < s.n, "point gesture frame after the mouth frames");
    assert.ok(s.cw >= 8 && s.ch >= 8 && s.h >= 8 && s.h <= s.ch);
    assert.equal(id.cw, s.cw, "idle and talk share the same frame size/anchor");
    assert.ok(st["walk:side"], k + " keeps its walk strip");
    const a = { strips: st };
    const pk = (open) => app.stripPick(a, { talk: true, vis: [open, 8], seed: 0, phase: 0 }, 0);
    assert.equal(pk(0).key, "talk:front");
    assert.equal(pk(0).i, 0, "closed mouth -> first frame");
    assert.equal(pk(14).i, s.m - 1, "wide open -> last MOUTH frame (never a gesture frame)");
    assert.equal(app.stripPick(a, { phase: 0 }, 0).key, "idle:front", "not talking: idle strip");
  }
});

test("talk strips survive cleanProject", () => {
  const s = app.ASSETS.sami.strips["talk:front"];
  const o = base();
  o.actors = [{ id: "a1", name: "A", kind: "img", img: app.ASSETS.sami.img, strips: { "talk:front": s } }];
  const r = app.cleanProject(o);
  assert.ok(r && r.actors[0].strips && r.actors[0].strips["talk:front"], "kept");
  assert.equal(r.actors[0].strips["talk:front"].n, s.n);
  assert.equal(r.actors[0].strips["talk:front"].m, s.m);
  assert.deepEqual(plain(r.actors[0].strips["talk:front"].g), plain(s.g));
});

test("talk strip: smoothed mouth keeps the hand out during short pauses", () => {
  const a = { strips: { "talk:front": { img: PNG, n: 5, cw: 10, ch: 10, h: 10 } } };
  const pk = (tOpen, tAny) => app.stripPick(a, { talk: true, vis: [1, 10], tOpen, tAny, seed: 0, phase: 0 }, 0).i;
  assert.equal(pk(0, false), 0, "sustained closed mouth -> frame 0");
  assert.equal(pk(0.05, true), 1, "short pause inside speech -> smallest open frame, not frame 0");
  assert.equal(pk(1, true), 4, "wide open -> last frame");
  assert.ok(pk(0.5, true) >= 1 && pk(0.5, true) <= 4);
});

test("talk strip: neighbouring frames are blended instead of jumping", () => {
  const a = { strips: { "talk:front": { img: PNG, n: 6, cw: 10, ch: 10, h: 10, m: 4, g: { point: 4, chest: 5 } } } };
  const pk = (o, extra = {}) => app.stripPick(a, { talk: true, vis: [1, 10], tOpen: o, tAny: true, tN: 6, seed: 0, phase: 0, ...extra }, 0);
  const s0 = pk(0.0), s1 = pk(0.25);
  assert.equal(s0.i, 1); assert.ok(s0.mx < 0.05);
  assert.ok(s1.j != null && s1.mx > 0 && s1.mx <= 0.5, "mid-way: second frame mixed in");
  assert.ok(pk(1).i === 3 && !pk(1).mx, "fully open stays on the last mouth frame");
  assert.equal(pk(0.5, { gest: "point", gw: 1 }).i, 4, "gesture at full weight shows the gesture frame");
  assert.equal(pk(0.5, { gest: "point", gw: 0.2 }).j, 4, "gesture fading in is mixed over the mouth frame");
  assert.equal(pk(0.5, { gest: "chest", gw: 1, tN: 0, tAny: false }).i, 0, "no gesture during a pause");
});

test("gestFor picks a gesture from the sentence text", () => {
  assert.equal(app.gestFor("أنا أعرف الإجابة! أنا أعرفها!").k, "chest");
  assert.equal(app.gestFor("لماذا أخذت ساندويتشي؟!").k, "point");
  assert.equal(app.gestFor("هذا كلام عادي جدًا بدون أي تعبير"), null);
  assert.equal(app.gestFor("نعم!"), null, "too short");
  const g = app.gestFor("وتريد أن تجيب بسرعة، لكن السؤال لم ينتهِ بعد");
  assert.ok(g && g.u >= 0.12 && g.u <= 0.75);
});

const lessonClean = (hero) => app.cleanProject(JSON.parse(JSON.stringify(app.lessonProject(hero))));
const gStub = () => new Proxy({}, {
  get: (t, k) => (k in t ? t[k] : k === "measureText" ? () => ({ width: 120 }) : /^create/.test(String(k)) ? () => ({ addColorStop() {} }) : () => {}),
  set: (t, k, v) => { t[k] = v; return true; },
});

test("lesson: every speaker is in the scene, and the three characters share the dialogue", () => {
  for (const hero of [true, false]) {
    const p = lessonClean(hero), cnt = {};
    for (const sc of p.scenes) {
      const ids = new Set(sc.cast.map((c) => c.actor));
      for (const s of sc.steps) {
        assert.ok(s.t + s.d <= sc.dur + 0.01, sc.title + ": step ends inside the scene");
        if (s.type === "say") { assert.ok(ids.has(s.actor), sc.title + ": speaker is in the cast"); cnt[s.actor] = (cnt[s.actor] || 0) + 1; }
      }
    }
    const v = Object.values(cnt);
    assert.equal(v.length, 3);
    assert.ok(Math.min(...v) >= 8 && Math.max(...v) - Math.min(...v) <= 4, "balanced: " + JSON.stringify(cnt));
  }
});

test("lesson: red alert, heartbeat and breathing overlays, plus a summary list card", () => {
  const p = lessonClean(true);
  const fx = p.scenes.flatMap((s) => s.steps.filter((x) => x.type === "fx").map((x) => x.fx)).sort();
  assert.deepEqual([...new Set(fx)], ["alert", "badge", "breath", "pulse"]);
  const card = p.scenes.find((s) => s.kind === "card" && s.mode === "list");
  assert.ok(card && card.t2.split("\n").length === 3, "summary card with three steps");
  const iCard = p.scenes.indexOf(card), iVocab = p.scenes.findIndex((s) => s.mode === "credits");
  assert.ok(iCard < iVocab, "summary comes before the vocabulary credits");
  app.P = p; app.recalc();
  const k = {}; app.EV.forEach((e) => { if (e.k === "sfx") k[e.v] = (k[e.v] || 0) + 1; });
  assert.ok(k.alarm >= 4 && k.beat >= 4 && k.breathin === 2 && k.breathout === 2, JSON.stringify(k));
});

test("lesson: opens with the impulsive moment, step badges 1-2-3 appear, and the scene is replayed with the device", () => {
  const p = lessonClean(true);
  const first = p.scenes[1];
  assert.equal(first.title, "لحظة اندفاع", "cold open right after the title card");
  assert.ok(first.steps.some((x) => x.type === "say" && x.emo === "angry"), "cold open starts with anger");
  const badges = p.scenes.flatMap((s) => s.steps.filter((x) => x.type === "fx" && x.fx === "badge").map((x) => x.label));
  assert.ok(badges.length >= 6 && badges.every((l) => l && l.length <= 40), "badge labels kept");
  const stepBadges = badges.filter((l) => /^[١٢٣] ·/.test(l));
  assert.deepEqual(stepBadges.filter((l, i) => i === 0 || l !== stepBadges[i - 1]).slice(0, 3).map((l) => l.charAt(0)), ["١", "٢", "٣"]);
  assert.ok(badges.some((l) => l.includes("=")), "vocabulary labels appear while the word is spoken");
  const iCard = p.scenes.findIndex((s) => s.title === "نعيد المشهد" && s.kind === "card");
  assert.ok(iCard > 0 && p.scenes[iCard + 1].bg === first.bg && p.scenes[iCard + 1].title === "القرار الصائب", "replay happens in the same place as the cold open");
});

test("lesson direction: varied camera and transitions, character gestures and moves, a concrete helpful-impulse example", () => {
  const p = lessonClean(true), sc = p.scenes.filter((s) => s.kind !== "card");
  assert.ok(sc.filter((s) => s.cam && s.cam !== "fixed").length >= 8, "camera moves");
  assert.ok(new Set(p.scenes.map((s) => s.trans)).size >= 4, "varied transitions");
  assert.ok(sc.filter((s) => s.steps.some((x) => x.type === "act")).length >= 3, "gestures");
  assert.ok(sc.filter((s) => s.steps.some((x) => x.type === "move")).length >= 5, "characters move");
  const useful = p.scenes.find((s) => s.title === "الاندفاع المفيد");
  assert.ok(useful.steps.some((x) => x.type === "move" && x.style === "run"), "a rescue run in the helpful-impulse scene");
  assert.ok(useful.steps.some((x) => x.type === "say" && /دراجة/.test(x.text)), "bicycle example");
  const cold = p.scenes[1];
  assert.ok(cold.steps.some((x) => x.type === "move" && x.actor === cold.cast[2].actor), "Mona walks in during the cold open");
});

test("camera: never reveals the background edge, deterministic, follow mode pans toward the speaker", () => {
  const p = lessonClean(true);
  app.P = p; app.recalc();
  for (const sc of p.scenes) {
    for (let lt = 0; lt <= sc.dur; lt += 0.25) {
      const c = app.camState(sc, lt), mx = 640 * (c.s - 1) / c.s + 1e-6, my = 360 * (c.s - 1) / c.s + 1e-6;
      assert.ok(c.s >= 1 && c.s <= 1.2, sc.title + " zoom range");
      assert.ok(Math.abs(c.tx) <= mx && Math.abs(c.ty) <= my, sc.title + " stays inside the background at " + lt);
      assert.deepEqual(plain(app.camState(sc, lt)), plain(c), "pure function of time");
    }
  }
  const cold = p.scenes[1];
  assert.equal(cold.cam, "follow");
  const a = app.camState(cold, 0.1);
  assert.equal(a.s, 1, "starts on a wide establishing shot");
  const pt = app.camPt(cold, 5, 640, 360);
  assert.ok(Math.abs(pt.x - 640) < 70 && Math.abs(pt.y - 360) < 40, "screen point stays near the scene point");
});

test("bubbles and badges draw without errors in every scene, in screen space", () => {
  const p = lessonClean(true); app.P = p; app.recalc();
  const g = gStub();
  for (const sc of p.scenes) for (let lt = 0; lt < sc.dur; lt += 0.5) app.drawScene(g, sc, lt, lt);
  app.bubble(g, "نص تجريبي طويل ".repeat(12), 640, 300, 0.5, { emo: "angry", name: "سامي", col: "#d62828", u: 0.5, d: 3, noRight: 1000, vocab: ["نص"] });
  assert.equal(app.vocabKey("«توشك»،"), "توشك");
});

test("lesson: every vocabulary label is shown while inside its line window and ends inside the scene", () => {
  const p = lessonClean(true);
  for (const sc of p.scenes) for (const x of sc.steps) if (x.type === "fx" && x.fx === "badge") assert.ok(x.t + x.d <= sc.dur + 0.01, sc.title + " badge ends inside scene");
  const voc = p.scenes.flatMap((s) => s.steps.filter((x) => x.fx === "badge" && x.label.includes("=")));
  assert.ok(voc.length >= 5 && voc.every((v) => v.d <= 2.9 + 1e-9), "vocabulary plates last at most ~2.8 s");
});

test("badge fx keeps its label (trimmed to 40 chars) and drops it for other overlays", () => {
  const o = base();
  o.scenes[0].steps = [
    { id: "b1", type: "fx", fx: "badge", t: 0, d: 2, label: "x".repeat(60) },
    { id: "b2", type: "fx", fx: "alert", t: 0, d: 2, label: "no" },
  ];
  const st = plain(app.cleanProject(o)).scenes[0].steps;
  assert.equal(st[0].label.length, 40);
  assert.equal(st[1].label, undefined);
});

test("fx steps survive cleanProject and unknown overlays fall back", () => {
  const o = base();
  o.scenes[0].steps = [{ id: "f1", type: "fx", fx: "pulse", t: 1, d: 2 }, { id: "f2", type: "fx", fx: "nonsense", t: 0, d: 1 }];
  const r = app.cleanProject(o);
  assert.equal(r.scenes[0].steps[0].fx, "pulse");
  assert.equal(r.scenes[0].steps[0].actor, undefined);
  assert.equal(r.scenes[0].steps[1].fx, "alert");
  o.scenes.push({ id: "c", kind: "card", mode: "list", t1: "x", t2: "a\nb", bg: "night", dur: 6 });
  assert.equal(app.cleanProject(o).scenes[1].mode, "list");
});

test("overlays and the list card draw without errors at any time", () => {
  for (const fx of ["breath", "alert", "pulse"]) for (const u of [0, 0.1, 1.3, 2.7, 4.9, 5.4]) app.drawOvl(gStub(), { fx, t: 0, d: 5.5 }, u);
  for (const lt of [0, 0.5, 1.2, 3, 8.5]) app.drawCardText(gStub(), { mode: "list", t1: "عنوان", t2: "أ\nب\nج", bg: "night", dur: 9 }, lt);
  for (const k of ["beat", "alarm", "breathin", "breathout"]) app.playSfx(k);
});


test("breathing is a real guided cycle: inhale, short hold, exhale, with sound events matching the phases", () => {
  const b = (u) => app.breathAt(u, 8);
  assert.equal(b(0.1).ph, 0); assert.equal(b(3.8).ph, 1); assert.equal(b(5).ph, 2);
  assert.ok(Math.abs(app.breathCyc(8) - 8) < 1e-9 && app.breathCyc(20) <= 10);
  const p = lessonClean(true); app.P = p; app.recalc();
  const ins = app.EV.filter((e) => e.v === "breathin"), outs = app.EV.filter((e) => e.v === "breathout");
  assert.ok(ins.length === 2 && outs.length === 2);
  ins.forEach((e, i) => { assert.ok(e.d > 2.5, "inhale lasts seconds"); assert.ok(outs[i].T > e.T + e.d, "exhale starts after the inhale ends"); });
  const al = app.EV.filter((e) => e.v === "alerthit"), calm = app.EV.filter((e) => e.v === "calm");
  assert.ok(al.length >= 2 && calm.length === al.length, "each alert opens with a hit and ends with a calm chime");
});

test("music ducks while a breathing, alert or pulse effect is active", () => {
  const p = lessonClean(true); app.P = p; app.recalc();
  let ducked = 0, free = 0;
  for (let T = 0; T < app.TOTAL; T += 0.25) (app.fxDuck(T) < 1 ? ducked++ : free++);
  assert.ok(ducked > 8 && free > 8);
});
