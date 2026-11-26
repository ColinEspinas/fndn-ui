// Keyboard, pointer and indicator contract of the tabs, run against every target.
//   node components/tabs/tabs.test.mjs            all four targets
//   node components/tabs/tabs.test.mjs react      one target
import fs from "node:fs";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const FIXTURE = JSON.parse(fs.readFileSync(new URL("./tabs.fixtures.json", import.meta.url), "utf8"));
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2, hover: true });
/* the first frames of every mount: is the indicator on the selected tab (I), its stand-in painted (S),
 * or neither (_); and does the selected tab's background run a transition */
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__tabsFrames=[];(function f(){const i=document.querySelector('#stage [data-slot=tabs-indicator]');if(i){const t=i.parentElement.querySelector(':scope>[data-slot=tabs-trigger][aria-selected=true]');const on=!i.hidden&&i.getBoundingClientRect().width>0;window.__tabsFrames.push(on?'I':t&&getComputedStyle(t).backgroundColor!=='rgba(0, 0, 0, 0)'?'S':'_')}if(window.__tabsFrames.length<6)requestAnimationFrame(f)})();` });
let failed = 0;

const open = async (fw, ex, extra = "") => {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=tabs&fw=${fw}&ex=${ex}${extra}`, 300);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(350);
};
const selected = () => p.eval(`document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]')?.textContent.trim() ?? null`);
const focused = () => p.eval(`document.activeElement?.matches?.("[data-slot=tabs-trigger]") ? document.activeElement.textContent.trim() : null`);
const panel = () => p.eval(`[...document.querySelectorAll("#stage [data-slot=tabs-content]")].filter((c)=>!c.hidden).map((c)=>c.textContent.trim())`);
/* how far the pill indicator is from the selected tab's box, in px */
const drift = () => p.eval(`(()=>{const t=document.querySelector("#stage [data-slot=tabs-indicator]");const o=document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]');if(!t||!o||t.hidden)return null;const a=t.getBoundingClientRect(),b=o.getBoundingClientRect();return +Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height)).toFixed(2)})()`);
const ind = (prop) => p.eval(`getComputedStyle(document.querySelector("#stage [data-slot=tabs-indicator]")).${prop}`);
const near = (px) => (v) => v !== null && v <= px;

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => {
    const ok = typeof want === "function" ? want(got) : JSON.stringify(got) === JSON.stringify(want);
    if (!ok) failed++;
    checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}${typeof want === "function" ? "" : `, want ${JSON.stringify(want)}`}`}`);
  };
  try {
  await open(fw, 0);
  check("tablist of tabs with one selected and its panel shown", await p.eval(`[document.querySelector("#stage [data-slot=tabs-list]").getAttribute("role"), document.querySelectorAll('#stage [role="tab"]').length, document.querySelectorAll('#stage [role="tab"][aria-selected="true"]').length, document.querySelector("#stage [data-slot=tabs-list]").getAttribute("aria-label")]`), ["tablist", 3, 1, "Panel"]);
  check("first panel shown, the others hidden", await panel(), ["Ask about this supplier’s last three orders."]);
  check("indicator covers the selected tab on mount", await drift(), near(0.5));
  check("a fresh mount: the indicator is on the selected tab from its first frame, no stand-in fade", [await p.eval(`window.__tabsFrames.join("")`), await p.eval(`document.getAnimations().filter((a)=>a.effect?.target?.closest?.("#stage [data-slot=tabs]")).length`)], ["IIIIII", 0]);
  check("no slide-in on mount (transition is off until a selection)", await ind("transitionProperty"), "none");
  check("label is centred in the tab", await p.eval(`(()=>{const t=document.querySelector('#stage [data-slot=tabs-trigger]');const b=t.getBoundingClientRect();const r=document.createRange();r.selectNodeContents(t);const x=r.getBoundingClientRect();return [b.height, +Math.abs((b.top+b.height/2)-(x.top+x.height/2)).toFixed(2) < 0.5, +Math.abs((b.left+b.width/2)-(x.left+x.width/2)).toFixed(2) < 0.5]})()`), [26, true, true]);

  await p.eval(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(60);
  check("Tab reaches the selected tab", await focused(), "Chat");
  check("keyboard focus shows the ring", await p.eval(`getComputedStyle(document.activeElement).outlineStyle`), "solid");
  await p.key("ArrowRight"); await sleep(80);
  check("ArrowRight moves focus and selection follows", [await selected(), await focused()], ["Notes", "Notes"]);
  check("the panel swaps with no transition", [await panel(), await p.eval(`[...document.querySelectorAll("#stage [data-slot=tabs-content]")].every((c)=>getComputedStyle(c).transitionDuration.split(",").every((d)=>parseFloat(d)===0) && getComputedStyle(c).animationName==="none")`)], [["Two notes from the tasting on Tuesday."], true]);
  check("a keyboard selection moves the indicator instantly", [await p.eval(`document.documentElement.dataset.fndnInput`), (await ind("transitionDuration")).split(",").every((d) => parseFloat(d) === 0), await drift() <= 0.5], ["keyboard", true, true]);
  check("…and the labels change colour instantly with it (kbd-instant on the trigger)", await p.eval(`[...document.querySelectorAll("#stage [data-slot=tabs-trigger]")].every((t)=>getComputedStyle(t).transitionDuration.split(",").every((d)=>parseFloat(d)===0))`), true);
  await p.key("ArrowLeft"); await sleep(60);
  await p.key("ArrowLeft"); await sleep(60);
  check("ArrowLeft wraps from the first to the last tab", [await selected(), await focused()], ["Files", "Files"]);
  await p.key("Home"); await sleep(60);
  check("Home selects the first tab", [await selected(), await focused()], ["Chat", "Chat"]);
  await p.key("End"); await sleep(60);
  check("End selects the last tab", [await selected(), await focused()], ["Files", "Files"]);
  await p.key("Tab"); await sleep(60);
  check("the list is one tab stop; the next Tab goes to the panel", await p.eval(`document.activeElement?.getAttribute("role")`), "tabpanel");

  await p.clickSel('#stage [data-slot=tabs-trigger]:nth-of-type(2)'); await sleep(40);
  check("click selects", [await selected(), await panel()], ["Notes", ["Two notes from the tasting on Tuesday."]]);
  check("a pointer selection slides the indicator on transform", [await p.eval(`document.documentElement.dataset.fndnInput`), (await ind("transitionProperty")).includes("transform"), parseFloat(await ind("transitionDuration")) > 0], ["pointer", true, true]);
  await sleep(450);
  check("indicator lands on the clicked tab and the transition switches off again", [await drift() <= 0.5, await ind("transitionProperty")], [true, "none"]);
  await p.eval(`document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]').textContent = "Notes and files"`); await sleep(150);
  check("a size change (longer label, late font) re-fits the indicator without animating", [await drift() <= 0.5, await ind("transitionProperty")], [true, "none"]);
  check("no console errors", p.errors.slice(0, 2), []);

  await open(fw, 1);
  check("underline: a 2px ink bar under the selected tab, as wide as it", await p.eval(`(()=>{const i=document.querySelector("#stage [data-slot=tabs-indicator]").getBoundingClientRect(),t=document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]').getBoundingClientRect();return [i.height, +Math.abs(i.bottom-t.bottom).toFixed(2) < 0.5, +Math.abs(i.left-t.left).toFixed(2) <= 0.5, +Math.abs(i.width-t.width).toFixed(2) <= 0.5]})()`), [2, true, true, true]);
  await p.clickSel('#stage [data-slot=tabs-trigger]:nth-of-type(3)'); await sleep(450);
  check("underline: the bar follows a click", await p.eval(`(()=>{const i=document.querySelector("#stage [data-slot=tabs-indicator]").getBoundingClientRect(),t=document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]').getBoundingClientRect();return +Math.abs(i.left-t.left).toFixed(2) <= 0.5 && t.width > 0})()`), true);

  await open(fw, 2);
  await p.eval(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(60);
  await p.key("ArrowRight"); await sleep(60);
  check("arrows skip a disabled tab", [await selected(), await focused()], ["Published", "Published"]);
  await p.clickSel('#stage [data-slot=tabs-trigger]:nth-of-type(2)'); await sleep(60);
  check("a disabled tab cannot be selected", await selected(), "Published");
  check("no console errors (other examples)", p.errors.slice(0, 2), []);

  /* right to left, every target (the harness wraps the adapters in Ark's LocaleProvider) */
  for (const ex of [0, 1]) {
    const what = ex ? "underline" : "pill";
    await open(fw, ex, "&dir=rtl");
    check(`right to left (${what}): the first tab sits at the right`, await p.eval(`(()=>{const t=[...document.querySelectorAll("#stage [data-slot=tabs-trigger]")].map((e)=>e.getBoundingClientRect().left);return t[0]>t[1]&&t[1]>t[2]})()`), true);
    if (!ex) check("right to left (pill): the indicator covers the selected tab", await drift(), near(0.5));
    await p.eval(`document.activeElement?.blur()`);
    await p.key("Tab"); await sleep(60);
    const first = await selected();
    await p.key("ArrowLeft"); await sleep(80);
    const second = await selected();
    check(`right to left (${what}): ArrowLeft moves to the next tab (visually left); the indicator follows`, [second !== first, await p.eval(`(()=>{const t=[...document.querySelectorAll("#stage [data-slot=tabs-trigger]")];return t.findIndex((e)=>e.getAttribute("aria-selected")==="true")})()`), await p.eval(`(()=>{const i=document.querySelector("#stage [data-slot=tabs-indicator]").getBoundingClientRect(),t=document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]').getBoundingClientRect();return +Math.abs(i.left-t.left).toFixed(2) <= 0.5})()`)], [true, 1, true]);
    await p.key("ArrowRight"); await sleep(80);
    check(`right to left (${what}): ArrowRight goes back`, await selected(), first);
  }

  /* closable tabs (example 3): the close part beside the trigger, Delete, focus to a neighbour,
   * the strip keeps the selected tab in view */
  await open(fw, 3);
  const tabsNow = () => p.eval(`[...document.querySelectorAll("#stage [data-slot=tabs-trigger]")].map((t)=>t.textContent.trim())`);
  const inView = () => p.eval(`(()=>{const l=document.querySelector("#stage [data-slot=tabs-list]").getBoundingClientRect();const t=document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]').closest("[data-slot=tabs-tab]").getBoundingClientRect();return t.left>=l.left-0.5&&t.right<=l.right+0.5})()`);
  check("closable: each trigger sits in a tab part beside its close button (not inside it); the button is out of the Tab order but not hidden", await p.eval(`[...document.querySelectorAll("#stage [data-slot=tabs-tab]")].map((w)=>[w.children[0].dataset.slot, w.children[1].dataset.slot, w.children[0].querySelector("button")===null, w.children[1].tabIndex, w.children[1].getAttribute("aria-hidden"), w.children[0].getAttribute("aria-keyshortcuts")].join(" "))[0]`), "tabs-trigger tabs-close true -1  Delete");
  check("closable: the close button has its name and sits inside the indicator (which measures the trigger)", await p.eval(`(()=>{const c=document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"] + [data-slot=tabs-close]');const i=document.querySelector("#stage [data-slot=tabs-indicator]").getBoundingClientRect(),b=c.getBoundingClientRect();return [c.getAttribute("aria-label"), b.left>=i.left-0.5&&b.right<=i.right+0.5, getComputedStyle(c).opacity]})()`), ["Close rate-limit.ts", true, "1"]);
  const driftX = () => p.eval(`(()=>{const a=document.querySelector("#stage [data-slot=tabs-indicator]").getBoundingClientRect(),b=document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]').getBoundingClientRect();return +Math.max(Math.abs(a.left-b.left),Math.abs(a.width-b.width)).toFixed(2)})()`);
  /* the harness plays the caller: a tab that asks to close is removed from the items */
  await p.eval(`(()=>{const m=window.__harnessMounted;let items=null;const drop=(v)=>{items=(items??[...document.querySelectorAll("#stage [data-slot=tabs-trigger]")].map((t)=>({value:t.dataset.value,label:t.textContent.trim(),content:t.dataset.value}))).filter((i)=>i.value!==v);m.update({items})};m.update(${fw === "svelte" ? "{onclose:drop,onvaluechange:(v)=>m.update({value:v})}" : "{onClose:drop}"})})()`); await sleep(100);
  check("closable: the indicator still covers the selected trigger (and its close button)", await driftX(), near(0.5));
  check("closable: the close button of a tab at rest is invisible but keeps its room", await p.eval(`(()=>{const c=document.querySelectorAll("#stage [data-slot=tabs-close]")[1];return [getComputedStyle(c).opacity, c.getBoundingClientRect().width]})()`), ["0", 16]);
  { const t = await p.rect('#stage [data-slot=tabs-tab]:nth-child(3) [data-slot=tabs-trigger]'); await p.hover(t.cx - 10, t.cy); await sleep(250); }
  check("closable: hovering a tab shows its close button", await p.eval(`getComputedStyle(document.querySelectorAll("#stage [data-slot=tabs-close]")[1]).opacity`), "1");
  await p.hover(1, 1); await sleep(150);
  check("closable: five files do not fit, the strip scrolls", await p.eval(`(()=>{const l=document.querySelector("#stage [data-slot=tabs-list]");return l.scrollWidth>l.clientWidth})()`), true);
  await p.eval(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(60);
  await p.key("Delete"); await sleep(150);
  check("Delete closes the focused tab; the next one is selected and focused", [await tabsNow(), await selected(), await focused()], [["invoices.ts", "rate-limit.test.ts", "deliver.ts", "package.json"], "invoices.ts", "invoices.ts"]);
  check("…instantly, and the indicator lands on it", await driftX(), near(0.5));
  await p.key("End"); await sleep(250);
  check("End selects the last tab and the strip scrolls it into view (instantly, from the keyboard)", [await selected(), await inView()], ["package.json", true]);
  await p.clickSel('#stage [data-slot=tabs-trigger][aria-selected="true"] + [data-slot=tabs-close]'); await sleep(200);
  check("its close button closes the last tab: the previous one is selected, focus follows (not lost to the page)", [await tabsNow(), await selected(), await focused()], [["invoices.ts", "rate-limit.test.ts", "deliver.ts"], "deliver.ts", "deliver.ts"]);
  await p.clickSel('#stage [data-slot=tabs-tab]:nth-child(2) [data-slot=tabs-close]'); await sleep(200);
  check("closing a tab that is not selected keeps the selection", [await tabsNow(), await selected()], [["rate-limit.test.ts", "deliver.ts"], "deliver.ts"]);
  check("no console errors (closable)", p.errors.slice(0, 2), []);

  /* fill (example 4): the root takes its container's height, the panel the rest, and scrolls */
  await open(fw, 4);
  check("fill: the root is as tall as its box and the panel takes the rest, scrolling inside itself", await p.eval(`(()=>{const r=document.querySelector("#stage [data-slot=tabs]"),l=r.querySelector("[data-slot=tabs-list]"),c=[...r.querySelectorAll("[data-slot=tabs-content]")].find((e)=>!e.hidden);const a=r.getBoundingClientRect(),b=c.getBoundingClientRect();return [Math.round(a.height), Math.abs(b.bottom-a.bottom)<0.5, Math.abs(b.top-l.getBoundingClientRect().bottom)<0.5, c.scrollHeight>c.clientHeight, getComputedStyle(c).overflowY]})()`), [160, true, true, true, "auto"]);

  /* attached (example 5): browser tabs; the selected tab is the panel's surface and joins it */
  await open(fw, 5);
  const surf = await p.eval(`(()=>{const d=document.createElement("div");d.style.backgroundColor="var(--fndn-surface)";document.body.append(d);const v=getComputedStyle(d).backgroundColor;d.remove();return v})()`);
  check("attached: no indicator; the selected tab is the surface, the others clear; its panel the same surface", await p.eval(`(()=>{const i=document.querySelector("#stage [data-slot=tabs-indicator]");const t=[...document.querySelectorAll("#stage [data-slot=tabs-trigger]")];const sel=t.find((e)=>e.getAttribute("aria-selected")==="true");const c=[...document.querySelectorAll("#stage [data-slot=tabs-content]")].find((e)=>!e.hidden);return [getComputedStyle(i).display, getComputedStyle(sel).backgroundColor, getComputedStyle(t[0]).backgroundColor, getComputedStyle(c).backgroundColor]})()`), ["none", surf, "rgba(0, 0, 0, 0)", surf]);
  check("attached: the selected tab joins its panel (no gap, no line), 28px at sm, rounded top, feet drawn", await p.eval(`(()=>{const sel=document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]');const c=[...document.querySelectorAll("#stage [data-slot=tabs-content]")].find((e)=>!e.hidden);const a=sel.getBoundingClientRect(),b=c.getBoundingClientRect();const cs=getComputedStyle(sel);return [Math.abs(b.top-a.bottom)<0.5, Math.round(a.height), cs.borderTopLeftRadius, cs.borderBottomLeftRadius, cs.boxShadow==="none", getComputedStyle(sel,"::after").display]})()`), [true, 28, "6px", "0px", true, "block"]);
  check("attached: a favicon is an image with an empty alt inside the tab's icon part", await p.eval(`(()=>{const i=document.querySelector("#stage [data-slot=tabs-trigger] [data-slot=tabs-icon]");return [i.getAttribute("aria-hidden"), i.firstElementChild.tagName, i.firstElementChild.getAttribute("alt"), Math.round(i.getBoundingClientRect().width)]})()`), ["true", "IMG", "", 14]);
  check("attached: tabs share the strip (240px at most), shrinking together before it scrolls", await p.eval(`(()=>{const l=document.querySelector("#stage [data-slot=tabs-list]");const w=[...l.querySelectorAll(":scope>[data-slot=tabs-tab]")].map((e)=>Math.round(e.getBoundingClientRect().width));return [w.every((x)=>x<=240&&x===w[0]), l.scrollWidth<=l.clientWidth+1]})()`), [true, true]);
  { const t = await p.rect('#stage [data-slot=tabs-tab]:nth-child(2) [data-slot=tabs-trigger]'); await p.click(t.cx - 20, t.cy); await sleep(40); }
  check("attached: a press does not scale the joined tab; the surface moves at once", await p.eval(`(()=>{const sel=document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]');return [sel.textContent.trim(), getComputedStyle(sel).transform, getComputedStyle(sel).backgroundColor]})()`), ["Deploys · web-app", "none", surf]);
  await open(fw, 5, "&theme=dark");
  check("attached, dark: the selected tab has a lit top edge (1px line-strong inset), the others none", await p.eval(`(()=>{const d=document.createElement("div");d.style.color="var(--fndn-line-strong)";document.querySelector("#stage").append(d);const c=getComputedStyle(d).color;d.remove();const t=[...document.querySelectorAll("#stage [data-slot=tabs-trigger]")];const sel=t.find((e)=>e.getAttribute("aria-selected")==="true"),other=t.find((e)=>e!==sel);const sh=getComputedStyle(sel).boxShadow;return [sh.includes("inset")&&sh.includes(c)&&sh.includes("0px 1px 0px"), getComputedStyle(other).boxShadow]})()`), [true, "none"]);
  await open(fw, 5, "&data=worst");
  check("attached worst case (xs, six files in 300px): 24px tabs shrink to their minimum, then the strip scrolls; labels cut with a title", await p.eval(`(()=>{const l=document.querySelector("#stage [data-slot=tabs-list]");const t=l.querySelector("[data-slot=tabs-trigger]");const lab=[...l.querySelectorAll("[data-slot=tabs-label]")][1];return [Math.round(t.getBoundingClientRect().height), l.scrollWidth>l.clientWidth, lab.title.length>40, getComputedStyle(lab).textOverflow]})()`), [24, true, true, "ellipsis"]);

  /* attached arrivals and departures make room (examples 5 shrink, 6 fit). The harness plays the
   * caller: items are replaced through the mounted example, a tab that asks to close is dropped */
  const FIT = 6;
  const fitItems = FIXTURE.examples[FIT].props.items;
  const outer = (v) => `(document.querySelector('#stage [data-slot=tabs-trigger][data-value="${v}"]')?.closest("[data-slot=tabs-tab]"))`;
  /* add a tab after the first paint: its width two frames later, then once settled */
  /* add a tab after the first paint: its width on every frame for 450ms, then once settled. Some frame
   * must show it part-way (a fixed "two frames later" sample is flaky under load: two slow frames
   * can land before the transition starts or after it ends) */
  const arrive = (items, v) => p.eval(`(async()=>{const m=window.__harnessMounted;const f=()=>new Promise((r)=>requestAnimationFrame(()=>r()));await m.update({items:${JSON.stringify(items)}});const seen=[];const t0=performance.now();while(performance.now()-t0<450){await f();const e=${outer(v)};seen.push(e?e.getBoundingClientRect().width:0);}await new Promise((r)=>setTimeout(r,200));const b=${outer(v)}.getBoundingClientRect().width;return [seen.find((w)=>w>b*0.05&&w<b*0.9)??0,b];})()`);
  const dropOnClose = () => p.eval(`(()=>{const m=window.__harnessMounted;let items=${JSON.stringify(fitItems)};const drop=(v)=>{items=items.filter((i)=>i.value!==v);m.update({items})};m.update(${fw === "svelte" ? "{onclose:drop,onvaluechange:(v)=>m.update({value:v})}" : "{onClose:drop}"})})()`);
  await open(fw, FIT);
  check("fit: no transition runs on the first paint", await p.eval(`document.getAnimations().filter((a)=>a.effect?.target?.closest?.("#stage [data-slot=tabs]")).length`), 0);
  check("fit: each tab as wide as its title (never cut), so widths differ; the strip scrolls", await p.eval(`(()=>{const l=document.querySelector("#stage [data-slot=tabs-list]");const labs=[...l.querySelectorAll("[data-slot=tabs-label]")];const w=[...l.querySelectorAll(":scope>[data-slot=tabs-tab]")].map((e)=>Math.round(e.getBoundingClientRect().width));return [labs.every((e)=>e.scrollWidth<=e.clientWidth+0.5), new Set(w).size>2, l.scrollWidth>l.clientWidth]})()`), [true, true, true]);
  await sleep(200);
  { const [a, b] = await arrive([...fitItems, { value: "deliver.ts", label: "deliver.ts", content: "deliver.ts" }], "deliver.ts");
    check("fit: a tab added after the first paint opens its width (some frame part-way, whole once settled)", [a > 0 && a < b * 0.9, b > 60], [true, true]); }
  await open(fw, 5);
  await sleep(200);
  { const items5 = FIXTURE.examples[5].props.items;
    const [a, b] = await arrive([...items5, { value: "new", label: "New tab", content: "New tab" }], "new");
    check("shrink: a new tab opens its width instead of appearing whole in one frame", [a > 0 && a < b * 0.9, b >= 96], [true, true]); }
  /* departures: a pointer close closes the room before the caller drops the tab */
  await open(fw, FIT);
  await dropOnClose(); await sleep(250);
  { const w0 = await p.eval(`${outer("retry-policy.ts")}.getBoundingClientRect().width`);
    await p.clickSel(`#stage [data-slot=tabs-tab]:nth-child(4) [data-slot=tabs-close]`);
    const mid = await p.eval(`(async()=>{const f=()=>new Promise((r)=>requestAnimationFrame(()=>r()));await f();await f();await f();const e=${outer("retry-policy.ts")};return e?[Math.round(e.getBoundingClientRect().width),getComputedStyle(e).pointerEvents]:null})()`);
    await sleep(450);
    check("pointer close: the tab's room closes over a few frames (no presses meanwhile), then it is dropped", [mid && mid[0] > 0 && mid[0] < w0 - 4, mid?.[1], await tabsNow().then((t) => t.includes("retry-policy.ts"))], [true, "none", false]); }
  await p.eval(`document.querySelector('#stage [data-slot=tabs-trigger][aria-selected="true"]').focus()`); await sleep(60);
  const kbdFocus = await focused();
  await p.key("Delete");
  await sleep(40);
  check("keyboard close (Delete): instant, the focused tab is gone at once", [kbdFocus, await tabsNow().then((t) => t.includes(kbdFocus))], ["rate-limit.ts", false]);
  /* reduced motion: no width motion, only the fade */
  await p.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await open(fw, FIT); await sleep(200);
  { const [a, b] = await arrive([...fitItems, { value: "deliver.ts", label: "deliver.ts", content: "deliver.ts" }], "deliver.ts");
    check("reduced motion: the new tab takes its whole width at once (no frame part-way; only its opacity fades)", [a, b > 60], [0, true]); }
  await p.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  check("no console errors (arrivals)", p.errors.slice(0, 2), []);

  /* label part: one line that truncates, full text in title; colour hover, token radius */
  await open(fw, 0);
  check("each tab holds a label part with its text as title", await p.eval(`[...document.querySelectorAll("#stage [data-slot=tabs-trigger]")].map((t)=>{const l=t.querySelector(":scope > [data-slot=tabs-label]");return l?[l.textContent.trim(),l.title]:null})`), [["Chat", "Chat"], ["Notes", "Notes"], ["Files", "Files"]]);
  await p.eval(`(()=>{const t=document.querySelector("#stage [data-slot=tabs-trigger]");t.style.maxWidth="40px";t.querySelector("[data-slot=tabs-label]").textContent="Supplier records and changes"})()`); await sleep(100);
  check("a long label truncates at the end inside its tab, on one line", await p.eval(`(()=>{const t=document.querySelector("#stage [data-slot=tabs-trigger]"),l=t.querySelector("[data-slot=tabs-label]");const cs=getComputedStyle(l);return [cs.textOverflow, cs.whiteSpace, l.scrollWidth > l.clientWidth, t.getBoundingClientRect().height]})()`), ["ellipsis", "nowrap", true, 26]);
  check("pill: indicator radius is the chip token (6px); tabs hover by colour, not opacity", await p.eval(`(()=>{const i=document.querySelector("#stage [data-slot=tabs-indicator]"),t=document.querySelectorAll("#stage [data-slot=tabs-trigger]");return [getComputedStyle(i).borderTopLeftRadius, getComputedStyle(t[1]).opacity, getComputedStyle(t[1]).transitionProperty.includes("opacity")]})()`), ["6px", "1", false]);

  } catch (e) { failed++; checks.push(`✗ threw: ${String(e.message).split("\n")[0]}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
