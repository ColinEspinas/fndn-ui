// Progress: the progressbar ARIA from Ark, the range at the value (clamped), label and value,
// indeterminate sweep, travel on change and nothing at mount, right-to-left, dark. Not interactive.
//   node components/progress/progress.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "progress";
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

const R = "#stage [data-slot=progress]";
/* the track, the range's visible part (its box clipped by the track) and the texts */
const read = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const t=e.querySelector("[data-slot=progress-track]");const g=e.querySelector("[data-slot=progress-range]");
  const tr=t.getBoundingClientRect(),gr=g.getBoundingClientRect();const round=(n)=>Math.round(n*100)/100;
  const l=e.querySelector("[data-slot=progress-label]"),v=e.querySelector("[data-slot=progress-value]");
  const shown={x0:round(Math.max(tr.left,gr.left)-tr.left),x1:round(Math.min(tr.right,gr.right)-tr.left)};
  return {role:t.getAttribute("role"),now:t.getAttribute("aria-valuenow"),min:t.getAttribute("aria-valuemin"),max:t.getAttribute("aria-valuemax"),vtext:t.getAttribute("aria-valuetext"),
    name:t.getAttribute("aria-labelledby")?document.getElementById(t.getAttribute("aria-labelledby"))?.textContent:t.getAttribute("aria-label"),
    state:e.dataset.state,tw:round(tr.width),th:round(tr.height),trackBg:getComputedStyle(t).backgroundColor,rangeBg:getComputedStyle(g).backgroundColor,radius:getComputedStyle(t).borderRadius,
    shown,label:l?{text:l.textContent,size:getComputedStyle(l).fontSize,color:getComputedStyle(l).color,h:l.getBoundingClientRect().height,bottom:l.getBoundingClientRect().bottom}:null,
    value:v?{text:v.textContent,hidden:v.getAttribute("aria-hidden"),color:getComputedStyle(v).color,bottom:v.getBoundingClientRect().bottom,nowrap:getComputedStyle(v).whiteSpace}:null,
    anim:getComputedStyle(t,"::before").display==="none"?"none":getComputedStyle(t,"::before").animationName,rangeAnim:getComputedStyle(g).animationName,rangeTf:getComputedStyle(g).transform,transition:getComputedStyle(g).transitionDuration,overflow:e.scrollWidth>e.clientWidth+1}})()`);
const near = (a, b, d = 0.6) => Math.abs(a - b) <= d;

async function run(fw, check) {
  await open(fw, 0);
  const ink = { line: await token("--fndn-line"), orange: await token("--fndn-orange"), accent: await token("--fndn-accent"), green: await token("--fndn-green"), red: await token("--fndn-red"), ink2: await token("--fndn-ink-2", "color") };
  let m = await read();
  check("known value: no band on the track", m.anim, "none");
  check("value 42: the track is a progressbar (0–100, now 42) named by ariaLabel", [m.role, m.min, m.max, m.now, m.name, m.state], ["progressbar", "0", "100", "42", "Upload", "loading"]);
  check("md: track 6px high, full width (280), pill (radius ≥ 3px), line colour; range orange", [m.th, m.tw, parseFloat(m.radius) >= 3, m.trackBg, m.rangeBg], [6, 280, true, ink.line, ink.orange]);
  check("the range shows from the start to 42% of the track (±0.6px)", [m.shown.x0, near(m.shown.x1, 280 * 0.42)], [0, true]);
  check("no label, no value: nothing above the track", [m.label, m.value], [null, null]);
  check("a value change travels: transform over duration.move (200ms)", m.transition.split(", ").includes("0.2s"), true);

  await open(fw, 1);
  m = await read();
  check("label and value: named by its label (aria-labelledby), value \"68%\" aria-hidden", [m.name, m.value.text, m.value.hidden], ["Storage", "68%", "true"]);
  check("label 12px ink-2, value ink-2, never wraps, on one baseline (±0.5px)", [m.label.size, m.label.color, m.value.color, m.value.nowrap, near(m.label.bottom, m.value.bottom, 0.5)], ["12px", ink.ink2, ink.ink2, "nowrap", true]);
  check("accent tone, range to 68%", [m.rangeBg, near(m.shown.x1, 280 * 0.68)], [ink.accent, true]);

  await open(fw, 2);
  m = await read();
  check("complete, sm: 4px track, data-state complete, range fills it, green", [m.th, m.state, m.shown.x0, near(m.shown.x1, 280), m.rangeBg], [4, "complete", 0, true, ink.green]);

  await open(fw, 3);
  m = await read();
  check("indeterminate: no aria-valuenow, data-state indeterminate, no value text", [m.now, m.state, m.value], [null, "indeterminate", null]);
  check("indeterminate: a band sweeps on the track (the shared loop); the range waits out of sight, unanimated", [m.anim, m.rangeAnim, m.shown.x1 <= 0.01], ["fndn-shimmer-text", "none", true]);
  /* the range's transform never changes kind, so a value arriving only translates */
  check("indeterminate: the range is only translated (no scaleX flip to interpolate from)", /^matrix\(1, 0, 0, 1, /.test(m.rangeTf), true);

  await open(fw, 4);
  m = await read();
  check("own value text and range 0–8: shown, aria-valuetext, max 8, range at 3/8", [m.value.text, m.vtext, m.max, m.now, near(m.shown.x1, 280 * 3 / 8), m.rangeBg], ["3 of 8 files", "3 of 8 files", "8", "3", true, ink.red]);

  /* the scenario: a change travels, nothing plays at mount */
  await open(fw, 5);
  m = await read();
  check("mount at 0: the range is out of sight, nothing moving", [m.shown.x1 <= 0.01, await q(`document.getAnimations().length`)], [true, 0]);
  await open(fw, 5, "&play=1");
  await q(`new Promise((res)=>{const t0=performance.now();const tick=()=>{if(document.documentElement.dataset.harnessStep==="1"||performance.now()-t0>3000)return res();requestAnimationFrame(tick)};tick()})`);
  await sleep(60);
  const mid = (await read()).shown.x1;
  await sleep(240);
  const end = (await read()).shown.x1;
  check("a change travels (mid-way between 0 and 18% 60ms in), then lands (300ms in)", [mid > 0.5 && mid < 280 * 0.18 - 0.5, near(end, 280 * 0.18)], [true, true]);
  await open(fw, 5, "&step=4");
  m = await read();
  check("last step: 100%, green, label \"Uploaded\"", [m.now, m.rangeBg, m.label.text, near(m.shown.x1, 280)], ["100", ink.green, "Uploaded", true]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  m = await read();
  check("long label wraps, the value text keeps one line, nothing overflows", [m.label.h > 16, m.value.nowrap, m.overflow, m.value.text], [true, "nowrap", false, "12,480 of 20,000 rows"]);
  await open(fw, 1, "&data=worst");
  m = await read();
  check("140 of 100 is clamped: now 100, range full, 100%", [m.now, near(m.shown.x1, 220), m.value.text], ["100", true, "100%"]);
  await open(fw, 2, "&data=worst");
  m = await read();
  check("-20 is clamped: now 0, range out of sight", [m.now, m.shown.x1 <= 0.01], ["0", true]);
  await open(fw, 4, "&data=worst");
  check("48px wide: nothing overflows", (await read()).overflow, false);
  await open(fw, 5, "&data=worst");
  check("unbreakable label: wraps inside, nothing overflows", (await read()).overflow, false);
  await open(fw, 3, "&data=worst&dir=rtl");
  m = await read();
  check("rtl: the range grows from the right (shows the last 30%)", [near(m.shown.x0, 220 * 0.7), near(m.shown.x1, 220)], [true, true]);
  await open(fw, 3, "&dir=rtl");
  check("rtl indeterminate: still sweeping", (await read()).anim, "fndn-shimmer-text");
  await open(fw, 1, "&theme=dark");
  m = await read();
  check("dark: the dark line and accent", [m.trackBg, m.rangeBg], [await token("--fndn-line"), await token("--fndn-accent")]);
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
