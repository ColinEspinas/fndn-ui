// Toggle Group: Ark's toggle-group of Toggles (each item the Toggle's look, compared with a real
// Toggle; pressed hover-2 for aria-checked and aria-pressed alike), one at most (radiogroup,
// deselectable) and multiple (group, aria-pressed), roving focus (one tab stop, arrows, Home / End,
// disabled items skipped), Space / Enter, keyboard changes instant, icon-only items named by their
// Tooltips, vertical, disabled, worst cases (wrap, cut labels with a title), right-to-left, dark.
//   node components/toggle-group/toggle-group.test.mjs [react …]   (default: the spec's targets)
const C = "toggle-group";
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
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const S = (part) => `#stage [data-slot=${part}]`;
const ITEM = S("toggle-group-item");
const LOOK = ["height", "paddingInlineStart", "paddingInlineEnd", "fontSize", "fontWeight", "lineHeight", "borderRadius", "boxShadow", "backgroundColor", "color"];
const look = (sel, n = 0) => q(`(()=>{const cs=getComputedStyle(document.querySelectorAll(${JSON.stringify(sel)})[${n}]);return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);
/* per item: pressed (aria-checked or aria-pressed; data-state is the Tooltip's on an item it wraps) */
const on = () => q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((i)=>i.getAttribute("aria-checked")==="true"||i.getAttribute("aria-pressed")==="true"?1:0).join("")`);
const fills = () => q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((i)=>getComputedStyle(i).backgroundColor)`);
const focused = () => q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].indexOf(document.activeElement)`);
const away = async () => { await p.hover(1200, 860); await sleep(300); };
const at = async (n) => q(`(()=>{const b=document.querySelectorAll(${JSON.stringify(ITEM)})[${n}].getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()`);

async function run(fw, check) {
  await open(fw, 0);
  const ink = { hover2: await token("--fndn-hover-2"), surface: await token("--fndn-surface"), ink: await token("--fndn-ink", "color"), ink3: await token("--fndn-ink-3", "color") };
  check("one at most: role=radiogroup named \"Show\"; items are radios, the second checked",
    await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("toggle-group"))});const i=[...document.querySelectorAll(${JSON.stringify(ITEM)})];return [r.getAttribute("role"),r.getAttribute("aria-label"),i.map((e)=>e.getAttribute("role")).join(),i.map((e)=>e.getAttribute("aria-checked")).join(),i[0].querySelector("[data-slot=toggle-group-label]")?.textContent]})()`),
    ["radiogroup", "Show", "radio,radio,radio", "false,true,false", "All"]);
  const restLook = await look(ITEM, 0), onLook = await look(ITEM, 1);
  const gap = await q(`(()=>{const i=[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((e)=>e.getBoundingClientRect());return Math.round(i[1].left-i[0].right)})()`);
  await open(fw, 0, "", "toggle");
  const toggleRest = await look("#stage [data-slot=toggle]");
  await open(fw, 1, "", "toggle");
  const toggleOn = await look("#stage [data-slot=toggle]");
  /* the outline look is joined like a button group: the first item keeps its outer corners only */
  const radiusAt = restLook.findIndex((v) => / 0px 0px /.test(String(v)));
  const skip = (_, k) => k !== 1 && k !== 2 && k !== radiusAt;
  check("an item at rest is the Toggle (outline md), property for property but its joined corners", restLook.filter(skip), toggleRest.filter(skip));
  check("joined: the first item keeps its outer corners, the inner ones are square", restLook[radiusAt], "999px 0px 0px 999px");
  check("a pressed item (aria-checked) is the pressed Toggle: hover-2", [onLook[8], onLook[9]], [toggleOn[8], toggleOn[9]]);
  check("outline items are joined: one pixel between them, the join's hairline", gap, 1);

  /* pointer */
  await open(fw, 0);
  let xy = await at(2);
  await p.click(xy[0], xy[1]); await sleep(300);
  check("click the third: it is pressed, the second released (one at most); hover-2 while hovered", [await on(), (await fills())[2]], ["001", ink.hover2]);
  await away();
  check("pointer gone: still hover-2", (await fills())[2], ink.hover2);
  await p.click(xy[0], xy[1]); await away();
  check("a second click releases it (deselectable): nothing pressed, surface", [await on(), (await fills())[2]], ["000", ink.surface]);
  check("a pointer change fades (the Toggle's colour timing)", await q(`getComputedStyle(document.querySelectorAll(${JSON.stringify(ITEM)})[2]).transitionDuration.split(", ").some((d)=>d!=="0s")`), true);

  /* keyboard: one tab stop, arrows move focus, Space presses, instantly */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab"); await sleep(60);
  check("Tab enters the group on an item; only one item is in the tab order", [await focused() >= 0, await q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].filter((i)=>i.tabIndex===0).length`)], [true, 1]);
  await p.key("Home"); check("Home: the first item", await focused(), 0);
  await p.key("ArrowRight"); await p.key("ArrowRight"); check("Arrow Right ×2: the third; focus moves, nothing is pressed by it", [await focused(), await on()], [2, "010"]);
  await p.key("ArrowRight"); check("Arrow Right on the last wraps to the first", await focused(), 0);
  await p.key("End"); await p.key(" "); await sleep(30);
  check("Space presses the focused item, instantly (kbd-instant)", [await on(), (await fills())[2], await q(`getComputedStyle(document.querySelectorAll(${JSON.stringify(ITEM)})[2]).transitionDuration.split(", ").every((d)=>d==="0s")`)], ["001", ink.hover2, true]);
  await p.key("Enter"); await sleep(30);
  check("Enter releases it", await on(), "000");
  await p.key("Tab");
  check("Tab leaves the group", await focused(), -1);

  /* multiple, ghost, icon-only, muted */
  await open(fw, 1);
  check("multiple: role=group, items toggle buttons (aria-pressed), the first pressed",
    await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("toggle-group"))});const i=[...document.querySelectorAll(${JSON.stringify(ITEM)})];return [r.getAttribute("role"),i.map((e)=>e.getAttribute("aria-pressed")).join(),i.some((e)=>e.hasAttribute("aria-checked"))]})()`),
    ["group", "true,false,false", false]);
  const sq = await p.rect(ITEM);
  check("square xs: 28×28; named by the tooltip (aria-label); muted ink-3 at rest, ink pressed",
    [sq.w, sq.h, await q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((i)=>i.getAttribute("aria-label")).join()`), await q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((i)=>getComputedStyle(i).color)`)],
    [28, 28, "Bold,Italic,Underline", [ink.ink, ink.ink3, ink.ink3]]);
  xy = await at(1);
  await p.hover(xy[0] - 2, xy[1]); await p.hover(xy[0], xy[1]); await sleep(900);
  check("hovering an item opens its Tooltip", await q(`(()=>{const t=document.querySelector("[data-slot=tooltip]");return t?[t.textContent.trim(),getComputedStyle(t).visibility]:null})()`), ["Italic", "visible"]);
  await p.click(xy[0], xy[1]); await sleep(300);
  check("multiple: clicking the second presses it too (ghost pressed: hover-2, ink)", [await on(), (await fills())[1], await q(`getComputedStyle(document.querySelectorAll(${JSON.stringify(ITEM)})[1]).color`)], ["110", ink.hover2, ink.ink]);

  /* sizes and shapes */
  await open(fw, 2);
  check("ghost sm rounded: 28px, radius.chip (6px)", await q(`(()=>{const i=document.querySelector(${JSON.stringify(ITEM)});return [i.getBoundingClientRect().height,getComputedStyle(i).borderRadius]})()`), [28, "6px"]);
  await open(fw, 7);
  check("xs: 24px", (await p.rect(ITEM)).h, 24);

  /* vertical */
  await open(fw, 3);
  check("vertical: a column of full-width items, content at the start", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("toggle-group"))}).getBoundingClientRect();const i=[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((e)=>e.getBoundingClientRect());return [i[1].top>i[0].bottom-1,Math.round(i[0].width)===Math.round(r.width),getComputedStyle(document.querySelector(${JSON.stringify(ITEM)})).justifyContent]})()`), [true, true, "flex-start"]);
  await p.click(5, 5); await p.key("Tab"); await p.key("Home"); await p.key("ArrowDown");
  check("vertical: Arrow Down moves to the next", await focused(), 1);

  /* disabled */
  await open(fw, 5);
  await p.click(5, 5); await p.key("Tab"); await p.key("Home"); await p.key("ArrowRight"); await p.key("ArrowRight");
  check("a disabled item is skipped by the arrows and inert", [await focused(), await q(`(()=>{const i=document.querySelectorAll(${JSON.stringify(ITEM)})[2];return [i.disabled,getComputedStyle(i).opacity]})()`)], [0, [true, "0.5"]]);
  await open(fw, 6);
  xy = await at(1);
  await p.click(xy[0], xy[1]); await sleep(150);
  check("disabled group: every item disabled, a click changes nothing", [await q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].every((i)=>i.disabled)`), await on()], [true, "100"]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long labels in 260px: items wrap onto rows, nothing overflows", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("toggle-group"))});const i=[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((e)=>e.getBoundingClientRect());return [i[2].top>i[0].top,r.scrollWidth<=r.clientWidth+1]})()`), [true, true]);
  await open(fw, 2, "&data=worst");
  check("unbreakable label in 200px: cut at the end, its title holds it; nothing overflows", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("toggle-group"))});const l=r.querySelector("[data-slot=toggle-group-label]");return [l.getAttribute("title")===l.textContent,r.scrollWidth<=r.clientWidth+1,document.querySelector(${JSON.stringify(ITEM)}).getBoundingClientRect().right<=r.getBoundingClientRect().right+0.5]})()`), [true, true, true]);
  await open(fw, 1, "&data=worst");
  check("twelve items in 320px: wrap, nothing overflows", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("toggle-group"))});return [document.querySelectorAll(${JSON.stringify(ITEM)}).length,r.scrollWidth<=r.clientWidth+1,r.getBoundingClientRect().width<=320.5]})()`), [12, true, true]);
  await open(fw, 4, "&data=worst&dir=rtl");
  check("rtl: the first item on the right, labels in their own direction", await q(`(()=>{const i=[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((e)=>e.getBoundingClientRect().left);return [i[0]>i[1],getComputedStyle(document.querySelector(${JSON.stringify(S("toggle-group-label"))})).unicodeBidi]})()`), [true, "plaintext"]);
  await p.click(5, 5); await p.key("Tab"); await p.key("Home"); await p.key("ArrowLeft");
  check("rtl: Arrow Left moves to the next item", await focused(), 1);
  await open(fw, 0, "&theme=dark");
  check("dark: the pressed item fills the dark hover-2", (await fills())[1], await token("--fndn-hover-2"));
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
