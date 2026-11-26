// Splitter: Ark's splitter (role=separator handles with their values), the separator's 1px rule,
// the hit areas (9px under a mouse, 41px on a coarse pointer), hover and drag colours, a drag that
// follows the pointer 1:1 (no transition on the panels), the keys (arrows by keyboardStep, Shift by
// 10, Home / End to the limits, Enter collapses a collapsible panel), grips centred on the rule,
// vertical, worst cases, right-to-left (keys mirrored), dark.
//   node components/splitter/splitter.test.mjs [react …]   (default: the spec's targets)
const C = "splitter";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
/* the first frames of every mount: the panels' widths, to catch a layout that snaps after paint */
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__splitFrames=[];(function f(){const ps=[...document.querySelectorAll('#stage [data-slot=splitter-panel]')];if(ps.length)window.__splitFrames.push(ps.map((e)=>Math.round(e.getBoundingClientRect().width)).join('/'));if(window.__splitFrames.length<8)requestAnimationFrame(f)})();` });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`!window.__stale && location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector("#stage [data-slot=splitter]")`).catch(() => false)) break; await sleep(100); } await sleep(300); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; await q("window.__stale = true").catch(() => {}); const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const forceCoarse = () => q(`(()=>{const out=[];const walk=(rules)=>{for(const r of rules){if(r.conditionText?.includes("pointer: coarse"))out.push(...[...r.cssRules].map((x)=>x.cssText));else if(r.cssRules)walk(r.cssRules)}};for(const s of document.styleSheets){try{walk(s.cssRules)}catch{}}const st=document.createElement("style");st.id="coarse";st.textContent=out.join("\\n");document.head.append(st);return out.length})()`);
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const S = (part) => `#stage [data-slot=${part}]`;
const HANDLE = S("splitter-handle");
const now = (i = 0) => q(`Number(document.querySelectorAll(${JSON.stringify(HANDLE)})[${i}].getAttribute("aria-valuenow"))`);
const panels = () => q(`[...document.querySelectorAll(${JSON.stringify(S("splitter-panel"))})].map((e)=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}})`);
const handleBg = (i = 0) => q(`getComputedStyle(document.querySelectorAll(${JSON.stringify(HANDLE)})[${i}]).backgroundColor`);
const near = (a, b, d = 1.5) => Math.abs(a - b) <= d;

async function run(fw, check) {
  /* structure */
  await open(fw, 0);
  const line = await token("--fndn-line");
  check("handle: role=separator, aria-valuenow 30, named \"Resize\", vertical rule, focusable, controls both panels",
    await q(`(()=>{const h=document.querySelector(${JSON.stringify(HANDLE)});const ids=(h.getAttribute("aria-controls")||"").split(" ");return [h.getAttribute("role"),h.getAttribute("aria-valuenow"),h.getAttribute("aria-label"),h.getAttribute("aria-orientation"),h.tabIndex,ids.length===2&&ids.every((id)=>document.getElementById(id)?.dataset.slot==="splitter-panel")]})()`),
    ["separator", "30", "Resize", "vertical", 0, true]);
  let ps = await panels();
  const hb = await p.rect(HANDLE);
  check("panels 30% / 70% of 480 (less the 1px rule), full height 200", [near(ps[0].w / 479, 0.3, 0.01), near(ps[1].w / 479, 0.7, 0.01), ps[0].h, hb.h], [true, true, 200, 200]);
  check("handle at rest: the separator's rule, 1px in the line colour", [hb.w, await handleBg()], [1, line]);
  check("hit area under a mouse: 4px each side (::after), the cursor col-resize, touch-action none",
    await q(`(()=>{const h=document.querySelector(${JSON.stringify(HANDLE)});const a=getComputedStyle(h,"::after");const cs=getComputedStyle(h);return [a.content,parseFloat(a.left),parseFloat(a.right),cs.cursor,cs.touchAction]})()`),
    ['""', -4, -4, "col-resize", "none"]);
  check("a press 3px beside the rule still lands on the handle", await q(`document.elementFromPoint(${hb.cx + 3},${hb.cy})?.dataset.slot`), "splitter-handle");

  /* hover: ink-3, as a colour over duration.fast */
  await p.hover(hb.cx, hb.cy); await sleep(250);
  check("hovered: ink-3, colour transition at duration.fast", [await handleBg(), await q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(HANDLE)}));const i=cs.transitionProperty.split(", ").indexOf("background-color");return i>=0?cs.transitionDuration.split(", ")[i]:null})()`)], [await token("--fndn-ink-3"), "0.1s"]);

  /* drag: 1:1, accent while dragged, the panels never transition */
  await q(`(()=>{window.__seen=[];const h=document.querySelector(${JSON.stringify(HANDLE)});document.addEventListener("pointermove",()=>window.__seen.push([h.hasAttribute("data-dragging"),getComputedStyle(h).backgroundColor]),{capture:true})})()`);
  await p.drag(hb.cx, hb.cy, hb.cx + 96, hb.cy, { steps: 12 }); await sleep(250);
  ps = await panels();
  check("drag the handle 96px (20%): the first panel ≈ 50%", near(ps[0].w / 479, 0.5, 0.012), true);
  check("while dragged: data-dragging and the accent colour", await q(`window.__seen.some(([d,c])=>d&&c===${JSON.stringify(await token("--fndn-accent"))})`), true);
  check("a drag turns the rule accent at once: from the first move it is accent, never on its way there", await q(`(()=>{const d=window.__seen.filter(([x])=>x);return d.length>0&&d.every(([,c])=>c===${JSON.stringify(await token("--fndn-accent"))})})()`), true);
  check("panels never transition (they follow the pointer 1:1)", await q(`[...document.querySelectorAll(${JSON.stringify(S("splitter-panel"))})].every((e)=>getComputedStyle(e).transitionDuration.split(", ").every((d)=>d==="0s"))`), true);

  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab focuses the handle (the shared ring)", await q(`(()=>{const a=document.activeElement;const cs=getComputedStyle(a);return [a.dataset.slot,cs.outlineStyle,parseFloat(cs.outlineWidth)>=1.5]})()`), ["splitter-handle", "solid", true]);
  await p.key("ArrowRight"); check("Arrow Right: 30 → 31", await now(), 31);
  await p.key("ArrowLeft"); await p.key("ArrowLeft"); check("Arrow Left ×2: 29", await now(), 29);
  await p.key("ArrowUp"); check("Arrow Up does nothing on a horizontal splitter", await now(), 29);
  await p.key("ArrowRight", { shift: true }); check("Shift + Arrow Right: 10 more (39)", await now(), 39);
  await p.key("Home"); check("Home: the first panel's minimum (20)", await now(), 20);
  await p.key("End"); check("End: as far as the second panel's minimum allows (70)", await now(), 70);
  ps = await panels();
  check("the panels follow the keys at once (70% after End)", near(ps[0].w / 479, 0.7, 0.01), true);

  await open(fw, 3);
  await p.click(5, 5); await p.key("Tab"); await p.key("ArrowRight");
  check("keyboardStep 5: 50 → 55", await now(), 55);

  /* collapsible: Enter collapses and expands (the engine's key) */
  await open(fw, 4);
  await p.click(5, 5); await p.key("Tab"); await p.key("Enter"); await sleep(100);
  const collapsed = await now();
  await p.key("Enter"); await sleep(100);
  check("collapsible: Enter collapses the side panel to 0, Enter again expands it (at least its minimum, 20)", [collapsed, (await now()) >= 20], [0, true]);

  /* grips: centred on the rule, 12×24, the surface with shadow.btn */
  await open(fw, 1);
  check("three panels: two handles, two grips", await q(`[document.querySelectorAll(${JSON.stringify(HANDLE)}).length,document.querySelectorAll(${JSON.stringify(S("splitter-grip"))}).length]`), [2, 2]);
  const gr = await p.rect(S("splitter-grip")), gh = await p.rect(HANDLE);
  check("grip: 12×24, centred on the rule (±0.5px), surface", [gr.w, gr.h, near(gr.cx, gh.cx, 0.5), near(gr.cy, gh.cy, 0.5), await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("splitter-grip"))})).backgroundColor`)], [12, 24, true, true, await token("--fndn-surface")]);

  /* vertical */
  await open(fw, 2);
  const vh = await p.rect(HANDLE);
  check("vertical: the handle is a 1px horizontal rule, aria-orientation horizontal, cursor row-resize",
    [vh.h, near(vh.w, 360, 0.5), await q(`document.querySelector(${JSON.stringify(HANDLE)}).getAttribute("aria-orientation")`), await q(`getComputedStyle(document.querySelector(${JSON.stringify(HANDLE)})).cursor`)],
    [1, true, "horizontal", "row-resize"]);
  const vg = await p.rect(S("splitter-grip"));
  check("vertical grip: 24×12, centred", [vg.w, vg.h, near(vg.cx, vh.cx, 0.5), near(vg.cy, vh.cy, 0.5)], [24, 12, true, true]);
  await p.click(5, 5); await p.key("Tab"); await p.key("ArrowDown");
  check("vertical: Arrow Down grows the top panel (60 → 61)", await now(), 61);
  await p.drag(vh.cx + 40, vh.cy, vh.cx + 40, vh.cy - 56, { steps: 10 }); await sleep(250);
  ps = await panels();
  check("vertical: drag up 56px (20%): the top panel ≈ 40%", near(ps[0].h / 279, 0.4, 0.015), true);

  /* touch: 41px hit area */
  await open(fw, 0);
  await forceCoarse();
  check("coarse pointer: the hit area reaches 20px each side (41px), the rule still 1px",
    await q(`(()=>{const h=document.querySelector(${JSON.stringify(HANDLE)});const a=getComputedStyle(h,"::after");return [parseFloat(a.left),parseFloat(a.right),h.getBoundingClientRect().width]})()`), [-20, -20, 1]);

  /* worst cases: nothing pokes out of the root */
  for (const [i, name] of [[0, "long text"], [1, "six panels"], [2, "at the minimum"], [3, "right-to-left text"], [4, "one panel"]]) {
    await open(fw, i, "&data=worst");
    check(`worst ${name}: nothing overflows the root`, await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("splitter"))});const b=r.getBoundingClientRect();return r.scrollWidth<=r.clientWidth+1&&[...r.querySelectorAll("*")].every((e)=>{const x=e.getBoundingClientRect();return x.right<=b.right+0.5&&x.left>=b.left-0.5})})()`), true);
  }
  await open(fw, 0, "&data=worst");
  check("worst long text: it wraps inside its panel, which scrolls what does not fit; the handle stays put", await q(`(()=>{const p=document.querySelector(${JSON.stringify(S("splitter-panel"))});const t=p.querySelector("[data-slot=splitter-text]");return [t.getBoundingClientRect().height>60,t.scrollWidth<=t.clientWidth+1,getComputedStyle(p).overflowY,Number(document.querySelector(${JSON.stringify(HANDLE)}).getAttribute("aria-valuenow"))]})()`), [true, true, "auto", 50]);
  await open(fw, 4, "&data=worst");
  check("worst one panel: no handle", await q(`document.querySelectorAll(${JSON.stringify(HANDLE)}).length`), 0);

  /* right-to-left: the first panel on the right, keys mirrored */
  await open(fw, 0, "&dir=rtl");
  ps = await panels();
  check("rtl: the first panel is on the right", ps[0].x > ps[1].x, true);
  await p.click(5, 5); await p.key("Tab"); await p.key("ArrowLeft");
  check("rtl: Arrow Left moves the rule left and grows the first panel (31)", await now(), 31);

  /* dark */
  await open(fw, 1, "&theme=dark");
  check("dark: the rule in the dark line colour, the grip on the dark surface", [await handleBg(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("splitter-grip"))})).backgroundColor`)], [await token("--fndn-line"), await token("--fndn-surface")]);
  /* starts collapsed (example 5): the collapsed panel has a minSize; it is shut from the first frame */
  await open(fw, 5);
  check("a panel that starts collapsed is shut from its first frame (no minSize layout that snaps shut)", await q(`[...new Set(window.__splitFrames)]`), ["479/0"]);
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
