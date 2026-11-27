// Toggle: the Button's look (compared with a real Button), aria-pressed from Ark, the pressed fill
// (kept while hovered), pointer and keyboard toggling, keyboard changes instant, the icon-only
// toggle named by its Tooltip, disabled, the cut label's title, right-to-left, dark.
//   node components/toggle/toggle.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "toggle";
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

const T = "#stage [data-slot=toggle]";
const LOOK = ["height", "paddingInlineStart", "paddingInlineEnd", "fontSize", "fontWeight", "lineHeight", "borderRadius", "boxShadow", "backgroundColor", "color"];
const look = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);
const state = () => q(`(()=>{const b=document.querySelector(${JSON.stringify(T)});const cs=getComputedStyle(b);return [b.getAttribute("aria-pressed"),cs.backgroundColor,cs.color]})()`);
const away = async () => { await p.hover(1200, 860); await sleep(300); };

async function run(fw, check) {
  await open(fw, 0);
  const ink = { hover: await token("--fndn-hover"), hover2: await token("--fndn-hover-2"), surface: await token("--fndn-surface"), inset: await token("--fndn-inset"), clear: "rgba(0, 0, 0, 0)", ink: await token("--fndn-ink", "color"), ink3: await token("--fndn-ink-3", "color") };

  check("root: a <button> from Ark's toggle, data-slot=toggle, aria-pressed=false, label part", await q(`(()=>{const b=document.querySelector(${JSON.stringify(T)});return [b.tagName,b.dataset.scope,b.getAttribute("aria-pressed"),b.getAttribute("type"),[...b.children].map((c)=>c.dataset.slot)]})()`), ["BUTTON", "toggle", "false", "button", ["toggle-label"]]);
  /* the Button's look: outline md toggle = outline md Button, property for property */
  const mine = await look(T);
  await open(fw, 1, "", "button");
  check("at rest it is the Button (outline md: height, padding, type, radius, shadow, fill, ink)", mine, await look("#stage [data-slot=button]"));

  /* pointer: click presses, the fill stays while hovered and after the pointer leaves */
  await open(fw, 0);
  let r = await p.rect(T);
  await p.click(r.cx, r.cy); await sleep(300);
  check("outline: a click presses it, fill hover-2 while still hovered", await state(), ["true", ink.hover2, ink.ink]);
  check("a pointer change fades (the Button's colour timing)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(T)})).transitionDuration.split(", ").some((d)=>d!=="0s")`), true);
  await away();
  check("outline pressed, pointer gone: fill hover-2", await state(), ["true", ink.hover2, ink.ink]);
  await p.click(r.cx, r.cy); await away();
  check("a second click releases it: surface again", await state(), ["false", ink.surface, ink.ink]);
  await open(fw, 1);
  check("defaultPressed (the model prop, uncontrolled): pressed at mount", await state(), ["true", ink.hover2, ink.ink]);

  /* ghost: hover fills hover, pressed fills hover-2, hovered or not */
  await open(fw, 2);
  r = await p.rect(T);
  check("ghost sm: 28px high (the Button's sm), transparent at rest", [r.h, (await state())[1]], [28, ink.clear]);
  await p.hover(r.cx, r.cy); await sleep(300);
  check("ghost hovered: fill hover", (await state())[1], ink.hover);
  await p.click(r.cx, r.cy); await sleep(300);
  check("ghost pressed, hovered: keeps hover-2 (darker than the hover)", await state(), ["true", ink.hover2, ink.ink]);
  await away();
  check("ghost pressed, pointer gone: hover-2", (await state())[1], ink.hover2);

  /* keyboard: Tab reaches it, Space and Enter toggle it, and the change is instant */
  await open(fw, 2);
  await p.click(5, 5); await p.key("Tab");
  check("Tab focuses the toggle", await q(`document.activeElement?.dataset.slot`), "toggle");
  await p.key(" "); await sleep(30);
  check("Space presses it, instantly (kbd-instant: every transition 0s, fill already hover-2)", [...(await state()).slice(0, 2), await q(`getComputedStyle(document.querySelector(${JSON.stringify(T)})).transitionDuration.split(", ").every((d)=>d==="0s")`)], ["true", ink.hover2, true]);
  await p.key("Enter"); await sleep(30);
  check("Enter releases it", (await state())[0], "false");

  /* icon-only: square, muted, named by its Tooltip */
  await open(fw, 4);
  r = await p.rect(T);
  check("icon-only xs square: 28×28, named by the tooltip (aria-label), muted ink-3", [r.w, r.h, await q(`document.querySelector(${JSON.stringify(T)}).getAttribute("aria-label")`), (await state())[2]], [28, 28, "Bold", ink.ink3]);
  await p.hover(r.cx, r.cy); await sleep(900);
  check("hovering it opens the Tooltip with its name", await q(`(()=>{const t=document.querySelector("[data-slot=tooltip]");return t?[t.textContent.trim(),getComputedStyle(t).visibility]:null})()`), ["Bold", "visible"]);
  await p.click(r.cx, r.cy); await sleep(300);
  check("clicking it under its Tooltip presses it: hover-2, ink", await state(), ["true", ink.hover2, ink.ink]);

  await open(fw, 5);
  check("rounded sm: radius.chip (6px), 28px high", await q(`(()=>{const b=document.querySelector(${JSON.stringify(T)});return [getComputedStyle(b).borderRadius,b.getBoundingClientRect().height]})()`), ["6px", 28]);
  await open(fw, 6);
  r = await p.rect(T);
  await p.click(r.cx, r.cy); await sleep(200);
  check("disabled: native disabled, half opacity, a click changes nothing", await q(`(()=>{const b=document.querySelector(${JSON.stringify(T)});return [b.disabled,getComputedStyle(b).opacity,b.getAttribute("aria-pressed")]})()`), [true, "0.5", "true"]);
  await open(fw, 7);
  check("xs: 24px high, pressed ghost fill hover-2", [(await p.rect(T)).h, (await state())[1]], [24, ink.hover2]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long label in 180px: cut at the end, its title holds the whole label", await q(`(()=>{const b=document.querySelector(${JSON.stringify(T)});const l=b.querySelector("[data-slot=toggle-label]");return [Math.round(b.getBoundingClientRect().width),l.getAttribute("title")===l.textContent,b.scrollWidth<=b.clientWidth+1]})()`), [180, true, true]);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: pressed, label in its own direction", await q(`(()=>{const b=document.querySelector(${JSON.stringify(T)});return [b.getAttribute("aria-pressed"),getComputedStyle(b.querySelector("[data-slot=toggle-label]")).unicodeBidi]})()`), ["true", "plaintext"]);
  await open(fw, 1, "&theme=dark");
  check("dark: pressed outline fills the dark hover-2", (await state())[1], await token("--fndn-hover-2"));
  await open(fw, 3, "&theme=dark");
  check("dark: pressed ghost fills the dark hover-2", (await state())[1], await token("--fndn-hover-2"));
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
