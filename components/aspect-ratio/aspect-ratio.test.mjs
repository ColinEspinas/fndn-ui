// Aspect ratio: the box keeps its ratio as its width changes, never stretches with its content,
// its children fill it, bad ratios fall back to 16 : 9. Static: no pointer or keyboard path.
//   node components/aspect-ratio/aspect-ratio.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "aspect-ratio";
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

const R = "#stage [data-slot=aspect-ratio]";
const box = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=e.getBoundingClientRect();const round=(n)=>Math.round(n*100)/100;return {w:round(r.width),h:round(r.height),overflow:getComputedStyle(e).overflow,role:e.getAttribute("role")}})()`);
const near = (a, b) => Math.abs(a - b) <= 0.5;

async function run(fw, check) {
  for (const [ex, w, ratio, name] of [[0, 320, 16 / 9, "16 : 9 (default)"], [1, 200, 1, "square"], [2, 180, 0.75, "portrait 3 : 4"], [3, 360, 7 / 3, "wide 21 : 9"]]) {
    await open(fw, ex);
    const b = await box();
    check(`${name}: ${w}px wide, ${Math.round((w / ratio) * 100) / 100}px tall (±0.5px)`, [b.w, near(b.h, w / ratio)], [w, true]);
  }
  await open(fw, 0);
  check("no role, clips what overflows", [(await box()).role, (await box()).overflow], [null, "hidden"]);
  /* a direct child fills it; media cover it */
  check("a direct child (an img) fills the box and covers it", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const img=document.createElement("img");img.alt="";img.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='40'/%3E";e.append(img);const a=e.getBoundingClientRect(),b=img.getBoundingClientRect();const out=[Math.abs(a.width-b.width)<0.5,Math.abs(a.height-b.height)<0.5,getComputedStyle(img).objectFit];img.remove();return out})()`), [true, true, "cover"]);
  check("a direct div fills the box", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const d=document.createElement("div");e.append(d);const a=e.getBoundingClientRect(),b=d.getBoundingClientRect();const out=[Math.abs(a.width-b.width)<0.5,Math.abs(a.height-b.height)<0.5];d.remove();return out})()`), [true, true]);
  check("the container sizes it: at 240px wide it is 135px tall", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});e.style.width="240px";const r=e.getBoundingClientRect();return Math.abs(r.height-135)<0.5})()`), true);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("content taller than the box does not stretch it (200 × 50 at 4 : 1)", near((await box()).h, 50), true);
  for (const [ex, name] of [[1, "zero"], [2, "negative"]]) {
    await open(fw, ex, "&data=worst");
    check(`${name} ratio falls back to 16 : 9 (240 × 135)`, near((await box()).h, 135), true);
  }
  await open(fw, 3, "&data=worst");
  check("very tall 1 : 10: 64 × 640", near((await box()).h, 640), true);
  await open(fw, 4, "&data=worst");
  check("unbreakable text: the box stays 120 × 120", [(await box()).w, near((await box()).h, 120)], [120, true]);
  await open(fw, 2, "&dir=rtl");
  check("rtl: same box (180 × 240)", near((await box()).h, 240), true);
  await open(fw, 0, "&theme=dark");
  check("dark: same box (no colour of its own)", near((await box()).h, 180), true);
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
