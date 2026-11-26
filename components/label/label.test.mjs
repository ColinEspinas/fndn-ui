// Label: a <label> (Ark's Field.Label) in the Input field's type (13px, medium, ink), htmlFor, the
// long, unbreakable and right-to-left names wrapping whole, dark. Static: not focusable.
//   node components/label/label.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "label";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
/* hover: true makes headless Chromium report a mouse, so the gated hover rules apply */
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);
const css = (sel, keys) => q(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const cs=getComputedStyle(e);return ${JSON.stringify(keys)}.map((k)=>cs[k])})()`);

const L = "#stage [data-slot=label]";
const box = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(L)});const r=e.getBoundingClientRect();return {w:r.width,h:r.height,sw:e.scrollWidth,cw:e.clientWidth}})()`);

async function run(fw, check) {
  await open(fw, 0);
  const ink = await token("--fndn-ink", "color");
  check("a <label>, data-slot=label, its text", await q(`(()=>{const e=document.querySelector(${JSON.stringify(L)});return [e.tagName,e.textContent,e.tabIndex]})()`), ["LABEL", "Email address", -1]);
  check("the Input field's label type: 13px, 500, ink", await css(L, ["fontSize", "fontWeight", "color"]), ["13px", "500", ink]);
  await open(fw, 1);
  check("htmlFor reaches the element (for=project)", await q(`document.querySelector(${JSON.stringify(L)}).htmlFor`), "project");

  /* worst cases: a name is never cut; it wraps, an unbreakable one anywhere */
  await open(fw, 0, "&data=worst");
  let b = await box();
  check("long label in 240px: wraps to several lines, nothing overflows", [Math.round(b.w), b.h > 25, b.sw <= b.cw + 1], [240, true, true]);
  await open(fw, 1, "&data=worst");
  b = await box();
  check("unbreakable label in 160px: breaks anywhere, nothing overflows", [Math.round(b.w), b.h > 25, b.sw <= b.cw + 1], [160, true, true]);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the text keeps its own direction (plaintext), starts at the right", await q(`(()=>{const e=document.querySelector(${JSON.stringify(L)});const cs=getComputedStyle(e);const range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect(),r=e.getBoundingClientRect();return [cs.unicodeBidi, Math.abs(t.right-r.right)<1]})()`), ["plaintext", true]);
  await open(fw, 0, "&theme=dark");
  check("dark: the dark ink", (await css(L, ["color"]))[0], await token("--fndn-ink", "color"));
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
