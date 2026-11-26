// Slider: Ark's slider (role=slider thumbs with their values and names), the switch's sizes (control
// 24 / 18, thumb 20 / 14), a click on the track and a drag (value follows the pointer 1:1, the thumb
// gives while dragged, no travel animation), the keys (arrows, Page, Home / End, instant), a range
// (two thumbs, each named, bounded by the other), disabled, touch hit area, worst cases (no
// overflow at 120px, a long label wraps), right-to-left (filled from the right, keys mirrored), dark.
//   node components/slider/slider.test.mjs [react …]   (default: the spec's targets)
const C = "slider";
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
const THUMB = S("slider-thumb");
const values = () => q(`[...document.querySelectorAll(${JSON.stringify(THUMB)})].map((t)=>Number(t.getAttribute("aria-valuenow")))`);
const shown = () => q(`document.querySelector(${JSON.stringify(S("slider-value-text"))})?.textContent ?? null`);
const box = (sel) => p.rect(sel);

async function run(fw, check) {
  /* structure and names */
  await open(fw, 0);
  check("thumb: role=slider, value 40 of 0–100, named by the visible label, horizontal",
    await q(`(()=>{const t=document.querySelector(${JSON.stringify(THUMB)});const l=document.getElementById(t.getAttribute("aria-labelledby"));return [t.getAttribute("role"),t.getAttribute("aria-valuenow"),t.getAttribute("aria-valuemin"),t.getAttribute("aria-valuemax"),l?.textContent,t.getAttribute("aria-orientation"),t.tabIndex]})()`),
    ["slider", "40", "0", "100", "Volume", "horizontal", 0]);
  check("value shown at the end of the label row: \"40\", tabular figures", [await shown(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("slider-value-text"))})).fontVariantNumeric`)], ["40", "tabular-nums"]);
  check("label and value share a baseline", await q(`(()=>{const b=(s)=>{const e=document.querySelector(s);const r=document.createRange();r.selectNodeContents(e);return Math.round(r.getBoundingClientRect().bottom)};return b(${JSON.stringify(S("slider-label"))})===b(${JSON.stringify(S("slider-value-text"))})})()`), true);

  /* sizes: the switch's control height and thumb, a 4px pill rail, the segmented thumb's look */
  const control = await box(S("slider-control")), thumb = await box(THUMB), track = await box(S("slider-track"));
  await open(fw, 0, "", "switch");
  const sw = await box("#stage [data-slot=switch]");
  await open(fw, 0);
  check("md: control as high as the switch md (24), thumb 20×20 round, rail 4px, thumb centred on the rail",
    [control.h, sw.h, thumb.w, thumb.h, track.h, Math.abs(thumb.cy - track.cy) < 0.6, await q(`getComputedStyle(document.querySelector(${JSON.stringify(THUMB)})).borderRadius`)],
    [24, 24, 20, 20, 4, true, "50%"]);
  check("thumb: surface with shadow.btn; range ink; rail line-strong",
    await q(`[getComputedStyle(document.querySelector(${JSON.stringify(THUMB)})).backgroundColor,getComputedStyle(document.querySelector(${JSON.stringify(S("slider-range"))})).backgroundColor,getComputedStyle(document.querySelector(${JSON.stringify(S("slider-track"))})).backgroundColor]`),
    [await token("--fndn-surface"), await token("--fndn-ink"), await token("--fndn-line-strong")]);
  const range = await box(S("slider-range"));
  check("range fills from the start to 40%", Math.abs(range.w / track.w - 0.4) < 0.01 && Math.abs(range.x - track.x) < 0.5, true);
  check("the thumb stays inside the track at 40% (contain)", thumb.x >= track.x - 0.5 && thumb.x + thumb.w <= track.x + track.w + 0.5, true);
  check("touch-action none on the control (a drag never scrolls)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("slider-control"))})).touchAction`), "none");

  /* hover (a real pointer): the thumb lifts to shadow.raised over duration.fast */
  await p.hover(thumb.cx, thumb.cy); await sleep(250);
  check("hovered thumb: shadow.raised, shadow transition at duration.fast", await q(`(()=>{const t=document.querySelector(${JSON.stringify(THUMB)});const cs=getComputedStyle(t);const i=cs.transitionProperty.split(", ").indexOf("box-shadow");return [cs.boxShadow.split(/, (?=rgba\\(0, 0, 0, 0\\) 0px 0px 0px 0px|oklch|rgb|color)/).filter((l)=>l!=="rgba(0, 0, 0, 0) 0px 0px 0px 0px").join(", "), i>=0?cs.transitionDuration.split(", ")[i]:null]})()`), [await token("--fndn-shadow-raised", "boxShadow"), "0.1s"]);
  await p.hover(1, 1); await sleep(250);
  /* pointer: a click on the track jumps there (no travel animation), a drag follows */
  await p.click(track.x + track.w * 0.75, track.cy); await sleep(150);
  let v = (await values())[0];
  check("click at 75% of the track: value ≈ 75, shown", [Math.abs(v - 75) <= 2, await shown() === String(v)], [true, true]);
  check("thumb travel never animates (inset-inline-start not transitioned)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(THUMB)})).transitionProperty.split(", ").some((x)=>/inset|left|right/.test(x))`), false);
  let t = await box(THUMB);
  await q(`(()=>{window.__seen=[];const th=document.querySelector(${JSON.stringify(THUMB)});document.addEventListener("pointermove",()=>window.__seen.push([th.hasAttribute("data-dragging"),getComputedStyle(th).scale]),{capture:true})})()`);
  await p.drag(t.cx, t.cy, track.x + track.w * 0.2, t.cy, { steps: 10 }); await sleep(200);
  v = (await values())[0];
  check("drag the thumb to 20%: value ≈ 20", Math.abs(v - 20) <= 2, true);
  check("while dragged: data-dragging and the thumb gives (scale < 1)", await q(`window.__seen.some(([d,s])=>d&&s!=="none"&&Number(s.split(" ")[0])<1)`), true);
  check("after the drag: no data-dragging, scale back", await q(`(()=>{const th=document.querySelector(${JSON.stringify(THUMB)});return [th.hasAttribute("data-dragging"),getComputedStyle(th).scale]})()`), [false, "none"]);

  /* keyboard: Tab, arrows, Page, Home / End, instantly */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab focuses the thumb (the shared ring, round)", await q(`(()=>{const a=document.activeElement;const cs=getComputedStyle(a);return [a.dataset.slot,cs.outlineStyle,parseFloat(cs.outlineWidth)>=1.5,cs.borderRadius]})()`), ["slider-thumb", "solid", true, "50%"]);
  await p.key("ArrowRight"); check("Arrow Right: 41", (await values())[0], 41);
  await p.key("ArrowLeft"); await p.key("ArrowLeft"); check("Arrow Left ×2: 39", (await values())[0], 39);
  await p.key("ArrowUp"); check("Arrow Up does nothing on a horizontal slider (the engine's keys)", (await values())[0], 39);
  await p.key("PageUp"); check("Page Up: a large step (39 → 50, the engine snaps to the step grid)", (await values())[0], 50);
  await p.key("Home"); check("Home: 0", [(await values())[0], await shown()], [0, "0"]);
  await p.key("End"); check("End: 100", (await values())[0], 100);
  check("from the keyboard the thumb's transitions are zeroed (kbd-instant)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(THUMB)})).transitionDuration.split(", ").every((d)=>d==="0s")`), true);

  /* step 10 */
  await open(fw, 3);
  await p.click(5, 5); await p.key("Tab"); await p.key("ArrowRight");
  check("step 10: Arrow Right 60 → 70", (await values())[0], 70);

  /* range: two thumbs, each named, bounded by each other */
  await open(fw, 1);
  check("range: two thumbs 20 and 80, named by thumbLabels, shown \"20 – 80\"",
    [await values(), await q(`[...document.querySelectorAll(${JSON.stringify(THUMB)})].map((t)=>t.getAttribute("aria-label"))`), await shown()],
    [[20, 80], ["Minimum price", "Maximum price"], "20 – 80"]);
  check("range: each thumb labels itself (aria-labelledby = its own id), not the shared label", await q(`[...document.querySelectorAll(${JSON.stringify(THUMB)})].map((t)=>t.getAttribute("aria-labelledby")===t.id)`), [true, true]);
  const rr = await box(S("slider-range")), rt = await box(S("slider-track"));
  check("range: filled between the thumbs (20% → 80%)", Math.abs(rr.w / rt.w - 0.6) < 0.01 && Math.abs((rr.x - rt.x) / rt.w - 0.2) < 0.01, true);
  await p.click(5, 5); await p.key("Tab"); await p.key("End");
  check("range: End on the first thumb stops 5 steps before the second (minStepsBetweenThumbs)", (await values())[0], 75);
  await p.key("Tab"); await p.key("Home");
  check("range: Tab to the second thumb, Home stops 5 above the first", (await values())[1], 80);

  /* small, no label: the switch sm */
  await open(fw, 2);
  const sc = await box(S("slider-control")), st = await box(THUMB);
  await open(fw, 2, "", "switch");
  const swsm = await box("#stage [data-slot=switch]");
  await open(fw, 2);
  check("sm: control 18 (the switch sm is 18), thumb 14, named by aria-label", [sc.h, swsm.h, st.w, await q(`document.querySelector(${JSON.stringify(THUMB)}).getAttribute("aria-label")`)], [18, 18, 14, "Opacity"]);

  /* disabled */
  await open(fw, 4);
  const dt = await box(S("slider-track"));
  await p.click(dt.x + dt.w * 0.9, dt.cy); await sleep(150);
  check("disabled: half opacity, not focusable, a click changes nothing", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("slider"))});const t=r.querySelector("[data-slot=slider-thumb]");return [getComputedStyle(r).opacity,t.hasAttribute("tabindex")&&t.tabIndex>=0,t.getAttribute("aria-disabled"),t.getAttribute("aria-valuenow")]})()`), ["0.5", false, "true", "40"]);

  /* touch: the control's hit area is 40px on a coarse pointer */
  await open(fw, 0);
  await forceCoarse();
  check("coarse pointer: the control's hit area is 40px high, its look unchanged", await q(`(()=>{const c=document.querySelector(${JSON.stringify(S("slider-control"))});const a=getComputedStyle(c,"::after");return [a.content,parseFloat(a.top),parseFloat(a.bottom),c.getBoundingClientRect().height]})()`), ['""', -8, -8, 24]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long label: wraps, the value keeps the end of the first line, nothing overflows 220px", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("slider"))});const l=r.querySelector("[data-slot=slider-label]");const v=r.querySelector("[data-slot=slider-value-text]");return [l.getBoundingClientRect().height>40,v.textContent,r.scrollWidth<=r.clientWidth+1,Math.round(r.getBoundingClientRect().width)]})()`), [true, "12480", true, 220]);
  await open(fw, 2, "&data=worst");
  check("at 120px: nothing overflows, the thumb at 100 stays inside", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("slider"))});const t=r.querySelector("[data-slot=slider-thumb]").getBoundingClientRect();const c=r.querySelector("[data-slot=slider-control]").getBoundingClientRect();return [r.scrollWidth<=r.clientWidth+1,t.right<=c.right+0.5]})()`), [true, true]);

  /* right-to-left: filled from the right, keys mirrored */
  await open(fw, 0, "&dir=rtl");
  const rtr = await box(S("slider-range")), rtt = await box(S("slider-track"));
  check("rtl: range fills from the right edge", Math.abs(rtr.x + rtr.w - (rtt.x + rtt.w)) < 0.5 && Math.abs(rtr.w / rtt.w - 0.4) < 0.01, true);
  await p.click(5, 5); await p.key("Tab"); await p.key("ArrowLeft");
  check("rtl: Arrow Left goes up (41)", (await values())[0], 41);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl label: its own direction", await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("slider-label"))})).unicodeBidi`), "plaintext");

  /* dark */
  await open(fw, 0, "&theme=dark");
  check("dark: range ink (light in dark), thumb the dark surface", await q(`[getComputedStyle(document.querySelector(${JSON.stringify(S("slider-range"))})).backgroundColor,getComputedStyle(document.querySelector(${JSON.stringify(THUMB)})).backgroundColor]`), [await token("--fndn-ink"), await token("--fndn-surface")]);
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
