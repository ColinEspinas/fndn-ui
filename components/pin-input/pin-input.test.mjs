// Pin Input: Ark's pin-input on the real Input (each cell the Input made square: its height, fill,
// rings), one tab stop, typing moves on, a character the type refuses is ignored, Backspace and the
// arrows move back and forth, completion, the hidden input, mask, otp, invalid, disabled, sm, touch
// (40px cells, 16px text), worst cases (cells wrap, never overflow), right-to-left, dark.
//   node components/pin-input/pin-input.test.mjs [react …]   (default: the spec's targets)
const C = "pin-input";
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
const CELL = `#stage [data-pin-input=input]`;
const cells = () => q(`[...document.querySelectorAll(${JSON.stringify(CELL)})].map((c)=>c.value)`);
const focused = () => q(`[...document.querySelectorAll(${JSON.stringify(CELL)})].indexOf(document.activeElement)`);
const LOOK = ["height", "borderRadius", "backgroundColor", "boxShadow", "fontSize", "color"];
const look = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("six cells, each the Input (data-slot=input), named \"Verification code, n of 6\", one in the tab order",
    await q(`(()=>{const c=[...document.querySelectorAll(${JSON.stringify(CELL)})];return [c.length,c.every((e)=>e.dataset.slot==="input"),c[1].getAttribute("aria-label"),c.filter((e)=>e.tabIndex===0).length]})()`),
    [6, true, "Verification code, 2 of 6", 1]);
  check("group: role=group named by the label; otp: autocomplete one-time-code, numeric keyboard",
    await q(`(()=>{const g=document.querySelector(${JSON.stringify(S("pin-input-control"))});const c=document.querySelector(${JSON.stringify(CELL)});return [g.getAttribute("role"),g.getAttribute("aria-label"),c.autocomplete,c.inputMode]})()`),
    ["group", "Verification code", "one-time-code", "numeric"]);
  const mine = await look(CELL);
  const box = await p.rect(CELL);
  const gap = await q(`(()=>{const c=[...document.querySelectorAll(${JSON.stringify(CELL)})].map((e)=>e.getBoundingClientRect());return Math.round(c[1].left-c[0].right)})()`);
  check("cells centre their character in tabular figures, no placeholder", await q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(CELL)}));return [cs.textAlign,cs.fontVariantNumeric,document.querySelector(${JSON.stringify(CELL)}).placeholder]})()`), ["center", "tabular-nums", ""]);
  await open(fw, 0, "", "input");
  check("a cell is the Input md (height 32, radius, fill, hairline, type, ink)", mine, await look("#stage [data-slot=input]"));
  check("md cells are square, 32×32, 6px apart", [box.w, box.h, gap], [32, 32, 6]);

  /* typing */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab enters the first cell", await focused(), 0);
  await p.type("12"); await sleep(50);
  check("typing fills and moves on: 1 2, focus on the third cell", [await cells(), await focused()], [["1", "2", "", "", "", ""], 2]);
  await p.type("a"); await sleep(50);
  check("a letter in a numeric code is ignored", [await cells(), await focused()], [["1", "2", "", "", "", ""], 2]);
  await p.key("Backspace"); await sleep(50);
  check("Backspace in an empty cell clears the previous one and moves there", [await cells(), await focused()], [["1", "", "", "", "", ""], 1]);
  await p.key("ArrowLeft"); check("Arrow Left: the previous cell", await focused(), 0);
  await p.key("ArrowRight"); check("Arrow Right: the next cell", await focused(), 1);
  await p.type("23456"); await sleep(80);
  check("complete: every cell filled, data-complete, the hidden input holds the code",
    await q(`(()=>{const c=[...document.querySelectorAll(${JSON.stringify(CELL)})];return [c.map((e)=>e.value).join(""),c.every((e)=>e.hasAttribute("data-complete")),document.querySelector(${JSON.stringify(S("pin-input-hidden-input"))}).value]})()`),
    ["123456", true, "123456"]);
  await sleep(350);
  check("the focused cell shows the Input's accent ring", await q(`getComputedStyle(document.activeElement).boxShadow.includes("0px 0px 0px 1px")`), true);

  await open(fw, 1);
  check("defaultValue (the model prop, uncontrolled) fills the cells", (await cells()).join(""), "481592");
  await open(fw, 2);
  check("mask: four password cells", await q(`[...document.querySelectorAll(${JSON.stringify(CELL)})].map((c)=>c.type)`), ["password", "password", "password", "password"]);
  await open(fw, 4);
  check("invalid: every cell aria-invalid with the red ring", await q(`[...document.querySelectorAll(${JSON.stringify(CELL)})].every((c)=>c.getAttribute("aria-invalid")==="true"&&getComputedStyle(c).boxShadow.startsWith(${JSON.stringify(await token("--fndn-red"))}))`), true);
  await open(fw, 5);
  check("disabled: every cell disabled, half opacity", await q(`[...document.querySelectorAll(${JSON.stringify(CELL)})].map((c)=>[c.disabled,getComputedStyle(c).opacity]).every(([d,o])=>d&&o==="0.5")`), true);
  await open(fw, 6);
  await p.click(5, 5); await p.key("Tab"); await p.type("a1");
  check("alphanumeric: letters and digits; the placeholder shows in empty cells without focus", [(await cells()).slice(0, 2), await q(`document.querySelectorAll(${JSON.stringify(CELL)})[4].placeholder`)], [["a", "1"], "·"]);

  /* sm: the Input sm */
  await open(fw, 3);
  const sm = await q(`(()=>{const c=[...document.querySelectorAll(${JSON.stringify(CELL)})].map((e)=>e.getBoundingClientRect());return [c[0].width,c[0].height,Math.round(c[1].left-c[0].right)]})()`);
  await open(fw, 1, "", "input");
  check("sm: 28×28 cells (the Input sm is 28), 4px apart", [...sm, (await p.rect("#stage [data-slot=input]")).h], [28, 28, 4, 28]);

  /* touch */
  await open(fw, 1);
  await forceCoarse();
  check("coarse pointer: 40×40 cells, 16px text", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CELL)});const b=c.getBoundingClientRect();return [b.width,b.height,getComputedStyle(c).fontSize]})()`), [40, 40, "16px"]);

  /* worst cases */
  await open(fw, 1, "&data=worst");
  check("12 cells in 300px: they wrap, nothing overflows", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("pin-input"))});const c=[...document.querySelectorAll(${JSON.stringify(CELL)})].map((e)=>e.getBoundingClientRect());return [c.length,c[c.length-1].top>c[0].top,r.scrollWidth<=r.clientWidth+1,c.every((b)=>b.right<=r.getBoundingClientRect().right+0.5)]})()`), [12, true, true, true]);
  await open(fw, 0, "&data=worst");
  check("long label in 160px wraps; nothing overflows", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("pin-input"))});return [r.querySelector("[data-slot=pin-input-label]").getBoundingClientRect().height>40,r.scrollWidth<=r.clientWidth+1]})()`), [true, true]);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the first cell is on the right, the label in its own direction", await q(`(()=>{const c=[...document.querySelectorAll(${JSON.stringify(CELL)})].map((e)=>e.getBoundingClientRect().left);return [c[0]>c[1],getComputedStyle(document.querySelector(${JSON.stringify(S("pin-input-label"))})).unicodeBidi]})()`), [true, "plaintext"]);
  await open(fw, 1, "&theme=dark");
  check("dark: the field fill", await q(`getComputedStyle(document.querySelector(${JSON.stringify(CELL)})).backgroundColor`), await token("--fndn-field"));
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
