// Loads the browser scripts into a Node vm sandbox with a permissive DOM stub,
// so pure logic (cleanProject, recalc, ...) can be unit-tested without a browser.
import vm from "node:vm";
import { read, scriptFiles } from "../scripts/lib.mjs";

function stub() {
  const f = function () {};
  const p = new Proxy(f, {
    get: (_, k) => (k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : p),
    set: () => true,
    apply: () => p,
    construct: () => p,
  });
  return p;
}

export function loadApp() {
  const store = Object.create(null);
  const sandbox = {
    console,
    Math, JSON, Date, Object, Array, String, Number, RegExp, Promise, Float32Array, Uint8Array,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0,
    performance: { now: () => 0 },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    Image: class Image { constructor() { this.width = 400; this.height = 600; } },
    document: stub(), navigator: { userAgent: "node" },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const { list } = scriptFiles();
  const code = list.map((f) => read(f)).join("\n");
  vm.runInContext(code, sandbox, { filename: "bundle.js" });
  return sandbox;
}
