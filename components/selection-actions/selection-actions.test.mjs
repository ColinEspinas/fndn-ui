// Keyboard and pointer contract of Selection actions, run against every target through the harness.
//   node components/selection-actions/selection-actions.test.mjs            all four targets
//   node components/selection-actions/selection-actions.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const TEXT = "#stage [data-slot=selection-actions-text]";
const C = "[data-slot=selection-actions-content]";
/* the toolbar's mode and the mark's state, from what they show: a status while busy, Keep with a result */
const MODE = `(()=>{const c=document.querySelector("[data-slot=selection-actions-content]");return c.querySelector("[data-slot=selection-actions-status]")?"busy":c.querySelector("[data-selection-actions=keep]")?"result":"idle"})()`;
const ORIGINAL = "Merge it first thing Saturday so the build has time to settle before the morning release.";
const RESULT = "Merge analytics first thing Saturday so the build has time to fully settle before the noon release.";
const p = await launch({ hover: true });
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(350); };
const mouse = (type, x, y) => p.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });

/* page helpers: the point at a character offset of the passage, the toolbar's geometry */
const AT = `window.__at=(i)=>{const root=document.querySelector(${JSON.stringify(TEXT)});const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let pos=0;for(let n=w.nextNode();n;n=w.nextNode()){if(i<pos+n.data.length){const r=document.createRange();r.setStart(n,i-pos);r.setEnd(n,Math.min(i-pos+1,n.data.length));const b=r.getClientRects()[0];return {x:b.left+1,y:b.top+b.height/2}}pos+=n.data.length}return null};
window.__near=(g)=>g&&Math.abs(g.gap-8)<=1&&g.offCentre<=1&&g.height===36;window.__geo=()=>{const m=document.querySelector("#stage [data-slot=selection-actions-mark]");const c=document.querySelector(${JSON.stringify(C)});if(!m||!c)return null;const lines=[...m.getClientRects()];const last=lines[lines.length-1];const mb=m.getBoundingClientRect();const cb=c.getBoundingClientRect();return {gap:Math.round(cb.top-last.bottom),offCentre:Math.round(Math.abs((cb.left+cb.width/2)-(mb.left+mb.width/2))),height:Math.round(cb.height)}};
window.__select=(a,b)=>{const root=document.querySelector(${JSON.stringify(TEXT)});const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const r=document.createRange();let pos=0,s=false;for(let n=w.nextNode();n;n=w.nextNode()){const l=n.data.length;if(!s&&a<=pos+l){r.setStart(n,a-pos);s=true}if(s&&b<=pos+l){r.setEnd(n,b-pos);break}pos+=l}const sel=getSelection();sel.removeAllRanges();sel.addRange(r)};true`;

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js);
  const state = () => q(`document.querySelector(${JSON.stringify(C)}).getAttribute("data-state")`);
  const focused = () => q(`(()=>{const a=document.activeElement;if(!a||a===document.body)return null;if(a.matches(${JSON.stringify(TEXT)}))return "passage";if(a.matches(${JSON.stringify(C)}))return "toolbar";return a.getAttribute("aria-label")??a.textContent.trim()})()`);
  const mark = () => q(`(()=>{const m=document.querySelector("#stage [data-slot=selection-actions-mark]");const mode=${MODE};return m?[m.textContent,mode==="busy"?"streaming":mode==="result"?"result":"selected",getComputedStyle(m).backgroundColor!=="rgba(0, 0, 0, 0)"]:null})()`);
  const native = () => q(`getSelection().toString()`);
  const passageText = () => q(`document.querySelector(${JSON.stringify(TEXT)}).textContent`);
  const stops = () => q(`[...document.querySelectorAll(${JSON.stringify(C + " button")})].filter((b)=>b.tabIndex===0).length`);
  const load = async (ex, extra = "") => { await p.goto(`${BASE}/harness.html?c=selection-actions&fw=${fw}&ex=${ex}${extra}`, 300); await ready(); await q(AT); };
  try {
  p.errors.length = 0;
  await load(0);
  check("toolbar is portaled, closed, a named toolbar", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return [!document.querySelector("#stage [data-slot=selection-actions-positioner]"),c.getAttribute("role"),c.getAttribute("aria-label"),c.getAttribute("data-state")]})()`), [true, "toolbar", "Edit selection", "closed"]);

  // pointer: drag across "Merge it first thing Saturday"
  const a = await q(`__at(42)`), b = await q(`__at(71)`);
  await mouse("mouseMoved", a.x, a.y); await mouse("mousePressed", a.x, a.y);
  await mouse("mouseMoved", (a.x + b.x) / 2, b.y); await mouse("mouseMoved", b.x, b.y); await mouse("mouseReleased", b.x, b.y);
  await sleep(60);
  check("a pointer selection opens the toolbar with the popup recipe", [await state(), await q(`document.documentElement.dataset.fndnInput`), await q(`getComputedStyle(document.querySelector(${JSON.stringify(C)})).transitionDuration.split(", ").slice(0,2)`)], ["open", "pointer", ["0.18s", "0.18s"]]);
  check("opening is the popup's one entrance: the controls do not fade on their own", await q(`document.querySelector(${JSON.stringify(C)}).getAnimations({subtree:true}).filter((a)=>a.animationName==="fndn-fade-in").length`), 0);
  await sleep(300);
  check("the selection becomes the mark", await mark(), ["Merge it first thing Saturday", "selected", true]);
  check("the toolbar hangs 8px (±1) under the selection, centred on it", await q(`__near(__geo())`), true);
  check("focus moves to the first action; one tab stop", [await focused(), await stops()], ["Explain", 1]);

  // the toolbar's keyboard
  await p.key("ArrowRight"); check("ArrowRight moves to the next action", await focused(), "Improve");
  await p.key("ArrowLeft"); await p.key("ArrowLeft"); check("ArrowLeft wraps to the last", await focused(), "Tone");
  await p.key("Home"); check("Home jumps to the first", await focused(), "Explain");
  await p.key("End"); check("End jumps to the last; still one tab stop", [await focused(), await stops()], ["Tone", 1]);
  await p.key("Escape"); await sleep(120);
  check("Escape closes and gives the selection back to the passage", [await state(), await mark(), await focused(), await native()], ["closed", null, "passage", "Merge it first thing Saturday"]);

  // keyboard: a selection finished by releasing Shift appears instantly
  await q(`__select(42, 47)`);
  await p.key("ArrowRight", { shift: true }); await p.key("Shift"); await sleep(60);
  const kb = await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return [c.getAttribute("data-state"),document.documentElement.dataset.fndnInput,getComputedStyle(c).transitionDuration.split(", ").every((d)=>parseFloat(d)===0)]})()`);
  check("a keyboard selection opens the toolbar instantly", kb, ["open", "keyboard", true]);
  await sleep(100);
  check("…marked, with focus on the first action", [(await mark())?.[0]?.slice(0, 5), await focused()], ["Merge", "Explain"]);
  await p.key("Tab"); await sleep(150);
  check("Tab closes and returns to the passage with the selection", [await state(), await focused(), await native()], ["closed", "passage", "Merge"]);

  // a press outside closes; a new drag inside reopens on the new text
  /* (pressing on selected text starts a drag-and-drop, not a new selection: clear it first) */
  await p.click(20, 600); await sleep(100);
  await mouse("mouseMoved", a.x, a.y); await mouse("mousePressed", a.x, a.y); await mouse("mouseMoved", b.x, b.y); await mouse("mouseReleased", b.x, b.y);
  await sleep(350);
  check("drag again reopens", await state(), "open");
  await p.click(20, 600); await sleep(250);
  check("a press outside closes and clears the mark", [await state(), await mark()], ["closed", null]);
  const c1 = await q(`__at(0)`), c2 = await q(`__at(9)`);
  await mouse("mouseMoved", a.x, a.y); await mouse("mousePressed", a.x, a.y); await mouse("mouseMoved", b.x, b.y); await mouse("mouseReleased", b.x, b.y);
  await sleep(350);
  await mouse("mouseMoved", c1.x, c1.y); await mouse("mousePressed", c1.x, c1.y); await mouse("mouseMoved", c2.x, c2.y); await mouse("mouseReleased", c2.x, c2.y);
  await sleep(400);
  check("selecting other text while open moves the toolbar there", [await state(), (await mark())?.[0], await passageText()], ["open", "Analytics", "Analytics holds the top slot all weekend. " + ORIGINAL]);
  check("…still under the new selection", await q(`__near(__geo())`), true);
  check("no console errors", p.errors.slice(0, 2), []);

  // result: Keep writes the result into the passage and selects it
  await load(4);
  check("result: Keep, Discard, Try again", await q(`[...document.querySelectorAll(${JSON.stringify(C + " button")})].map((b)=>b.getAttribute("aria-label")??b.textContent.trim())`), ["Keep", "Discard", "Try again"]);
  check("result: the mark holds the result", await mark(), [RESULT, "result", true]);
  check("a bar that fits shows no veil over its controls", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return [c.scrollWidth>c.clientWidth+1,c.hasAttribute("data-overflow-start"),c.hasAttribute("data-overflow-end"),getComputedStyle(c,"::before").opacity,getComputedStyle(c,"::after").opacity]})()`), [false, false, false, "0", "0"]);
  /* a bar narrower than its controls (a phone): the edge veils at the start, the middle and the end
   * of the scroll follow the scroll position, in both directions, with no animation */
  const sweep = () => q(`(async()=>{const e=document.querySelector(${JSON.stringify(C)});e.style.maxWidth="140px";const frame=()=>new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r)));await frame();const rtl=getComputedStyle(e).direction==="rtl";const range=e.scrollWidth-e.clientWidth;const at=[];for(const f of [0,0.5,1]){e.scrollLeft=(rtl?-1:1)*Math.round(range*f);await frame();at.push([e.hasAttribute("data-overflow-start"),e.hasAttribute("data-overflow-end"),getComputedStyle(e,"::before").opacity,getComputedStyle(e,"::after").opacity])}e.style.maxWidth="";await frame();return {at,animations:[getComputedStyle(e,"::before").animationName,getComputedStyle(e,"::after").animationName]}})()`);
  const SWEPT = { at: [[false, true, "0", "1"], [true, true, "1", "1"], [true, false, "1", "0"]], animations: ["none", "none"] };
  check("a bar that does not fit: end veil at the start, both in the middle, start veil at the end; no animation", await sweep(), SWEPT);
  await load(4, "&dir=rtl");
  check("rtl: the same veils at the start, the middle and the end", await sweep(), SWEPT);
  await load(4);
  await p.clickSel(`${C} [data-selection-actions=retry]`); await sleep(30);
  check("a mode swap under the pointer fades the new controls in", await q(`document.querySelector(${JSON.stringify(C)}).getAnimations({subtree:true}).some((a)=>a.animationName==="fndn-fade-in")`), true);
  check("…and the bar eases to its new width (a width transition), centred under the selection", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return [c.getAnimations().some((a)=>a.transitionProperty==="width"), __geo().offCentre<=1]})()`), [true, true]);
  await sleep(400);
  check("…then rests at its natural width (no width left inline)", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return [c.style.width, __near(__geo())]})()`), ["", true]);
  await load(4);
  await p.clickSel(`${C} [data-selection-actions=keep]`); await sleep(200);
  check("Keep: the passage holds the result, selected, toolbar closed", [await passageText(), await native(), await state(), await focused()], ["Analytics holds the top slot all weekend. " + RESULT, RESULT, "closed", "passage"]);
  await load(4);
  await p.clickSel(`${C} [data-selection-actions=discard]`); await sleep(200);
  check("Discard: the original comes back, selected", [await passageText(), await native(), await state()], ["Analytics holds the top slot all weekend. " + ORIGINAL, ORIGINAL, "closed"]);
  await load(4);
  await q(`document.querySelector(${JSON.stringify(C + " [data-selection-actions=keep]")}).focus()`);
  await p.key("End"); await p.key("Enter"); await sleep(150);
  check("Try again clears the result; focus moves to the new first button", [await q(`${MODE}`), await focused(), await mark()], ["idle", "Improve", [ORIGINAL, "selected", true]]);

  // busy
  await load(2);
  check("thinking: a shimmering status, the original still marked", [await q(`(()=>{const s=document.querySelector(${JSON.stringify(C + " [data-slot=selection-actions-status]")});return [s.getAttribute("role"),s.querySelector("[data-slot=shimmer]")?.textContent]})()`), (await mark())?.[1]], [["status", "Improving…"], "streaming"]);
  await load(3);
  check("streaming: a caret follows the result; the label stops shimmering", await q(`(()=>{const m=document.querySelector("#stage [data-slot=selection-actions-mark]");const s=document.querySelector(${JSON.stringify(C + " [data-slot=selection-actions-status]")});return [!!m.querySelector("[data-slot=streaming-text-caret]"),!!s.querySelector("[data-slot=shimmer]"),s.querySelector("[data-slot=selection-actions-label]")?.textContent]})()`), [true, false, "Improving…"]);
  await q(`document.querySelector(${JSON.stringify(C)}).focus()`);
  await p.key("Escape"); await sleep(200);
  check("Escape while working discards and restores the original selection", [await state(), await passageText(), await native()], ["closed", "Analytics holds the top slot all weekend. " + ORIGINAL, ORIGINAL]);

  // right to left: arrows follow the reading direction
  await load(1, "&dir=rtl");
  check("rtl: open at mount, under the selection", await q(`__near(__geo())`), true);
  await q(`document.querySelector(${JSON.stringify(C + " button")}).focus()`);
  await p.key("ArrowLeft");
  check("rtl: ArrowLeft moves to the next action", await focused(), "Improve");
  check("no console errors (examples)", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ threw: ${String(e).slice(0, 200)}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
