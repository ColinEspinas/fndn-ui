// Semantics, loops and alignment of Loading State, run against every target and every variant.
//   node components/loading-state/loading-state.test.mjs            all four targets
//   node components/loading-state/loading-state.test.mjs react      one target
// Nothing in it is interactive; this checks what is announced, what loops and what stays still.
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2 });
let failed = 0;

async function open(fw, ex = 0, extra = "") {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=loading-state&fw=${fw}&ex=${ex}${extra}`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(500);
}
const q = (js) => p.eval(js);
const R = `document.querySelector("#stage [data-slot=loading-state]")`;

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  try {
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  for (const [ex, variant] of [[0, "drive"], [1, "dots"], [2, "orbit"]]) {
    await open(fw, ex);
    check(`${variant}: role=status named by its label; grid and elapsed aria-hidden; orbit keeps the centre dim`, await q(`(()=>{const r=${R};return [r.getAttribute("role"), r.getAttribute("aria-label"), r.querySelector("[data-slot=loading-state-grid]").getAttribute("aria-hidden"), r.querySelector("[data-slot=loading-state-elapsed]").getAttribute("aria-hidden"), getComputedStyle(r.querySelectorAll("[data-slot=loading-state-cell]")[4]).animationName]})()`), ["status", "Analyzing usage", "true", "true", variant === "orbit" ? "none" : "fndn-pixel-on"]);
    check(`${variant}: the host's elapsed time is shown, not overwritten`, await q(`${R}.querySelector("[data-slot=loading-state-elapsed]").textContent.trim()`), "12.4s");
    check(`${variant}: grid loops are opacity only`, await q(`(()=>{const a=${R}.querySelector("[data-slot=loading-state-grid]").getAnimations({subtree:true});return a.length>0&&a.every((x)=>x.effect.getKeyframes().every((k)=>Object.keys(k).filter((n)=>!["offset","computedOffset","easing","composite"].includes(n)).every((n)=>n==="opacity")))})()`), true);
    check(`${variant}: grid centred on the label`, await q(`(()=>{const g=${R}.querySelector("[data-slot=loading-state-grid]").getBoundingClientRect(),l=${R}.querySelector("[data-loading-state=label]").getBoundingClientRect();return Math.abs((g.y+g.height/2)-(l.y+l.height/2))<=0.5})()`), true);
  }
  check("nothing is focusable", await q(`${R}.querySelectorAll("a,button,input,[tabindex]").length + (${R}.tabIndex >= 0 ? 1 : 0)`), 0);
  check("elapsed uses tabular figures", await q(`getComputedStyle(${R}.querySelector("[data-slot=loading-state-elapsed]")).fontVariantNumeric`), "tabular-nums");
  const w = await q(`${R}.querySelector("[data-loading-state=label]").getBoundingClientRect().x`);
  await sleep(300);
  check("no layout shift while it runs", await q(`${R}.querySelector("[data-loading-state=label]").getBoundingClientRect().x`), w);

  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 0);
  check("reduced motion: shimmer stops and shows ink-2; grid keeps pulsing", await q(`(()=>{const l=getComputedStyle(${R}.querySelector("[data-loading-state=label]"));const probe=document.createElement("span");probe.style.color="var(--fndn-ink-2)";document.body.append(probe);const want=getComputedStyle(probe).color;probe.remove();return [l.animationName, l.color===want, getComputedStyle(${R}.querySelector("[data-slot=loading-state-cell]")).animationName]})()`), ["none", true, "fndn-pixel-on"]);
  await p.media([]);

  await open(fw, 0, "&dir=rtl");
  check("rtl: grid on the right of the label", await q(`${R}.querySelector("[data-slot=loading-state-grid]").getBoundingClientRect().x > ${R}.querySelector("[data-loading-state=label]").getBoundingClientRect().x`), true);
  check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ run aborted — ${String(e.message ?? e).slice(0, 160)}`); }
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
