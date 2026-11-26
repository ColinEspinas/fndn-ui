// Textarea: Input's multiline field (compared with a real multiline Input), growing with its text
// (and never below 72px), sized before the first paint, a fixed resizable one, focus ring,
// invalid, disabled, small, worst cases, right-to-left, dark.
//   node components/textarea/textarea.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "textarea";
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
const shadowOf = (value) => q(`(()=>{const d=document.createElement("div");d.style.boxShadow=${JSON.stringify(value)};document.body.append(d);const v=getComputedStyle(d).boxShadow;d.remove();return v})()`);
const css = (sel, keys) => q(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const cs=getComputedStyle(e);return ${JSON.stringify(keys)}.map((k)=>cs[k])})()`);
const away = async () => { await p.hover(1200, 860); await sleep(300); };

const A = "#stage [data-slot=textarea]";
const LOOK = ["minHeight", "paddingTop", "paddingInlineStart", "fontSize", "lineHeight", "borderRadius", "boxShadow", "backgroundColor", "color", "fontFamily"];
const size = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(A)});return {h:e.getBoundingClientRect().height,sh:e.scrollHeight,ch:e.clientHeight}})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("a <textarea>, data-slot=textarea, dir=auto, no resize handle while it grows", await q(`(()=>{const e=document.querySelector(${JSON.stringify(A)});return [e.tagName,e.getAttribute("dir"),getComputedStyle(e).resize]})()`), ["TEXTAREA", "auto", "none"]);
  const mine = await css(A, LOOK);
  await open(fw, 5, "", "input");
  check("at rest it is Input's multiline field (72px, padding, type, radius, ring, fill)", mine, await css("#stage [data-slot=input]", LOOK));

  /* keyboard: Tab, then typing; it grows a line at a time and shrinks back to 72px */
  await open(fw, 0);
  check("starts at 72px", (await size()).h, 72);
  await p.click(5, 5); await p.key("Tab"); await sleep(250);
  check("Tab focuses it; the accent ring", [await q(`document.activeElement===document.querySelector(${JSON.stringify(A)})`), (await css(A, ["boxShadow"]))[0]], [true, await shadowOf("0 0 0 1px var(--fndn-accent), 0 0 0 4px var(--fndn-accent-tint)")]);
  for (let i = 0; i < 6; i++) { await p.type(`line ${i + 1}`); await p.key("Enter"); }
  await sleep(200);
  let s = await size();
  check("six lines typed: it grows to fit them, no inner scroll", [s.h > 120, s.sh <= s.ch + 1], [true, true]);
  await q(`(()=>{const e=document.querySelector(${JSON.stringify(A)});e.select()})()`); await p.key("Backspace"); await sleep(200);
  check("emptied: back to 72px", (await size()).h, 72);

  /* pointer: hover fill */
  await open(fw, 0);
  const r = await p.rect(A);
  await p.hover(r.cx, r.cy); await sleep(300);
  check("hovered (pointer): fill hover", (await css(A, ["backgroundColor"]))[0], await token("--fndn-hover"));
  await away();

  await open(fw, 1);
  check("sm: 13px text, 8px padding, still 72px", [...await css(A, ["fontSize", "paddingInlineStart", "paddingTop"]), (await size()).h], ["13px", "8px", "5px", 72]);
  await open(fw, 2);
  check("invalid: aria-invalid and the red ring", [await q(`document.querySelector(${JSON.stringify(A)}).getAttribute("aria-invalid")`), (await css(A, ["boxShadow"]))[0]], ["true", await shadowOf("0 0 0 1px var(--fndn-red)")]);
  await open(fw, 3);
  check("mono: the mono font", /Mono/.test((await css(A, ["fontFamily"]))[0]), true);
  await open(fw, 4);
  await p.click(5, 5); await p.key("Tab"); await sleep(100);
  check("disabled: half opacity, Tab skips it", [(await css(A, ["opacity"]))[0], await q(`document.activeElement===document.querySelector(${JSON.stringify(A)})`)], ["0.5", false]);
  await open(fw, 5);
  check("autoResize off: a vertical resize handle", (await css(A, ["resize"]))[0], "vertical");
  await p.click(5, 5); await p.key("Tab");
  for (let i = 0; i < 6; i++) { await p.type(`line ${i + 1}`); await p.key("Enter"); }
  await sleep(200);
  check("autoResize off: stays 72px, the text scrolls", (await size()).h, 72);

  /* a first value of four lines: sized before the first paint, so nothing jumps */
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `(() => { const tick = () => { const e = document.querySelector("#stage [data-slot=textarea]"); if (e) window.__firstHeight = e.getBoundingClientRect().height; else requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()` });
  await open(fw, 6);
  s = await size();
  /* the height follows the text (14px since the variant contract): measured, not hard-coded */
  check("a first value of several lines at mount: as tall as its text, no inner scroll", [s.h > 72, s.sh <= s.ch + 1], [true, true]);
  check("…and already that tall in the first frame it shows (nothing jumps)", await q("window.__firstHeight"), s.h);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  s = await size();
  check("worst long text: grown to fit it, no inner scroll, no horizontal overflow", [s.h > 72, s.sh <= s.ch + 1, await q(`(()=>{const e=document.querySelector(${JSON.stringify(A)});return e.scrollWidth<=e.clientWidth+1})()`)], [true, true, true]);
  await open(fw, 1, "&data=worst");
  check("worst unbreakable text in 200px: wraps, no horizontal overflow", await q(`(()=>{const e=document.querySelector(${JSON.stringify(A)});return e.scrollWidth<=e.clientWidth+1})()`), true);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: dir=auto, aligned to the right", await q(`(()=>{const e=document.querySelector(${JSON.stringify(A)});return [e.getAttribute("dir"),getComputedStyle(e).textAlign]})()`), ["auto", "right"]);
  await open(fw, 6, "&theme=dark");
  check("dark: the dark field colour", (await css(A, ["backgroundColor"]))[0], await token("--fndn-field"));
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
