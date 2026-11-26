// Parity check: render each example of a component in React, Vue and Svelte through the docs
// harness and compare the DOM they produce, the first target the spec lists being the reference.
// The three get their classes from the same recipe, so "same classes, same state attributes, same
// structure" means "same component" in every target. Class lists are compared in full. A component
// with one target has nothing to compare; the summary names those.
//
//   node scripts/qa/parity.mjs select            one or more components
//   node scripts/qa/parity.mjs                   every component that has examples
//   node scripts/qa/parity.mjs --steps <names>   also after every step of each scenario (examples
//                                                with `steps`), rendered with &step=<n>
//
// Needs the dev server (pnpm docs). Ignored on purpose: ids and id references, inline styles,
// framework bookkeeping attributes, and what is inside an icon (each target's Phosphor package
// draws its own SVG).
import { launch, sleep } from "./cdp.mjs";
import { loadSpecs, targetsOf } from "../lib.mjs";

const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const alone = new Map(); // "react only" → components
const withSteps = process.argv.includes("--steps");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const specs = loadSpecs().map((s) => s.spec)
  .filter((s) => (only.length ? only.includes(s.name) : s.examples?.length));

/* runs in the page: a normalized outline of the stage and of anything portaled to <body> */
const SERIALIZE = `(() => {
  const SKIP_ATTR = /^(id|style|class|for|name|form|value|data-v-.*|data-svelte.*|data-reactroot|data-ownedby|data-controls|data-uid|data-harness-ready|data-measured|dir|tabindex|autocomplete)$/;
  /* a sub-menu's trigger row carries the engine's generated id in data-value (menu:<id>:trigger) */
  const ID_REF = /^(aria-controls|aria-labelledby|aria-describedby|aria-activedescendant|aria-owns|data-activedescendant|data-trigger-id|data-trigger-proxy-id)$/;
  const lines = [];
  const walk = (node, depth) => {
    if (node.nodeType === 3) { const t = node.textContent.replace(/\\s+/g, " ").trim(); if (t) lines.push("  ".repeat(depth) + JSON.stringify(t)); return; }
    if (node.nodeType !== 1) return;
    const el = node;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "VITE-ERROR-OVERLAY") return;
    const cls = [...el.classList].sort();
    /* an icon is one node: the three Phosphor packages do not draw the same markup inside the svg.
     * Marked data-slot="icon", or a Phosphor svg that is itself a named part (search-icon). */
    if (el.getAttribute("data-slot") === "icon" || (el.tagName.toLowerCase() === "svg" && el.getAttribute("viewBox") === "0 0 256 256")) { lines.push("  ".repeat(depth) + "<icon>"); return; }
    const attrs = [...el.attributes].filter((a) => !SKIP_ATTR.test(a.name)).filter((a) => a.name !== "data-harness-host").map((a) => ID_REF.test(a.name) || (a.name === "data-value" && /:trigger$/.test(a.value)) ? a.name + "=#" : a.value === "" || a.value === "true" ? a.name : a.name + "=" + a.value).sort();
    const wrapper = el.hasAttribute("data-harness-host");
    if (!wrapper) lines.push("  ".repeat(depth) + el.tagName.toLowerCase() + (cls.length ? "." + cls.join(".") : "") + (attrs.length ? " [" + attrs.join(" ") + "]" : ""));
    for (const child of el.childNodes) walk(child, wrapper ? depth : depth + 1);
  };
  const stage = document.querySelector("#stage");
  for (const child of stage.childNodes) walk(child, 0);
  /* portals are compared as a set: the order in which nested popups are appended to <body> is the
   * framework's mount order (React appends a nested menu's panel before its parent's), not a part */
  const stageLines = lines.splice(0);
  const portals = [];
  for (const el of document.body.children) if (el !== stage && !el.matches("script, style, vite-error-overlay")) { walk(el, 0); portals.push("— portal —\\n" + lines.splice(0).join("\\n")); }
  return [...stageLines, ...portals.sort()].join("\\n");
})()`;

const page = await launch();
let failures = 0, checked = 0;
for (const spec of specs) {
  const examples = spec.examples ?? [];
  if (!examples.length) { console.log(`${spec.name}: no examples in the spec — nothing to compare`); continue; }
  /* only the targets the spec lists (`targets`, all three by default) */
  const TARGETS = targetsOf(spec);
  const REF = TARGETS[0];
  if (TARGETS.length === 1) { const k = `${REF} only`; if (!alone.has(k)) alone.set(k, new Set()); alone.get(k).add(spec.name); }
  for (let i = 0; i < examples.length; i++) {
    if (examples[i].frameworks === false) continue;
    const frames = withSteps ? (examples[i].steps?.length ?? 0) : 0;
    for (let step = 0; step <= frames; step++) {
    const label = `${spec.name} / ${examples[i].name}${frames ? ` / step ${step}` : ""}`;
    const out = {};
    const renderTarget = async (fw) => {
      page.errors.length = 0;
      await page.goto(`${BASE}/harness.html?c=${spec.name}&fw=${fw}&ex=${i}${step ? `&step=${step}` : ""}`, 300);
      for (let t = 0; t < 40; t++) { if (await page.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
      await sleep(250);
      return page.eval(SERIALIZE);
    };
    for (const fw of TARGETS) {
      out[fw] = await renderTarget(fw);
      /* another component being edited can reload the dev page mid-render: try again before judging */
      for (let attempt = 0; attempt < 2 && (!out[fw] || (fw !== REF && out[fw] !== out[REF]) || page.errors.length); attempt++) { await sleep(600); out[fw] = await renderTarget(fw); }
      if (page.errors.length) { failures++; console.log(`✗ ${label} / ${fw}: console error: ${page.errors[0].slice(0, 200)}`); }
    }
    checked++;
    let same = true;
    for (const fw of TARGETS) {
      if (fw === REF || out[fw] === out[REF]) continue;
      same = false;
      failures++;
      console.log(`✗ ${label}: ${fw} differs from ${REF}`);
      const base = out[REF].split("\n"), other = out[fw].split("\n");
      let shown = 0;
      for (let l = 0; l < Math.max(base.length, other.length) && shown < 6; l++) {
        if (base[l] !== other[l]) { console.log(`    ${REF.padEnd(6)}: ${base[l] ?? "(nothing)"}\n    ${fw.padEnd(6)}: ${other[l] ?? "(nothing)"}`); shown++; }
      }
    }
    if (same) console.log(`✓ ${label}: ${TARGETS.join(" = ")} (${out[TARGETS[0]].split("\n").length} nodes)`);
    }
  }
}
for (const [k, names] of alone) console.log(`${k}: ${names.size} component${names.size === 1 ? "" : "s"} (${[...names].join(", ")}): nothing to compare it with`);
console.log(`${checked} ${withSteps ? "frames" : "examples"} compared · ${failures} problems`);
await page.close();
process.exit(failures ? 1 : 0);
