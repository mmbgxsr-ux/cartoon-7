// Static checks for the global-scope scripts. The 18 files share one scope (no modules), so a typo in a
// function or variable name only fails at run time. We lint the concatenated bundle as ONE script (the same
// order the browser loads it) and map line numbers back to the original files.
//   CI:    npm i --no-save eslint@10   then   npm run lint
//   local: skipped with a hint when ESLint is not installed (set CI=1 to make it mandatory)
import { createRequire } from "node:module";
import { read, scriptFiles } from "./lib.mjs";

const require = createRequire(import.meta.url);
let ESLint;
try { ({ ESLint } = require("eslint")); }
catch {
  if (process.env.CI) { console.error("lint: eslint is not installed (npm i --no-save eslint@10)"); process.exit(1); }
  console.log("lint: skipped (eslint not installed; run `npm i --no-save eslint@10`)"); process.exit(0);
}

const { list } = scriptFiles();
const map = []; // [{file, start, len}] in bundle line numbers (1-based)
let line = 1, text = "";
for (const f of list) {
  const src = read(f).replace(/\r\n/g, "\n"), n = src.split("\n").length;
  map.push({ file: f, start: line, len: n });
  text += src + "\n"; line += n;
}
const where = (l) => { const m = map.find((x) => l >= x.start && l < x.start + x.len) || map[map.length - 1]; return `${m.file}:${l - m.start + 1}`; };

// Browser APIs the scripts use. Anything else that is not declared in some script is reported as undefined.
const ro = (names) => Object.fromEntries(names.split(/\s+/).filter(Boolean).map((n) => [n, "readonly"]));
const BROWSER = ro(`window document navigator localStorage indexedDB performance console setTimeout clearTimeout setInterval
  clearInterval requestAnimationFrame cancelAnimationFrame Image Blob URL FileReader Audio AudioContext webkitAudioContext
  OfflineAudioContext AudioData AudioEncoder VideoEncoder VideoFrame MediaRecorder MediaStream Event KeyboardEvent
  Promise JSON Math Date Object Array String Number Boolean RegExp Error Map Set WeakMap Symbol Float32Array Uint8Array
  Uint8ClampedArray Int16Array ArrayBuffer DataView TextEncoder TextDecoder atob btoa fetch alert confirm prompt
  parseInt parseFloat isFinite isNaN encodeURIComponent decodeURIComponent escape unescape CustomEvent location
  matchMedia getComputedStyle structuredClone queueMicrotask`);

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [{
    files: ["**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "script", globals: BROWSER },
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      "no-undef": "error",            // typos and missing script order
      "no-redeclare": "error",        // the same function/var defined in two files silently overrides
      "no-dupe-keys": "error",
      "no-dupe-else-if": "error",
      "no-dupe-args": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-func-assign": "error",
      "no-self-assign": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-finally": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "no-loss-of-precision": "error",
      "no-sparse-arrays": "error",
      "no-empty-pattern": "error",
    },
  }],
});
const [res] = await eslint.lintText(text, { filePath: "bundle.js" });
for (const m of res.messages) console.error(`${where(m.line)}  ${m.severity === 2 ? "error" : "warn "}  ${m.message}  (${m.ruleId})`);
const errors = res.messages.filter((m) => m.severity === 2).length;
if (errors) { console.error(`\nlint: ${errors} problem(s)`); process.exit(1); }
console.log(`lint: OK (${list.length} scripts, linted as one scope)`);
