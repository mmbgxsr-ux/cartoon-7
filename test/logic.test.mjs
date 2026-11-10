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
