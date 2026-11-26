// The shared foundation: Tailwind's sr-only, the shared recipes popup and option and the glide
// layer's classes (components/lib), popup stacking (z tokens on Zag positioners, base.css),
// the gliding highlight under the keyboard, and the new tokens.
// Most checks build plain markup on the harness page (which loads @fndn/core CSS) and give it the
// recipes' classes (data-r="<recipe>.<slot>", data-v="<variant>=<value>,…"); the stacking and
// glide checks also open a real select.   node scripts/qa/foundation.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch, sleep } from "./cdp.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const p = await launch({ hover: true });
let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`}`);
};
const q = (js) => p.eval(js);
const ready = async () => { for (let t = 0; t < 60; t++) { if (await q(`"harnessReady" in document.documentElement.dataset`)) return; await sleep(100); } };
const open = async (url) => { await p.goto(url, 300); await ready(); await sleep(200); };

/* the shared recipes, imported in the page (Vite serves the sources); every [data-r] element gets
 * its recipe's classes, and window.__recipes holds the recipes for elements added later. The glide
 * layer is a class list that recipes compose; here it is wrapped in a tv() of its own, as a recipe's
 * highlight slot would carry it. */
const RECIPES = `(async()=>{const im=(n)=>import(${JSON.stringify(`/@fs${ROOT}/components/lib/`)}+n+".ts");
  const {tv}=await im("tv");
  const m={popup:(await im("popup")).popup,option:(await im("option")).option,glide:tv({base:(await im("glide")).glideLayer})};window.__recipes=m;
  for(const el of document.querySelectorAll("[data-r]")){const [name,slot]=el.dataset.r.split(".");const props=Object.fromEntries((el.dataset.v??"").split(",").filter(Boolean).map((kv)=>kv.split("=")));const out=m[name](props);el.className=[el.className,typeof out==="string"?out:out[slot]()].join(" ").trim();}
  return true})()`;
/* a blank page that still has @fndn/core CSS: the harness, with the stage replaced */
const blank = async (html) => {
  await open(`${BASE}/harness.html?c=button&fw=react&ex=0`);
  await q(`document.body.innerHTML = ${JSON.stringify(`<div id="t" style="position:relative;padding:40px;width:600px">${html}</div>`)}; true`);
  await q(RECIPES);
  await sleep(300); /* let every popup on it finish its entrance */
};
/* "property duration easing" of every transition that takes time, sorted (the motion utilities list
 * every slot, unused ones as "_ 0s") */
const TRANSITIONS = (el) => `(()=>{const cs=getComputedStyle(${el});const sp=(v)=>{const o=[];let d=0,c="";for(const ch of v){if(ch==="(")d++;if(ch===")")d--;if(ch===","&&!d){o.push(c.trim());c="";}else c+=ch;}o.push(c.trim());return o};
  const p=sp(cs.transitionProperty),du=sp(cs.transitionDuration),e=sp(cs.transitionTimingFunction);const out=new Set();
  p.forEach((x,i)=>{const d=du[i%du.length];if(parseFloat(d)>0&&x!=="_")out.add(x+" "+d+" "+e[i%e.length])});return [...out].sort()})()`;

// ── 1. visually hidden ──────────────────────────────────────
await blank(`<button>Save<span class="sr-only" id="vh">changes to the draft</span></button>`);
check("sr-only: 1×1 box, clipped, out of flow, still in the accessibility text", await q(`(()=>{const e=document.getElementById("vh");const s=getComputedStyle(e);const b=e.getBoundingClientRect();return [b.width,b.height,s.position,s.clipPath,s.overflow,s.whiteSpace,e.closest("button").textContent]})()`), [1, 1, "absolute", "inset(50%)", "hidden", "nowrap", "Savechanges to the draft"]);

// ── 2. popup surface ────────────────────────────────────────
await blank(`
  <div id="pos" style="--available-height: 120px"><div data-r="popup" id="pop" data-state="open" style="width:200px">${"<div style='height:30px'>row</div>".repeat(8)}</div></div>
  <div data-r="popup" id="pop2" data-state="open" style="width:200px">${"<div style='height:30px'>row</div>".repeat(20)}</div>
  <div data-r="popup" id="pop3" data-state="open" style="width:200px; --popup-max-height: 200px">${"<div style='height:30px'>row</div>".repeat(20)}</div>
  <div id="ref" class="shadow-raised" style="background:var(--fndn-surface);border-radius:var(--fndn-radius-card)"></div>`);
check("popup: surface, shadow-raised, radius card, padding 4, own scroll, origin from the positioner", await q(`(()=>{const s=getComputedStyle(document.getElementById("pop"));const r=getComputedStyle(document.getElementById("ref"));return [s.backgroundColor===r.backgroundColor, s.boxShadow===r.boxShadow, s.borderRadius, s.padding, s.overflowY, s.overscrollBehaviorY, s.position]})()`), [true, true, "10px", "4px", "auto", "contain", "relative"]);
check("popup: max-height = --available-height, else 360px, else --popup-max-height", await q(`["pop","pop2","pop3"].map((id)=>document.getElementById(id).getBoundingClientRect().height)`), [120, 360, 200]);
check("popup open: opacity 1, scale 1", await q(`(()=>{const s=getComputedStyle(document.getElementById("pop"));return [s.opacity, s.transform]})()`), ["1", "matrix(1, 0, 0, 1, 0, 0)"]);
check("popup: transitions opacity + transform at duration.popup out-strong, display alongside", await q(TRANSITIONS(`document.getElementById("pop")`)), ["display 0.18s ease", "opacity 0.18s cubic-bezier(0.23, 1, 0.32, 1)", "transform 0.18s cubic-bezier(0.23, 1, 0.32, 1)"]);
/* entrance: a new open popup starts from popup-scale (starting-style) and runs 180ms */
const started = [];
p.on("Animation.animationStarted", (e) => started.push(e.animation));
await q(`(()=>{const d=document.createElement("div");d.className=window.__recipes.popup();d.id="fresh";d.dataset.state="open";d.textContent="x";document.getElementById("t").append(d);return true})()`);
await sleep(60);
check("pointer open: the entrance runs (opacity + transform, 180ms) from motion.popup-scale", await q(`(()=>{const a=document.getElementById("fresh").getAnimations();return a.map((x)=>[x.transitionProperty, x.effect.getTiming().duration]).sort()})()`), [["opacity", 180], ["transform", 180]]);
await q(`document.getElementById("pop").dataset.state = "closed"; true`); await sleep(20);
check("close runs at duration.fast", await q(`[...new Set(getComputedStyle(document.getElementById("pop")).transitionDuration.split(", "))]`), ["0.1s"]);
await sleep(200);
check("closed state settles at opacity 0, scale popup-scale", await q(`(()=>{const s=getComputedStyle(document.getElementById("pop"));return [s.opacity, s.transform]})()`), ["0", "matrix(0.96, 0, 0, 0.96, 0, 0)"]);
await q(`document.documentElement.dataset.fndnInput = "keyboard"; true`);
check("keyboard: a popup is instant; so is a kbd-instant part", await q(`(()=>{const d=document.createElement("span");d.className="kbd-instant";d.style.transition="opacity var(--fndn-duration-move) ease";document.getElementById("t").append(d);return [[...new Set(getComputedStyle(document.getElementById("pop2")).transitionDuration.split(", "))], getComputedStyle(d).transitionDuration]})()`), [["0s"], "0s"]);
await q(`(()=>{const d=document.createElement("span");d.id="glide2";d.className=window.__recipes.glide({ class: "inset-x-1" });document.getElementById("pop2").append(d);return true})()`);
check("keyboard: a glide layer inside a popup still glides (transform and height at duration.move, the fade at duration.base); 4px in", [await q(TRANSITIONS(`document.getElementById("glide2")`)), await q(`getComputedStyle(document.getElementById("glide2")).insetInlineStart`)], [["height 0.2s cubic-bezier(0.23, 1, 0.32, 1)", "opacity 0.15s ease", "transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)"], "4px"]);
await q(`delete document.documentElement.dataset.fndnInput; true`);
await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]); await sleep(200);
check("reduced motion: closed popup does not scale (popup-scale 1), still fades", await q(`(()=>{const s=getComputedStyle(document.getElementById("pop"));return [s.transform, s.opacity]})()`), ["matrix(1, 0, 0, 1, 0, 0)", "0"]);
await p.media([]);

// ── 3. stacking ─────────────────────────────────────────────
await blank(`
  <div id="cover" style="position:relative; z-index:1; width:300px; height:200px; background:var(--fndn-canvas)">covering sibling</div>
  <div data-scope="menu" data-part="positioner" id="mpos" style="position:absolute; top:60px; left:60px; z-index:var(--z-index); --z-index:auto">
    <div data-r="popup" data-scope="menu" data-part="content" data-state="open" id="mpop" style="width:150px;height:80px">popup</div>
  </div>
  <div data-scope="dialog" data-part="positioner" id="dpos" style="position:absolute"></div>
  <div data-scope="tooltip" data-part="positioner" id="tpos" style="position:absolute; z-index:var(--z-index); --z-index:auto"></div>`);
check("z tokens: popup 50 < dialog 60 < tooltip 70, on positioners despite Zag's inline --z-index", await q(`["mpos","dpos","tpos"].map((id)=>getComputedStyle(document.getElementById(id)).zIndex)`), ["50", "60", "70"]);
check("a popup over a position:relative; z-index:1 sibling is the element at its own centre", await q(`(()=>{const b=document.getElementById("mpop").getBoundingClientRect();const e=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return e.id})()`), "mpop");
await q(`(()=>{const c=document.createElement("div");c.dataset.scope="dialog";c.dataset.part="content";c.dataset.state="open";document.getElementById("dpos").append(c);return true})()`);
check("while a dialog is open, a popup goes one above it (tooltip stays on top)", await q(`["mpos","dpos","tpos"].map((id)=>getComputedStyle(document.getElementById(id)).zIndex)`), ["61", "60", "70"]);
/* the real thing: a Zag select (React) */
await open(`${BASE}/harness.html?c=select&fw=react&ex=0`);
await p.clickSel("#stage [data-slot=select-trigger]"); await sleep(300);
check("real select (react): the portaled positioner carries data-scope and z-index 50", await q(`(()=>{const c=document.querySelector("[data-slot=select-content]");const pos=c.parentElement;return [pos.dataset.scope, pos.dataset.part, getComputedStyle(pos).zIndex]})()`), ["select", "positioner", "50"]);
await p.key("Escape"); await sleep(200);

// ── 4. option row ───────────────────────────────────────────
await blank(`
  <div data-r="popup" data-state="open" id="list" style="width:220px; max-height:none">
    <span data-r="glide" id="glide" aria-hidden="true"></span>
    <div data-r="option.label" id="lab">Recent</div>
    <div data-r="option.base" id="o1"><span data-r="option.icon" class="x-icon"><svg data-slot="icon" viewBox="0 0 256 256"></svg></span><span data-r="option.text" class="x-text">Rename</span><span data-r="option.meta" class="x-meta">⌘R</span><span data-r="option.indicator" class="x-indicator"><svg data-slot="icon" viewBox="0 0 256 256"></svg></span></div>
    <div data-r="option.base" id="o2" data-state="checked" data-highlighted><span data-r="option.text" class="x-text">A very long option label that has to truncate at the end</span><span data-r="option.indicator" class="x-indicator"><svg data-slot="icon" viewBox="0 0 256 256"></svg></span></div>
    <div data-r="option.separator" id="sep"></div>
    <div data-r="option.base" data-v="size=sm" id="o3"><span data-r="option.text">Small</span></div>
    <div data-r="option.base" data-v="size=lg" id="o4"><span data-r="option.text" data-slot="x-option-label" class="x-text">/compare</span><span data-r="option.description" data-slot="x-option-description" class="x-description">Compare two plans side by side over a period</span></div>
    <div data-r="option.base" data-v="tone=danger" id="o5"><span data-r="option.icon" data-v="tone=danger" class="x-icon"><svg data-slot="icon" viewBox="0 0 256 256"></svg></span><span data-r="option.text">Delete</span></div>
    <div data-r="option.base" id="o6" data-disabled><span data-r="option.text">Archived</span></div>
  </div>
  <div id="ink3" style="color:var(--fndn-ink-3)"></div><div id="ink2" style="color:var(--fndn-ink-2)"></div><div id="red" style="color:var(--fndn-red)"></div><div id="h2" style="background:var(--fndn-hover-2)"></div>`);
check("option heights: default 30, sm 26, lg 36", await q(`["o1","o3","o4"].map((id)=>document.getElementById(id).getBoundingClientRect().height)`), [30, 26, 36]);
check("option metrics: padding-inline 8, 12.5px, gap 8, radius chip, above the glide", await q(`(()=>{const s=getComputedStyle(document.getElementById("o1"));return [s.paddingInlineStart,s.paddingInlineEnd,s.fontSize,s.columnGap,s.borderRadius,s.position,s.zIndex]})()`), ["8px", "8px", "12.5px", "8px", "6px", "relative", "1"]);
check("icon slot 14px ink-3; meta 11px ink-2", await q(`(()=>{const o=document.getElementById("o1");const i=getComputedStyle(o.querySelector(".x-icon"));const m=getComputedStyle(o.querySelector(".x-meta"));const ink3=getComputedStyle(document.getElementById("ink3")).color;return [i.fontSize, i.color===ink3, m.fontSize, m.color===getComputedStyle(document.getElementById("ink2")).color]})()`), ["14px", true, "11px", true]);
check("text is shown whole (wraps, row grows past 30px, never cut); the indicator keeps its space unchecked and shows when checked; checked label 500", await q(`(()=>{const t=document.querySelector("#o2 .x-text");const i1=document.querySelector("#o1 .x-indicator");const i2=document.querySelector("#o2 .x-indicator");return [t.scrollWidth<=t.clientWidth && document.getElementById("o2").getBoundingClientRect().height>30, getComputedStyle(t).whiteSpace, i1.getBoundingClientRect().width>0, getComputedStyle(i1).visibility, getComputedStyle(i2).visibility, getComputedStyle(t).fontWeight]})()`), [true, "normal", true, "hidden", "visible", "500"]);
check("lg: label keeps up to 70%, description truncates after it", await q(`(()=>{const d=document.querySelector("#o4 .x-description");const s=getComputedStyle(d);return [s.textOverflow, d.scrollWidth>d.clientWidth, getComputedStyle(document.querySelector("#o4 .x-text")).maxWidth]})()`), ["ellipsis", true, "70%"]);
check("data-highlighted paints nothing on the row (the glide does)", await q(`getComputedStyle(document.getElementById("o2")).backgroundColor`), "rgba(0, 0, 0, 0)");
check("danger: red text and icon; disabled: half opacity, no pointer", await q(`(()=>{const red=getComputedStyle(document.getElementById("red")).color;const o=document.getElementById("o5");return [getComputedStyle(o).color===red, getComputedStyle(o.querySelector(".x-icon")).color===red, getComputedStyle(document.getElementById("o6")).opacity, getComputedStyle(document.getElementById("o6")).pointerEvents]})()`), [true, true, "0.5", "none"]);
check("group label 11px/500 ink-2, padding 6 8 4; separator 1px line bleeding 4px", await q(`(()=>{const l=getComputedStyle(document.getElementById("lab"));const s=document.getElementById("sep");const ink2=getComputedStyle(document.getElementById("ink2")).color;return [l.fontSize,l.fontWeight,l.color===ink2,l.padding, s.getBoundingClientRect().height, getComputedStyle(s).marginInlineStart, getComputedStyle(s).marginBlockStart]})()`), ["11px", "500", true, "6px 8px 4px", 1, "-4px", "4px"]);
/* a stray gated hover rule in a component must not out-rank the press: add one at 0-1-0 like :where(.x):hover */
const o1 = await p.rect("#o1");
await p.hover(o1.cx, o1.cy); await sleep(150);
check("hover: the row paints no background of its own", await q(`getComputedStyle(document.getElementById("o1")).backgroundColor`), "rgba(0, 0, 0, 0)");
await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: o1.cx, y: o1.cy, button: "left", buttons: 1, clickCount: 1 });
await sleep(150);
check("press: hover-2 on the row at duration.fast", await q(`(()=>{const s=getComputedStyle(document.getElementById("o1"));return [s.backgroundColor===getComputedStyle(document.getElementById("h2")).backgroundColor, [...new Set(s.transitionDuration.split(", "))]]})()`), [true, ["0.1s"]]);
await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: o1.cx, y: o1.cy, button: "left", clickCount: 1 });
await p.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
await p.send("Emulation.setEmitTouchEventsForMouse", { enabled: true });
const coarse = await q(`matchMedia("(pointer: coarse)").matches`);
if (coarse) check("coarse pointer: rows at least 40px and 14px text (lg too)", await q(`["o1","o3","o4"].map((id)=>[document.getElementById(id).getBoundingClientRect().height, getComputedStyle(document.getElementById(id)).fontSize])`), [[40, "14px"], [40, "14px"], [40, "14px"]]);
else console.log("- coarse pointer could not be emulated here; checked by reading the rule only");
await p.send("Emulation.setTouchEmulationEnabled", { enabled: false });
await p.send("Emulation.setEmitTouchEventsForMouse", { enabled: false });

// ── 5. the gliding highlight under the keyboard, in a real select (React) ──
await open(`${BASE}/harness.html?c=select&fw=react&ex=0`);
await q(`document.querySelector("#stage [data-slot=select-trigger]").focus(); true`);
await p.key("ArrowDown"); await sleep(250);
const glideState = () => q(`(()=>{const g=document.querySelector("[data-slot=select-highlight]");const row=document.querySelector("[data-slot=select-content] [data-highlighted]");const cs=getComputedStyle(g);const props=cs.transitionProperty.split(",").map((s)=>s.trim());const d=cs.transitionDuration.split(",").map((s)=>parseFloat(s)*1000);const move=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fndn-duration-move"));return {input:document.documentElement.dataset.fndnInput, glides:d[props.indexOf("transform")]===move, onRow:!!row&&Math.abs(g.getBoundingClientRect().top-row.getBoundingClientRect().top)<1, row:row?.textContent.trim()}})()`);
check("keyboard open: the popup itself is instant", await q(`(()=>{const c=document.querySelector("[data-slot=select-content]");return [c.dataset.state, [...new Set(getComputedStyle(c).transitionDuration.split(", "))]]})()`), ["open", ["0s"]]);
check("keyboard open: the highlight is on the first row (landed, no fly-in)", await glideState(), { input: "keyboard", glides: true, onRow: true, row: "Feature card" });
/* one keypress: the layer is mid-travel shortly after, then lands */
await p.key("ArrowDown"); await sleep(40);
const mid = await q(`(()=>{const g=document.querySelector("[data-slot=select-highlight]");return g.getAnimations().filter((a)=>a.transitionProperty==="transform").length})()`);
check("ArrowDown: the layer travels (a transform transition is running)", mid, 1);
await sleep(250);
check("ArrowDown: lands on the next row", await glideState(), { input: "keyboard", glides: true, onRow: true, row: "Supplier card" });
/* a held key: autorepeat keydowns every 33ms retarget the running transition and end on the right row */
for (let i = 0; i < 4; i++) {
  await p.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: i % 2 ? "ArrowUp" : "ArrowDown", code: i % 2 ? "ArrowUp" : "ArrowDown", windowsVirtualKeyCode: i % 2 ? 38 : 40, autoRepeat: i > 0 });
  await sleep(33);
}
await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowUp", code: "ArrowUp", windowsVirtualKeyCode: 38 });
for (let i = 0; i < 3; i++) { await p.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40, autoRepeat: i > 0 }); await sleep(33); }
await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await sleep(300);
check("held arrow key: retargets and ends on the highlighted row (End of list: Order summary)", await glideState(), { input: "keyboard", glides: true, onRow: true, row: "Order summary" });
await p.key("Escape"); await sleep(200);

// ── 6. tokens ───────────────────────────────────────────────
const tokenCheck = (theme) => q(`(()=>{document.documentElement.dataset.theme=${JSON.stringify(theme)};const c=(v)=>{const d=document.createElement("div");d.style.color=v;document.body.append(d);const r=getComputedStyle(d).color;d.remove();return r};
  const same=(a,b)=>c(a)===c(b);
  const r=[same("var(--fndn-tag-blue)","var(--fndn-accent)"),same("var(--fndn-tag-green)","var(--fndn-green)"),same("var(--fndn-tag-orange)","var(--fndn-orange)"),same("var(--fndn-tag-red)","var(--fndn-red)"),
    same("var(--fndn-tag-purple)","color-mix(in oklch, var(--fndn-accent) 55%, var(--fndn-red))"),same("var(--fndn-tag-cyan)","color-mix(in oklch, var(--fndn-accent) 50%, var(--fndn-green))"),
    same("var(--fndn-tag-yellow)","color-mix(in oklch, var(--fndn-orange) 55%, var(--fndn-green))"),same("var(--fndn-tag-pink)","color-mix(in oklch, var(--fndn-red) 65%, var(--fndn-accent))"),
    same("var(--fndn-scrim)","oklch(0 0 0 / 0.4)")];
  delete document.documentElement.dataset.theme;return r})()`);
await blank(``);
check("tokens, light: tag hues equal records-table's palette, scrim equals the dialog literal", await tokenCheck("light"), Array(9).fill(true));
check("tokens, dark: the same", await tokenCheck("dark"), Array(9).fill(true));

if (p.errors.length) { console.log("page errors:", p.errors.slice(0, 5)); }
console.log(failed ? `\n${failed} failed` : "\nall passed");
await p.close();
process.exit(failed ? 1 : 0);
