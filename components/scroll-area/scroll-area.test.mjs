// Scroll area: native scrolling with the system scrollbar: hidden native bar, the overlay bar shown
// on hover and scroll then fading, the thumb follows scroll and drags, keyboard scrolling, bars
// only where it overflows, worst cases, right-to-left, dark.
//   node components/scroll-area/scroll-area.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "scroll-area";
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
const away = async () => { await p.hover(1200, 860); await sleep(300); };

const R = "#stage [data-slot=scroll-area]";
const V = `${R} [data-slot=scroll-area-viewport]`;
const bar = (o) => `${R} [data-slot=scroll-area-scrollbar][data-orientation=${o}]`;
const thumb = (o) => `${bar(o)} [data-slot=scroll-area-thumb]`;
const state = (o) => q(`(()=>{const b=document.querySelector(${JSON.stringify(bar(o))});if(!b)return null;const t=b.querySelector("[data-slot=scroll-area-thumb]");const br=b.getBoundingClientRect(),tr=t.getBoundingClientRect(),rr=document.querySelector(${JSON.stringify(R)}).getBoundingClientRect();const round=(n)=>Math.round(n*100)/100;
  return {display:getComputedStyle(b).display,opacity:+getComputedStyle(b).opacity,bw:round(br.width),bh:round(br.height),tw:round(tr.width),th:round(tr.height),ty:round(tr.top-br.top),tx:round(tr.left-br.left),endGap:round(rr.right-br.right),startGap:round(br.left-rr.left),bottomGap:round(rr.bottom-br.bottom),thumbBg:getComputedStyle(t).backgroundColor}})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("vertical: the viewport overflows downwards, its own scrollbar is hidden (no width taken), the page scrolls on at its end", await q(`(()=>{const v=document.querySelector(${JSON.stringify(V)});return [v.scrollHeight>v.clientHeight,v.offsetWidth===v.clientWidth,getComputedStyle(v).overscrollBehaviorY]})()`), [true, true, "auto"]);
  check("the root is 240 × 160 as given, the viewport fills it", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)}).getBoundingClientRect(),v=document.querySelector(${JSON.stringify(V)}).getBoundingClientRect();return [r.width,r.height,v.width,v.height]})()`), [240, 160, 240, 160]);
  let s = await state("vertical");
  check("one vertical bar at the end edge: 10px wide, hidden at rest (opacity 0), no horizontal bar", [s.display, s.bw, s.endGap, s.opacity, await state("horizontal")], ["flex", 10, 0, 0, null]);
  const r = await p.rect(R);
  await p.hover(r.cx, r.cy); await sleep(400);
  s = await state("vertical");
  check("pointer over the region: the bar fades in; thumb 6px wide at the top, as long as the visible share", [s.opacity, s.tw, s.ty, s.th > 20 && s.th < 156], [1, 6, 2, true]);
  check("thumb: ink-3 at 45%", s.thumbBg.includes("/ 0.45") || s.thumbBg.endsWith(", 0.45)"), true);
  await q(`document.querySelector(${JSON.stringify(V)}).scrollTop=120`); await sleep(150);
  check("scrolling moves the thumb (and marks the bar data-scrolling)", [(await state("vertical")).ty > 2, await q(`document.querySelector(${JSON.stringify(bar("vertical"))}).hasAttribute("data-scrolling")`)], [true, true]);
  await away(); await sleep(1400);
  check("pointer gone and a second after the last scroll: the bar has faded out", (await state("vertical")).opacity, 0);
  /* drag the thumb */
  await open(fw, 0);
  await p.hover(r.cx, r.cy); await sleep(300);
  const t = await p.rect(thumb("vertical"));
  await p.drag(t.cx, t.cy, t.cx, t.cy + 40); await sleep(200);
  check("dragging the thumb scrolls the viewport", await q(`document.querySelector(${JSON.stringify(V)}).scrollTop>20`), true);
  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  /* a 2px offset is snapped to whole device pixels: -1.6px at 125% */
  check("Tab focuses the viewport (a scroller is a tab stop); its ring is drawn inside it (negative outline-offset)", await q(`(()=>{const v=document.querySelector(${JSON.stringify(V)});return [document.activeElement===v,Math.round(parseFloat(getComputedStyle(v).outlineOffset)*devicePixelRatio)/devicePixelRatio<=-1.5,getComputedStyle(v).outlineStyle]})()`), [true, true, "solid"]);
  await p.key("PageDown"); await sleep(400);
  check("PageDown scrolls it natively", await q(`document.querySelector(${JSON.stringify(V)}).scrollTop>40`), true);
  await p.key("Home"); await sleep(400);
  check("Home scrolls back to the top", await q(`document.querySelector(${JSON.stringify(V)}).scrollTop`), 0);

  await open(fw, 1);
  await p.hover((await p.rect(R)).cx, (await p.rect(R)).cy); await sleep(400);
  s = await state("horizontal");
  check("horizontal: one bar at the bottom, 10px tall, thumb 6px tall, shown on hover; no vertical bar", [s.display, s.bh, s.bottomGap, s.th, s.opacity, await state("vertical")], ["flex", 10, 0, 6, 1, null]);
  await open(fw, 2);
  check("both: two bars and the corner", await q(`[document.querySelectorAll(${JSON.stringify(R + " [data-slot=scroll-area-scrollbar]")}).length,!!document.querySelector(${JSON.stringify(R + " [data-slot=scroll-area-corner]")})]`), [2, true]);
  /* vertical: the content is the viewport's width, so a nowrap line inside truncates; horizontal keeps fit-content */
  await open(fw, 3);
  check("vertical: the content is as wide as the viewport (min-width 0 over the engine's fit-content); a long nowrap line inside truncates", await q(`(()=>{const v=document.querySelector(${JSON.stringify(V)}),c=v.querySelector("[data-slot=scroll-area-content]");const d=document.createElement("div");d.style.cssText="white-space:nowrap;overflow:hidden;text-overflow:ellipsis";d.textContent="rate-limit.ts — src/middleware/very/deep/folder/that/does/not/fit/in/the/region";c.append(d);const out=[getComputedStyle(c).minWidth,Math.round(c.getBoundingClientRect().width)===Math.round(v.clientWidth),d.scrollWidth>d.clientWidth,v.scrollWidth<=v.clientWidth];d.remove();return out})()`), ["0px", true, true, true]);
  await open(fw, 1);
  check("horizontal: the content keeps fit-content (it scrolls sideways)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(V + " [data-slot=scroll-area-content]")})).minWidth`), "fit-content");
  await open(fw, 3);
  check("content that fits: the bar is not displayed, the viewport is not a tab stop", [(await state("vertical")).display, await q(`document.querySelector(${JSON.stringify(V)}).hasAttribute("tabindex")`)], ["none", false]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  const w = await p.rect(R);
  await p.hover(w.cx, w.cy); await sleep(300);
  check("very long content: the thumb keeps a usable length (≥ 16px)", (await state("vertical")).th >= 16, true);
  await open(fw, 1, "&data=worst");
  check("a 40 × 40 region: no overflow out of it", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)}).getBoundingClientRect();return [r.width,r.height]})()`), [40, 40]);
  await open(fw, 2, "&data=worst&dir=rtl");
  s = await state("vertical");
  check("rtl: the vertical bar sits at the left (the end edge)", [s.startGap, s.display], [0, "flex"]);
  await open(fw, 3, "&data=worst");
  check("empty: no bar", (await state("vertical")).display, "none");
  await open(fw, 0, "&theme=dark");
  check("dark: the thumb uses the dark ink-3", (await state("vertical")).thumbBg.includes((await token("--fndn-ink-3")).replace(/\)$/, "").split("(")[1].split(" ")[0]), true);
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
