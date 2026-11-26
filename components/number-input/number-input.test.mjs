// Number Input: Ark's number-input on the real Input (role=spinbutton, its height, fill and rings)
// with two real Buttons laid over its end (named, out of the tab order, disabled at a bound), the
// buttons and the keys (arrows, Shift ten, Home / End), typing and clamping, a formatted value,
// invalid, disabled, sm, touch (16px text, 40px hit areas), worst cases, right-to-left, dark.
//   node components/number-input/number-input.test.mjs [react …]   (default: the spec's targets)
const C = "number-input";
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
const FIELD = `#stage [data-number-input=input]`;
const DEC = `#stage [data-number-input=decrement-trigger]`;
const INC = `#stage [data-number-input=increment-trigger]`;
const val = () => q(`document.querySelector(${JSON.stringify(FIELD)}).value`);
const LOOK = ["height", "borderRadius", "backgroundColor", "boxShadow", "fontSize", "color"];
const look = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("the field is the Input: data-slot=input, role=spinbutton, value 4, bounds 1–50, named by the label",
    await q(`(()=>{const i=document.querySelector(${JSON.stringify(FIELD)});return [i.dataset.slot,i.getAttribute("role"),i.value,i.getAttribute("aria-valuemin"),i.getAttribute("aria-valuemax"),i.labels?.[0]?.textContent]})()`),
    ["input", "spinbutton", "4", "1", "50", "Seats"]);
  check("the buttons are Buttons: named Decrease / Increase, out of the tab order, pointing at the field",
    await q(`[${JSON.stringify(DEC)},${JSON.stringify(INC)}].map((s)=>{const b=document.querySelector(s);return [b.dataset.slot,b.getAttribute("aria-label"),b.tabIndex,b.getAttribute("aria-controls")===document.querySelector(${JSON.stringify(FIELD)}).id]})`),
    [["button", "Decrease", -1, true], ["button", "Increase", -1, true]]);
  check("tabular figures", await q(`getComputedStyle(document.querySelector(${JSON.stringify(FIELD)})).fontVariantNumeric`), "tabular-nums");
  const mine = await look(FIELD);
  const f = await p.rect(FIELD), d = await p.rect(DEC), i = await p.rect(INC);
  await open(fw, 0, "", "input");
  check("at rest it is the Input md (height 32, radius, fill, hairline, type, ink)", mine, await look("#stage [data-slot=input]"));
  check("md buttons 24×24, centred in the field, 4px from its end, side by side",
    [d.w, d.h, i.w, i.h, Math.abs(i.cy - f.cy) < 0.6, Math.abs(d.cy - f.cy) < 0.6, Math.round(f.x + f.w - (i.x + i.w)), Math.round(i.x - (d.x + d.w))],
    [24, 24, 24, 24, true, true, 4, 0]);
  check("the value's room ends before the buttons (padding-end 56px)", await (async () => { await open(fw, 0); return q(`getComputedStyle(document.querySelector(${JSON.stringify(FIELD)})).paddingInlineEnd`); })(), "56px");

  /* pointer */
  let r = await p.rect(INC);
  await p.click(r.cx, r.cy); await sleep(120);
  check("plus: 5", await val(), "5");
  r = await p.rect(DEC);
  await p.click(r.cx, r.cy); await p.click(r.cx, r.cy); await sleep(120);
  check("minus ×2: 3", await val(), "3");

  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab"); await sleep(350);
  check("Tab focuses the field (the buttons are skipped), accent ring", await q(`(()=>{const a=document.activeElement;return [a.dataset.numberInput,getComputedStyle(a).boxShadow.includes("0px 0px 0px 1px")]})()`), ["input", true]);
  await p.key("ArrowUp"); check("Arrow Up: 5", await val(), "5");
  await p.key("ArrowDown"); await p.key("ArrowDown"); check("Arrow Down ×2: 3", await val(), "3");
  await p.key("ArrowUp", { shift: true }); check("Shift + Arrow Up: ten steps (13)", await val(), "13");
  await p.key("Home"); check("Home: the minimum (1)", await val(), "1");
  check("at the minimum the minus button is disabled", await q(`document.querySelector(${JSON.stringify(DEC)}).disabled`), true);
  await p.key("End"); check("End: the maximum (50)", await val(), "50");
  check("at the maximum the plus button is disabled, the minus enabled", await q(`[document.querySelector(${JSON.stringify(INC)}).disabled,document.querySelector(${JSON.stringify(DEC)}).disabled]`), [true, false]);
  /* typing, then a blur clamps */
  await q(`document.querySelector(${JSON.stringify(FIELD)}).select()`);
  await p.type("99"); await p.key("Tab"); await sleep(150);
  check("typed 99 then left: clamped to the maximum (50)", await val(), "50");

  await open(fw, 2);
  check("value at its minimum at mount: minus disabled (half opacity), plus enabled", await q(`[document.querySelector(${JSON.stringify(DEC)}).disabled,getComputedStyle(document.querySelector(${JSON.stringify(DEC)})).opacity,document.querySelector(${JSON.stringify(INC)}).disabled]`), [true, "0.5", false]);

  await open(fw, 3);
  check("invalid: aria-invalid and the red ring", await q(`(()=>{const i=document.querySelector(${JSON.stringify(FIELD)});return [i.getAttribute("aria-invalid"),getComputedStyle(i).boxShadow]})()`), ["true", `${await token("--fndn-red")} 0px 0px 0px 1px`]);
  await open(fw, 4);
  r = await p.rect(INC);
  await p.click(r.cx, r.cy); await sleep(100);
  check("disabled: field and buttons disabled, a click changes nothing", await q(`[document.querySelector(${JSON.stringify(FIELD)}).disabled,document.querySelector(${JSON.stringify(INC)}).disabled,document.querySelector(${JSON.stringify(FIELD)}).value]`), [true, true, "4"]);

  /* sm: the Input sm, 20px buttons */
  await open(fw, 1);
  const sf = await p.rect(FIELD), sb = await p.rect(INC);
  await open(fw, 1, "", "input");
  const isml = await p.rect("#stage [data-slot=input]");
  check("sm: field as high as the Input sm (28), buttons 20×20, 4px from the end, centred", [sf.h, isml.h, sb.w, sb.h, Math.round(sf.x + sf.w - (sb.x + sb.w)), Math.abs(sb.cy - sf.cy) < 0.6], [28, 28, 20, 20, 4, true]);

  /* formatted */
  await open(fw, 5);
  check("currency: shown \"$1,200\"", await val(), "$1,200");
  await p.click(5, 5); await p.key("Tab"); await p.key("ArrowUp");
  check("currency: Arrow Up steps 50 → \"$1,250\"", await val(), "$1,250");

  /* touch */
  await open(fw, 0);
  await forceCoarse();
  check("coarse pointer: 16px text (no zoom on focus), buttons' hit areas 40px high, the field 40 (the control's coarse minimum)", await q(`(()=>{const i=document.querySelector(${JSON.stringify(FIELD)});const b=document.querySelector(${JSON.stringify(INC)});const a=getComputedStyle(b,"::after");return [getComputedStyle(i).fontSize,b.getBoundingClientRect().height-parseFloat(a.top)-parseFloat(a.bottom),i.getBoundingClientRect().height]})()`), ["16px", 40, 40]);

  /* worst cases */
  await open(fw, 1, "&data=worst");
  check("huge value in 120px: nothing overflows the root, the buttons stay inside the field", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("number-input"))});const f=document.querySelector(${JSON.stringify(FIELD)}).getBoundingClientRect();const d=document.querySelector(${JSON.stringify(DEC)}).getBoundingClientRect();return [r.scrollWidth<=r.clientWidth+1,d.left>=f.left]})()`), [true, true]);
  await open(fw, 0, "&data=worst");
  check("long label wraps above the field (no overflow)", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("number-input"))});const l=r.querySelector("[data-slot=number-input-label]");return [l.getBoundingClientRect().height>30,r.scrollWidth<=r.clientWidth+1]})()`), [true, true]);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the plus button sits at the left end, the minus beside it", await q(`(()=>{const f=document.querySelector(${JSON.stringify(FIELD)}).getBoundingClientRect();const i=document.querySelector(${JSON.stringify(INC)}).getBoundingClientRect();const d=document.querySelector(${JSON.stringify(DEC)}).getBoundingClientRect();return [Math.round(i.left-f.left),i.right<=d.left+0.5]})()`), [4, true]);
  await open(fw, 0, "&theme=dark");
  check("dark: the field fill", await q(`getComputedStyle(document.querySelector(${JSON.stringify(FIELD)})).backgroundColor`), await token("--fndn-field"));
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
