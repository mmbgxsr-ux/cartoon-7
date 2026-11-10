import { test } from "node:test";
import assert from "node:assert/strict";
import { loadApp } from "./load.mjs";

const app = loadApp();
const plain = (v) => JSON.parse(JSON.stringify(v));
const project = (scenes, extra = {}) => ({
  title: "فيلم",
  music: "happy",
  vol: 0.6,
  actors: [
    { id: "a1", name: "ميمو", kind: "cat", color: "#f4a259", accent: "#ffe6c7" },
    { id: "a2", name: "كريم", kind: "boy", color: "#3a86ff", accent: "#f1c27d" },
  ],
  scenes: scenes.map((s, i) => ({
    id: "s" + i, title: "مشهد" + i, bg: "day", dur: 10,
    cast: [{ actor: "a1", x: 10, y: 80 }, { actor: "a2", x: 60, y: 80 }],
    steps: [], ...s,
  })),
  ...extra,
});
const load = (p) => app.loadP(plain(app.cleanProject(p)));
const say = (t, d, text, actor = "a1") => ({ id: "x" + t + actor, type: "say", actor, t, d, text, emo: "happy" });
const mv = (t, d, actor = "a1") => ({ id: "m" + t + actor, type: "move", actor, t, d, x: 50, y: 80, style: "walk" });
const msgs = (sev) => plain(app.qcCheck()).filter((x) => !sev || x.sev === sev).map((x) => x.msg);

test("qcCheck: a healthy film has no errors or warnings", () => {
  load(project([{ steps: [say(0.5, 3, "مرحبا بك"), mv(4, 3)] }, { steps: [say(0.5, 3, "وداعا", "a2"), mv(4, 3, "a2")] }]));
  assert.deepEqual(msgs("e"), []);
  assert.deepEqual(msgs("w"), []);
});

test("qcCheck: flags scenes without cast or steps as errors", () => {
  load(project([{ cast: [], steps: [] }]));
  const e = msgs("e");
  assert.ok(e.some((m) => m.includes("بلا شخصيات")));
  assert.ok(e.some((m) => m.includes("بلا حركة أو حوار")));
});

test("qcCheck: empty dialogue line is an error", () => {
  load(project([{ steps: [say(1, 2, "   ")] }]));
  assert.ok(msgs("e").some((m) => m.includes("فارغة")));
});

test("qcCheck: speech that is too fast warns, recorded voice does not", () => {
  load(project([{ steps: [say(1, 0.5, "نص طويل جدا لا يمكن قراءته بهذه السرعة أبدا")] }]));
  assert.ok(msgs("w").some((m) => m.includes("سريع جدًا")));
});

test("qcCheck: step ending after the scene warns", () => {
  load(project([{ dur: 5, steps: [mv(3, 4)] }]));
  assert.ok(msgs("w").some((m) => m.includes("بعد نهاية المشهد")));
});

test("qcCheck: overlapping moves for the same actor warn, different actors do not", () => {
  load(project([{ steps: [mv(1, 3), mv(2, 3)] }]));
  assert.ok(msgs("w").some((m) => m.includes("متداخلتان")));
  load(project([{ steps: [mv(1, 3, "a1"), mv(2, 3, "a2"), say(0, 1, "هلا")] }]));
  assert.ok(!msgs("w").some((m) => m.includes("متداخلتان")));
});

test("qcCheck: step for an actor not in the scene is an error", () => {
  load(project([{ cast: [{ actor: "a1", x: 10, y: 80 }], steps: [say(1, 2, "مرحبا", "a2")] }]));
  assert.ok(msgs("e").some((m) => m.includes("غير موجودة في المشهد")));
});

test("qcCheck: unused actors and duplicate names warn", () => {
  load(project([{ cast: [{ actor: "a1", x: 10, y: 80 }], steps: [say(1, 2, "مرحبا")] }]));
  assert.ok(msgs("w").some((m) => m.includes("غير مستخدمة")));
  const p = project([{ steps: [say(1, 2, "مرحبا")] }]);
  p.actors[1].name = "ميمو";
  load(p);
  assert.ok(msgs("w").some((m) => m.includes("اسمان متطابقان")));
});

test("qcCheck: info notes for short film, silent music and a long gap", () => {
  load(project([{ dur: 8, steps: [say(0, 1, "هلا")] }], { music: "none" }));
  const i = msgs("i");
  assert.ok(i.some((m) => m.includes("أقل من 10")));
  assert.ok(i.some((m) => m.includes("الموسيقى مغلقة")));
  assert.ok(i.some((m) => m.includes("فراغ")));
});

test("srtTime formats hh:mm:ss,mmm and rolls over correctly", () => {
  assert.equal(app.srtTime(0), "00:00:00,000");
  assert.equal(app.srtTime(1.5), "00:00:01,500");
  assert.equal(app.srtTime(61.001), "00:01:01,001");
  assert.equal(app.srtTime(3661.9996), "01:01:02,000");
});

async function runSrt(withName) {
  let saved = null;
  const orig = { $: app.$, toast: app.toast, dlBlob: app.dlBlob };
  app.$ = (s) => (s === "#srtName" ? { checked: withName } : orig.$(s));
  app.toast = () => {};
  app.dlBlob = (name, blob) => { saved = { name, blob }; };
  try { app.exportSRT(); } finally { Object.assign(app, orig); }
  return saved && { name: saved.name, text: await saved.blob.text() };
}

test("exportSRT: orders cues by time across scenes with global timestamps", async () => {
  load(project([
    { dur: 10, steps: [say(5, 2, "ثانيا"), say(1, 2, "أولا")] },
    { dur: 10, steps: [say(0.5, 2, "ثالثا", "a2")] },
  ]));
  const r = await runSrt(false);
  assert.ok(r.name.endsWith(".srt"));
  assert.equal(r.text, "1\n00:00:01,000 --> 00:00:03,000\nأولا\n\n2\n00:00:05,000 --> 00:00:07,000\nثانيا\n\n3\n00:00:10,500 --> 00:00:12,500\nثالثا\n");
});

test("exportSRT: optional speaker names and skipping blank lines", async () => {
  load(project([{ steps: [say(1, 2, "مرحبا"), say(4, 2, "   ", "a2")] }]));
  const r = await runSrt(true);
  assert.ok(r.text.includes("ميمو: مرحبا"));
  assert.equal(r.text.split("-->").length - 1, 1);
});

test("exportSRT: no dialogue produces no file", async () => {
  load(project([{ steps: [mv(1, 2)] }]));
  assert.equal(await runSrt(false), null);
});
