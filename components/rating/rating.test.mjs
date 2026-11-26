// Rating: Ark's rating-group (a radiogroup of star radios, named), the switch's heights (24 / 18),
// the filled star in ink over a line-strong one, the hover preview and a click (fill fades under a
// pointer), the keys (one tab stop, arrows, Home / End, instant), half stars (clipped to the inline
// start, mirrored right-to-left), read-only, disabled, touch hit area, worst cases (wraps, never
// overflows), dark.
//   node components/rating/rating.test.mjs [react …]   (default: the spec's targets)
const C = "rating";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
/* the old page is marked, so reopening the same URL waits for the new one */
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`!window.__stale && location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(300); };
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; await q("window.__stale = true").catch(() => {}); const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
/* headless Chromium cannot report a coarse pointer: copy the rules inside (pointer: coarse) out of
 * their media query (as dialog.mjs does) and return the cleanup */
const forceCoarse = () => q(`(()=>{const out=[];const walk=(rules)=>{for(const r of rules){if(r.conditionText?.includes("pointer: coarse"))out.push(...[...r.cssRules].map((x)=>x.cssText));else if(r.cssRules)walk(r.cssRules)}};for(const s of document.styleSheets){try{walk(s.cssRules)}catch{}}const st=document.createElement("style");st.id="coarse";st.textContent=out.join("\\n");document.head.append(st);return out.length})()`);
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const S = (part) => `#stage [data-slot=${part}]`;
const ITEM = S("rating-item");
/* per item: [aria-checked, highlighted, half] */
const state = () => q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((i)=>(i.getAttribute("aria-checked")==="true"?"c":"")+(i.hasAttribute("data-highlighted")?"h":"")+(i.hasAttribute("data-half")?"½":"")||"-").join(" ")`);
const fillOpacity = () => q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((i)=>getComputedStyle(i.children[1]).opacity).join(" ")`);
/* the engine previews on pointermove: arrive with a few small moves, as a real mouse does */
const glide = async (x, y) => { for (const dx of [-3, -1, 0]) { await p.hover(x + dx, y); await sleep(40); } };
const focused = () => q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].indexOf(document.activeElement)`);

async function run(fw, check) {
  await open(fw, 0);
  check("radiogroup named by the visible label; five star radios \"n stars\"; the third checked",
    await q(`(()=>{const g=document.querySelector(${JSON.stringify(S("rating-control"))});const i=[...document.querySelectorAll(${JSON.stringify(ITEM)})];return [g.getAttribute("role"),document.getElementById(g.getAttribute("aria-labelledby"))?.textContent,i.length,i[2].getAttribute("role"),i[2].getAttribute("aria-label"),i.findIndex((e)=>e.getAttribute("aria-checked")==="true")]})()`),
    ["radiogroup", "How was the answer?", 5, "radio", "3 stars", 2]);
  check("score 3: three highlighted, their filled star shown", [await state(), await fillOpacity()], ["h h ch - -", "1 1 1 0 0"]);
  const item = await p.rect(ITEM);
  await open(fw, 0, "", "switch");
  const sw = await p.rect("#stage [data-slot=switch]");
  await open(fw, 0);
  check("md: 24×24 cells (the switch md height), 20px stars, chip radius, no gap",
    [item.w, item.h, sw.h, await q(`(()=>{const i=document.querySelectorAll(${JSON.stringify(ITEM)});return [i[0].children[0].getBoundingClientRect().width,getComputedStyle(i[0]).borderRadius,Math.round(i[1].getBoundingClientRect().left-i[0].getBoundingClientRect().right)]})()`)],
    [24, 24, 24, [20, await q(`getComputedStyle(document.documentElement).getPropertyValue("--fndn-radius-chip").trim()`), 0]]);
  check("filled star ink, empty star line-strong", await q(`(()=>{const i=document.querySelector(${JSON.stringify(ITEM)});return [getComputedStyle(i.children[1]).color,getComputedStyle(i.children[0]).color]})()`), [await token("--fndn-ink", "color"), await token("--fndn-line-strong", "color")]);

  /* pointer: hover previews, a click sets, leaving restores */
  const items = await q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((e)=>{const b=e.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})`);
  await glide(items[4][0], items[4][1]); await sleep(250);
  check("hover the fifth: all five previewed", [await state(), await fillOpacity()], ["h h ch h h", "1 1 1 1 1"]);
  check("the fill fades under a pointer", await q(`getComputedStyle(document.querySelectorAll(${JSON.stringify(ITEM)})[4].children[1]).transitionDuration.split(", ").some((d)=>d!=="0s")`), true);
  await p.hover(1200, 860); await sleep(250);
  check("pointer leaves: back to the score", await state(), "h h ch - -");
  await p.click(items[3][0], items[3][1]); await p.hover(1200, 860); await sleep(250);
  check("click the fourth: score 4", await state(), "h h h ch -");

  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab focuses the checked star (one tab stop), focus ring", [await focused(), await q(`getComputedStyle(document.activeElement).outlineStyle`)], [2, "solid"]);
  await p.key("ArrowRight"); await sleep(30);
  check("Arrow Right: 4, instantly (the fill's transitions zeroed)", [await state(), await q(`getComputedStyle(document.querySelectorAll(${JSON.stringify(ITEM)})[3].children[1]).transitionDuration.split(", ").every((d)=>d==="0s")`), await fillOpacity()], ["h h h ch -", true, "1 1 1 1 0"]);
  await p.key("ArrowLeft"); await p.key("ArrowLeft"); check("Arrow Left ×2: 2", await state(), "h ch - - -");
  await p.key("End"); check("End: 5", await state(), "h h h h ch");
  await p.key("Home"); check("Home: 1", await state(), "ch - - - -");

  /* half stars */
  await open(fw, 1);
  check("3.5: the fourth star half, its fill cut to the left half; group named by aria-label",
    [await state(), await q(`getComputedStyle(document.querySelectorAll(${JSON.stringify(ITEM)})[3].children[1]).clipPath`), await q(`document.querySelector(${JSON.stringify(S("rating-control"))}).getAttribute("aria-label")`)],
    ["h h h ch½ -", "inset(0px 50% 0px 0px)", "Rating"]);
  const hi = await q(`(()=>{const b=document.querySelectorAll(${JSON.stringify(ITEM)})[1].getBoundingClientRect();return [b.x+4,b.y+b.height/2]})()`);
  await glide(hi[0] + 3, hi[1]); await sleep(150);
  check("hover the first half of the second star: 1.5 previewed (the score 3.5 stays checked on the fourth)", await state(), "h h½ - c -");
  await p.click(hi[0], hi[1]); await p.hover(1200, 860); await sleep(200);
  check("click there: score 1.5", await state(), "h ch½ - - -");

  /* read-only */
  await open(fw, 2);
  const ro = await q(`(()=>{const b=document.querySelectorAll(${JSON.stringify(ITEM)})[0].getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2,b.height]})()`);
  await q(`window.__s=[];const el=document.querySelector(${JSON.stringify(ITEM)});setInterval(()=>window.__s.push(getComputedStyle(el).scale),30)`);
  await p.drag(ro[0], ro[1], ro[0] + 1, ro[1], { steps: 4, stepDelay: 40 }); await sleep(150);
  check("read-only sm (18px cells): a click changes nothing and the star does not give", [ro[2], await state(), await q(`window.__s.every((s)=>s==="none")`)], [18, "h h h ch -", true]);
  check("read-only: the checked star stays focusable", await q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((i)=>i.tabIndex).join(" ")`), "-1 -1 -1 0 -1");

  /* a press gives */
  await open(fw, 3);
  await q(`window.__s=[];const el=document.querySelector(${JSON.stringify(ITEM)});setInterval(()=>window.__s.push(getComputedStyle(el).scale),30)`);
  const e0 = await p.rect(ITEM);
  await p.drag(e0.cx, e0.cy, e0.cx + 1, e0.cy, { steps: 4, stepDelay: 50 }); await sleep(100);
  check("pressing a star gives a little (scale < 1); empty at first, now 1", [await q(`window.__s.some((s)=>s!=="none"&&Number(s.split(" ")[0])<1)`), await state()], [true, "ch - - - -"]);

  await open(fw, 4);
  check("disabled: half opacity, no star focusable", await q(`[getComputedStyle(document.querySelector(${JSON.stringify(S("rating"))})).opacity,[...document.querySelectorAll(${JSON.stringify(ITEM)})].some((i)=>i.tabIndex>=0)]`), ["0.5", false]);

  /* touch */
  await open(fw, 0);
  await forceCoarse();
  check("coarse pointer: each star's hit area is 40px high, cells unchanged", await q(`(()=>{const i=document.querySelector(${JSON.stringify(ITEM)});const a=getComputedStyle(i,"::after");return [i.getBoundingClientRect().height-parseFloat(a.top)-parseFloat(a.bottom),i.getBoundingClientRect().height]})()`), [40, 24]);

  /* worst cases */
  await open(fw, 2, "&data=worst");
  check("ten stars in 200px: they wrap, nothing overflows", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("rating"))});const i=[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((e)=>e.getBoundingClientRect());return [i.length,r.scrollWidth<=r.clientWidth+1,i.every((b)=>b.right<=r.getBoundingClientRect().right+0.5)]})()`), [10, true, true]);
  await open(fw, 0, "&data=worst");
  check("long label in 140px wraps", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("rating"))});return [r.querySelector("[data-slot=rating-label]").getBoundingClientRect().height>40,r.scrollWidth<=r.clientWidth+1]})()`), [true, true]);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the first star on the right, the half star cut to its right half",
    await q(`(()=>{const i=[...document.querySelectorAll(${JSON.stringify(ITEM)})];return [i[0].getBoundingClientRect().left>i[1].getBoundingClientRect().left,getComputedStyle(i[2].children[1]).clipPath]})()`),
    [true, "inset(0px 0px 0px 50%)"]);
  await open(fw, 1, "&theme=dark");
  check("dark: filled ink, empty line-strong", await q(`(()=>{const i=document.querySelector(${JSON.stringify(ITEM)});return [getComputedStyle(i.children[1]).color,getComputedStyle(i.children[0]).color]})()`), [await token("--fndn-ink", "color"), await token("--fndn-line-strong", "color")]);
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
