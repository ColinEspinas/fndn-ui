// Accordion: the collapsible row (compared with a real Collapsible), single and multiple, collapsible,
// pointer and keyboard (arrows, Home, End, instant toggles), disabled items, card, worst cases,
// right-to-left, dark.
//   node components/accordion/accordion.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "accordion";
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
const away = async () => { await p.hover(1200, 860); await sleep(300); };

const R = "#stage [data-slot=accordion]";
const T = (i) => `${R} > [data-slot=accordion-item]:nth-child(${i + 1}) > [data-slot=accordion-trigger]`;
/* per item: expanded, data-state, region hidden, region height, caret angle */
const items = () => q(`(()=>{const ang=(e)=>{const m=getComputedStyle(e).transform;if(!m||m==="none")return 0;const [a,b]=m.slice(7,-1).split(",").map(Number);return Math.round(Math.atan2(b,a)*180/Math.PI)};
  return [...document.querySelectorAll(${JSON.stringify(R + " > [data-slot=accordion-item]")})].map((it)=>{const t=it.querySelector("[data-slot=accordion-trigger]"),c=it.querySelector("[data-slot=accordion-content]");
    return {exp:t.getAttribute("aria-expanded"),state:it.dataset.state,hidden:c.hidden,h:Math.round(c.getBoundingClientRect().height),caret:ang(t.querySelector("[data-slot=accordion-caret]"))}})})()`);
const LOOK = ["height", "paddingTop", "paddingInlineStart", "paddingInlineEnd", "fontSize", "fontWeight", "borderRadius", "backgroundColor", "color"];
const look = (sel) => q(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});const cs=getComputedStyle(e);const l=e.querySelector("[data-slot$=-label]"),c=e.querySelector("[data-slot$=-caret]");return [...${JSON.stringify(LOOK)}.map((k)=>cs[k]),getComputedStyle(l).fontWeight,getComputedStyle(l).color,getComputedStyle(l).lineHeight,c.getBoundingClientRect().width,c.getBoundingClientRect().height,getComputedStyle(c).fontSize]})()`);
const focused = () => q(`(()=>{const a=document.activeElement;const it=a?.closest("[data-slot=accordion-item]");return it?[...it.parentElement.children].indexOf(it):-1})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("plain: three items, each a <button> trigger (aria-expanded=false) over a hidden region labelled by it", await q(`(()=>{const its=[...document.querySelectorAll(${JSON.stringify(R + " > [data-slot=accordion-item]")})];return [its.length,...its.map((it)=>{const t=it.querySelector("[data-slot=accordion-trigger]"),c=it.querySelector("[data-slot=accordion-content]");return [t.tagName,t.getAttribute("aria-expanded"),c.getAttribute("role"),c.getAttribute("aria-labelledby")===t.id&&t.getAttribute("aria-controls")===c.id,c.hidden]})]})()`), [3, ["BUTTON", "false", "region", true, true], ["BUTTON", "false", "region", true, true], ["BUTTON", "false", "region", true, true]]);
  const line = await token("--fndn-line", "borderBottomColor");
  /* a 1px border is one device pixel: 0.8px at 125% */
  check("a hairline (one device pixel) under every item but the last, in the line colour", await q(`[...document.querySelectorAll(${JSON.stringify(R + " > [data-slot=accordion-item]")})].map((it)=>[Math.round(parseFloat(getComputedStyle(it).borderBottomWidth)*devicePixelRatio),getComputedStyle(it).borderBottomColor])`), [[1, line], [1, line], [0, line]]);
  /* the model: an item is the collapsible's row, property for property */
  const mine = await look(T(0));
  await open(fw, 0, "", "collapsible");
  check("an item's trigger is the Collapsible row (44px, padding 10, 14px/500 ink label, 28px caret box)", mine, await look("#stage [data-slot=collapsible-trigger]"));

  /* pointer: single mode, collapsible */
  await open(fw, 0);
  await p.clickSel(T(0)); await sleep(500);
  let s = await items();
  check("click: the first item opens (region shown, caret turned down)", [s[0].exp, s[0].state, s[0].hidden, s[0].h > 0, s[0].caret], ["true", "open", false, true, 90]);
  check("a pointer open reveals (the collapsible's transition, not instant)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(T(0))}).nextElementSibling).transitionDuration.split(", ").some((d)=>d!=="0s")`), true);
  await p.clickSel(T(1)); await sleep(500);
  s = await items();
  check("click another: it opens and the first closes (single)", [s[0].exp, s[0].hidden, s[1].exp, s[1].hidden], ["false", true, "true", false]);
  await p.clickSel(T(1)); await sleep(500);
  check("click the open one again: it closes (collapsible)", (await items()).map((x) => x.exp), ["false", "false", "false"]);
  const r = await p.rect(T(2));
  await p.hover(r.cx, r.cy); await sleep(200);
  check("hover fills hover (fine pointer)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(T(2))})).backgroundColor`), await token("--fndn-hover"));
  await away();

  /* keyboard: arrows move between triggers, Enter / Space toggle at once */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab reaches the first trigger", await focused(), 0);
  await p.key("ArrowDown"); check("ArrowDown: the next trigger", await focused(), 1);
  await p.key("End"); check("End: the last trigger", await focused(), 2);
  await p.key("Home"); check("Home: the first trigger", await focused(), 0);
  await p.key("ArrowUp"); check("ArrowUp from the first: stays or wraps inside the accordion", (await focused()) >= 0, true);
  await p.key("Home");
  await p.key("Enter"); await sleep(40);
  s = await items();
  check("Enter opens at once: full height and the caret already down 40ms in", [s[0].exp, s[0].h > 10, s[0].caret], ["true", true, 90]);
  await p.key(" "); await sleep(40);
  s = await items();
  check("Space closes it at once", [s[0].exp, s[0].hidden], ["false", true]);
  await p.key("Tab");
  check("Tab from a trigger goes to the next trigger (nothing inside closed items)", await focused(), 1);

  /* card, one open at mount */
  await open(fw, 1);
  s = await items();
  check("card: radius.card, surface, shadow; the defaultValue item is open at mount, nothing animating", [await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const cs=getComputedStyle(e);return [cs.borderRadius,cs.backgroundColor===${JSON.stringify(await token("--fndn-surface"))},cs.boxShadow!=="none",cs.overflow]})()`), s.map((x) => x.exp), await q(`document.getAnimations().length`)], [["10px", true, true, "hidden"], ["false", "true", "false"], 0]);
  check("meta: 12px ink-2 on the trigger line", await q(`(()=>{const m=document.querySelector("${R} [data-slot=accordion-meta]");return [getComputedStyle(m).fontSize,getComputedStyle(m).color,m.textContent]})()`), ["12px", await token("--fndn-ink-2", "color"), "2–5 days"]);

  /* multiple, caret first */
  await open(fw, 2);
  check("multiple: two open at mount", (await items()).map((x) => x.exp), ["true", "true", "false"]);
  await p.clickSel(T(2)); await sleep(500);
  check("multiple: opening a third keeps the others open", (await items()).map((x) => x.exp), ["true", "true", "true"]);
  check("caret first: the caret is the trigger's first child", await q(`document.querySelector(${JSON.stringify(T(0))}).firstElementChild.dataset.slot`), "accordion-caret");

  /* a disabled item */
  await open(fw, 3);
  check("disabled item: native disabled, half opacity", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T(1))});return [t.disabled,getComputedStyle(t).opacity]})()`), [true, "0.5"]);
  await p.clickSel(T(1)); await sleep(300);
  check("a click on it does nothing", (await items())[1].exp, "false");
  await q(`document.querySelector(${JSON.stringify(T(0))}).focus()`);
  await p.key("ArrowDown");
  check("ArrowDown skips it", await focused(), 2);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long label wraps (trigger taller than 44), the detail wraps, nothing overflows 280px", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const t=e.querySelector("[data-slot=accordion-trigger]");return [t.getBoundingClientRect().height>44,e.scrollWidth<=e.clientWidth+1,Math.round(e.getBoundingClientRect().width)]})()`), [true, true, 280]);
  await open(fw, 1, "&data=worst");
  check("twelve items in a card: all there, a line between each", await q(`[...document.querySelectorAll(${JSON.stringify(R + " > [data-slot=accordion-item]")})].filter((it)=>parseFloat(getComputedStyle(it).borderBottomWidth)>0).length`), 11);
  await open(fw, 3, "&data=worst");
  check("no items: an empty root, no error", await q(`document.querySelector(${JSON.stringify(R)}).children.length`), 0);
  await open(fw, 4, "&data=worst");
  check("120px: nothing overflows", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return e.scrollWidth<=e.clientWidth+1})()`), true);
  await open(fw, 2, "&data=worst&dir=rtl");
  s = await items();
  check("rtl: open caret points down (90), a closed one points left (180), label in its own direction", [s[0].caret, s[1].caret, await q(`getComputedStyle(document.querySelector("${R} [data-slot=accordion-label]")).unicodeBidi`)], [90, 180, "plaintext"]);
  await open(fw, 1, "&theme=dark");
  check("dark: the card is the dark surface", await q(`getComputedStyle(document.querySelector(${JSON.stringify(R)})).backgroundColor`), await token("--fndn-surface"));
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
