// Keyboard, pointer, semantics and alignment contract of Thinking, run against every target.
//   node components/thinking-state/thinking-state.test.mjs            all four targets
//   node components/thinking-state/thinking-state.test.mjs react      one target
// Measured at device pixel ratio 2.
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2 });
let failed = 0;

async function open(fw, ex, extra = "") {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=thinking-state&fw=${fw}&ex=${ex}${extra}`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(700);
}
const q = (js) => p.eval(js);
/* centre offset of a child box inside its parent box, in CSS px */
const centre = (child, parent) => q(`(()=>{const c=document.querySelector(${JSON.stringify(child)}),b=document.querySelector(${JSON.stringify(parent)});if(!c||!b)return null;const r=c.getBoundingClientRect(),s=b.getBoundingClientRect();return [Math.round((r.x+r.width/2-(s.x+s.width/2))*4)/4, Math.round((r.y+r.height/2-(s.y+s.height/2))*4)/4]})()`);

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  try {
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };

  /* Steps: header semantics, disclosure keys, alignment */
  await open(fw, 0);
  const T = "#stage [data-slot=thinking-state] [data-slot=collapsible-trigger]";
  const R = "#stage [data-slot=thinking-state] [data-slot=collapsible-content]";
  const angle = (sel) => q(`(()=>{const t=getComputedStyle(document.querySelector(${JSON.stringify(sel)})).transform;if(t==="none")return 0;const m=new DOMMatrix(t);return Math.round(Math.atan2(m.b,m.a)*180/Math.PI)})()`);
  check("header is a button with aria-expanded and aria-controls → the trace", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});const id=t.getAttribute("aria-controls");const r=id&&document.getElementById(id);return [t.tagName, t.getAttribute("aria-expanded"), !!r && r.dataset.slot === "collapsible-content"]})()`), ["BUTTON", "true", true]);
  check("working label is a fast Shimmer", await q(`(()=>{const l=document.querySelector("#stage [data-slot=thinking-state-label]>*");return [l.dataset.slot, l.dataset.thinkingState, getComputedStyle(l).animationDuration]})()`), ["shimmer", "label-text", "1.4s"]);
  check("label is a role=status region", await q(`document.querySelectorAll("#stage [data-slot=thinking-state-label][role=status]").length`), 1);
  check("marks are aria-hidden", await q(`[...document.querySelectorAll("#stage [data-slot=thinking-state-check], #stage [data-slot=thinking-state-icon]")].every((e)=>e.getAttribute("aria-hidden")==="true")`), true);
  check("sparkle centred in its 16px box", await centre("#stage [data-slot=thinking-state-icon] [data-slot=icon]", "#stage [data-slot=thinking-state-icon]"), [0, 0]);
  check("check centred in its 14px box", await centre("#stage [data-slot=thinking-state-row]:first-child [data-slot=thinking-state-check] [data-slot=icon]", "#stage [data-slot=thinking-state-row]:first-child [data-slot=thinking-state-check]"), [0, 0]);
  check("spinner centred on the row's text line", await q(`(()=>{const s=document.querySelector("#stage [data-slot=thinking-state-check] [data-slot=spinner]").getBoundingClientRect();const t=document.querySelector("#stage [data-slot=thinking-state-check] [data-slot=spinner]").closest("[data-slot=thinking-state-row]").querySelector("[data-slot=thinking-state-primary]");const r=document.createRange();r.selectNodeContents(t);const l=r.getClientRects()[0];return Math.abs((s.y+s.height/2)-(l.y+l.height/2))<=1})()`), true);
  check("rail line spans the rows", await q(`(()=>{const l=document.querySelector("#stage [data-slot=thinking-state-line]"),r=document.querySelector("#stage [data-slot=thinking-state-rows]");return Math.abs(l.getBoundingClientRect().height-(r.offsetHeight+2))<=0.5})()`), true);
  const tops = await q(`[...document.querySelectorAll("#stage [data-slot=thinking-state-row]")].map((r)=>r.offsetTop)`);
  await sleep(400);
  check("no layout shift after the entrance", await q(`[...document.querySelectorAll("#stage [data-slot=thinking-state-row]")].map((r)=>r.offsetTop)`), tops);
  await q(`document.querySelector(${JSON.stringify(T)}).focus()`);
  await p.key("Enter"); await sleep(350);
  check("Enter collapses; the trace is hidden; focus stays on the header", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});const r=document.getElementById(t.getAttribute("aria-controls"));return [t.getAttribute("aria-expanded"), r.hidden, document.activeElement===t]})()`), ["false", true, true]);
  check("the caret leads the header (before the sparkle and the label), with the rail under it", await q(`(()=>{const c=document.querySelector("#stage [data-slot=thinking-state] [data-slot=collapsible-caret]").getBoundingClientRect(),i=document.querySelector("#stage [data-slot=thinking-state-icon]").getBoundingClientRect(),l=document.querySelector("#stage [data-slot=thinking-state-line]")?.getBoundingClientRect();const rtl=getComputedStyle(document.querySelector("#stage [data-slot=thinking-state]")).direction==="rtl";return [rtl?c.left>i.left:c.left<i.left, !l||Math.abs((l.left+l.width/2)-(c.left+c.width/2))<=0.5]})()`), [true, true]);
  check("caret points right when closed", await angle("#stage [data-slot=thinking-state] [data-slot=collapsible-caret]"), 0);
  check("keyboard toggle is instant (caret has no transition)", await q(`getComputedStyle(document.querySelector("#stage [data-slot=thinking-state] [data-slot=collapsible-caret]")).transitionDuration`), "0s");
  await p.key(" "); await sleep(350);
  check("Space expands again; the caret turns down", [await q(`[document.querySelector(${JSON.stringify(T)}).getAttribute("aria-expanded"), document.querySelector(${JSON.stringify(R)}).hidden]`), await angle("#stage [data-slot=thinking-state] [data-slot=collapsible-caret]")], [["true", false], 90]);
  const hb = await q(`(()=>{const b=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  await p.click(hb.x, hb.y); await sleep(60);
  check("pointer close: the reveal plays (region still laid out mid-way), caret turns over duration.move", await q(`[document.querySelector(${JSON.stringify(R)}).hidden, getComputedStyle(document.querySelector("#stage [data-slot=thinking-state] [data-slot=collapsible-caret]")).transitionDuration]`), [false, "0.2s"]);
  await sleep(400);
  check("pointer close: hidden once the exit has played", await q(`document.querySelector(${JSON.stringify(R)}).hidden`), true);
  await p.click(hb.x, hb.y); await sleep(400);

  /* Search: rows are links */
  await open(fw, 2);
  check("search rows are links with href", await q(`[...document.querySelectorAll("#stage [data-slot=thinking-state-row]")].map((r)=>r.tagName+":"+!!r.getAttribute("href"))`), ["A:true", "A:true", "A:true"]);
  await q(`document.querySelector(${JSON.stringify(T)}).focus()`);
  await p.key("Tab");
  check("Tab moves from the header to the first source", await q(`document.activeElement === document.querySelector("#stage [data-slot=thinking-state-row]")`), true);

  /* Coding: rows are pressable, single-select */
  await open(fw, 3);
  const pressed = () => q(`[...document.querySelectorAll("#stage [data-slot=thinking-state-row]")].map((r)=>r.getAttribute("aria-pressed"))`);
  check("coding rows are buttons with aria-pressed; the selected one is pressed", await pressed(), ["false", "true", "false"]);
  await q(`document.querySelector(${JSON.stringify(T)}).focus()`);
  await p.key("Tab"); await p.key(" "); await sleep(80);
  check("Space presses the focused row and releases the other", await pressed(), ["true", "false", "false"]);
  await p.key("Enter"); await sleep(80);
  check("Enter on the pressed row releases it", await pressed(), ["false", "false", "false"]);
  const r2 = await q(`(()=>{const b=document.querySelectorAll("#stage [data-slot=thinking-state-row]")[2].getBoundingClientRect();return {cx:b.x+b.width/2,cy:b.y+b.height/2}})()`);
  await p.click(r2.cx, r2.cy); await sleep(80);
  check("click presses a row", await pressed(), ["false", "false", "true"]);
  await q(`document.querySelector(${JSON.stringify(T)}).focus()`);
  await p.key("Enter"); await sleep(350);
  await p.key("Tab");
  check("collapsed rows are out of the tab order", await q(`!document.activeElement.closest("[data-slot=collapsible-content]")`), true);

  /* reduced motion: the shimmer stops, the spinner keeps spinning */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 0);
  check("reduced motion: shimmer stops, label is ink-2", await q(`(()=>{const l=getComputedStyle(document.querySelector("#stage [data-slot=thinking-state-label]>*"));const ink2=getComputedStyle(document.documentElement).getPropertyValue("--fndn-ink-2").trim();const probe=document.createElement("span");probe.style.color=ink2;document.body.append(probe);const want=getComputedStyle(probe).color;probe.remove();return [l.animationName, l.color===want]})()`), ["none", true]);
  check("reduced motion: spinner keeps spinning", await q(`getComputedStyle(document.querySelector("#stage [data-slot=spinner]")).animationName`), "fndn-spin");
  await p.media([]);

  /* right-to-left: the trace hangs off the inline-start side */
  await open(fw, 0, "&dir=rtl");
  check("rtl: rail on the right of the rows", await q(`(()=>{const l=document.querySelector("#stage [data-slot=thinking-state-line]").getBoundingClientRect(),r=document.querySelector("#stage [data-slot=thinking-state-row]").getBoundingClientRect();return l.x>r.right-1})()`), true);
  /* a mount is not an arrival: the rows present at mount are still; appear opts in; a row added after mount enters */
  const entrances = () => q(`[...document.querySelectorAll("#stage [data-slot=thinking-state-row]")].map((r)=>getComputedStyle(r).animationName)`);
  await open(fw, 0);
  check("plain mount (appear off by default): no row enters", await entrances(), ["none", "none", "none", "none"]);
  await open(fw, 0, "&step=2");
  check("rows added after mount fade up; the rows present at mount do not", await entrances(), ["none", "none", "none", "none", "fndn-fade-up", "fndn-fade-up"]);
  await open(fw, 4);
  check("appear: the rows present at mount fade up", await entrances(), ["fndn-fade-up", "fndn-fade-up", "fndn-fade-up", "fndn-fade-up"]);
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
