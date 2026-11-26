// Navigation menu: Ark's navigation-menu (a nav landmark; triggers with aria-expanded; panels of
// links), the real Button as trigger and the button's look on plain links, the shared popup
// growing from its trigger under the pointer and instant under the keyboard, the caret, the
// gliding highlight, the keys (arrows across the row, into and through a panel, Escape back),
// one panel box that follows the pointer between panels (its start edge and size ease, the content
// leaves and arrives in the direction of travel; instant from the keyboard, a fade under reduced
// motion, a fast sweep ends at rest, the frame budget), a panel open at mount (no entrance), the current
// page, worst cases (a crowded row wraps; the panel stays inside a 320px window), right-to-left,
// dark.
//   node components/navigation-menu/navigation-menu.test.mjs [react …]   (default: the spec's targets)
const C = "navigation-menu";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`!window.__stale && location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector("#stage [data-slot=navigation-menu]")`).catch(() => false)) break; await sleep(100); } await sleep(400); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; await q("window.__stale = true").catch(() => {}); const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const S = (part) => `#stage [data-slot=${part}]`;
/* the panel box and what is in it live in a portal */
const P = (part) => `[data-slot=${part}]`;
const TRIGGER = "#stage [data-navigation-menu=trigger]";
const VIEWPORT = P("navigation-menu-viewport");
const state = () => q(`(()=>{const v=document.querySelector(${JSON.stringify(VIEWPORT)});const c=[...document.querySelectorAll(${JSON.stringify(P("navigation-menu-content"))})].find((e)=>!e.hidden);return {open:!!v&&!v.hidden&&v.dataset.state==="open",links:c?[...c.querySelectorAll("[data-slot=navigation-menu-link-title]")].map((e)=>e.textContent):[],expanded:[...document.querySelectorAll(${JSON.stringify(TRIGGER)})].map((t)=>t.getAttribute("aria-expanded"))}})()`);
const vbox = () => p.rect(VIEWPORT);
const active = () => q(`document.activeElement?.textContent?.trim().slice(0,30) ?? null`);
/* opacity of the panel box on each frame for `ms` */
const frames = (ms) => q(`new Promise((res)=>{const out=[];const t0=performance.now();const f=()=>{const v=document.querySelector(${JSON.stringify(VIEWPORT)});out.push(v?Number(getComputedStyle(v).opacity):-1);if(performance.now()-t0<${ms})requestAnimationFrame(f);else res(out)};requestAnimationFrame(f)})`);

/* the box and the contents displayed in it, on each frame for `ms` (dt: the time since the frame before) */
const track = (ms) => q(`new Promise((res)=>{const out=[];const t0=performance.now();let last=t0;const f=(now)=>{const v=document.querySelector(${JSON.stringify(VIEWPORT)});const cs=getComputedStyle(v);out.push({dt:now-last,w:parseFloat(cs.width),h:parseFloat(cs.height),l:parseFloat(cs.left),c:[...v.querySelectorAll("[data-slot=navigation-menu-content]")].filter((c)=>getComputedStyle(c).display!=="none").map((c)=>{const s=getComputedStyle(c);return {v:c.dataset.value,o:Number(s.opacity),x:s.translate==="none"?0:parseFloat(s.translate)}})});last=now;if(now-t0<${ms})requestAnimationFrame(f);else res(out)};requestAnimationFrame(f)})`);
const centres = () => q(`[...document.querySelectorAll(${JSON.stringify(TRIGGER)})].map((t)=>{const b=t.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})`);
const between = (x, a, b) => x > Math.min(a, b) + 1 && x < Math.max(a, b) - 1;
/* at rest: one content shown, the box its size, nothing running */
const atRest = () => q(`(()=>{const v=document.querySelector(${JSON.stringify(VIEWPORT)});const c=[...v.querySelectorAll("[data-slot=navigation-menu-content]")].filter((e)=>getComputedStyle(e).display!=="none");return [c.map((e)=>e.dataset.value),c.length===1&&v.offsetWidth===c[0].offsetWidth&&v.offsetHeight===c[0].offsetHeight,getComputedStyle(c[0]).opacity,getComputedStyle(c[0]).translate,document.getAnimations().length]})()`);

/* moving between open panels (example 3: three panels of different sizes) */
async function switching(fw, check) {
  await p.media([]);
  await open(fw, 3);
  let tc = await centres();
  await p.hover(...tc[0]); await sleep(700);
  const from = await vbox();
  check("first open: the content has no entrance of its own, the box no size transition (only the popup's)", await q(`(()=>{const v=document.querySelector(${JSON.stringify(VIEWPORT)});return [document.querySelector("[data-slot=navigation-menu-content][data-motion]")===null,v.getAnimations().map((a)=>a.transitionProperty).filter((n)=>/width|height|left/.test(n))]})()`), [true, []]);
  await p.hover(...tc[1]);
  const fr = await track(450);
  const to = await vbox();
  check("switching: the box's width and height ease to the new panel's (values between the two sizes)", [fr.some((f) => between(f.w, from.w, to.w)), fr.some((f) => between(f.h, from.h, to.h))], [true, true]);
  check("switching: the box's start edge eases to the new trigger (left between the two)", fr.some((f) => between(f.l, from.x - from.x, to.x - from.x)), true);
  const early = fr.find((f) => f.c.length === 2);
  check("to the right: the old content leaves to the left, the new one comes from the right", early ? [early.c.find((c) => c.v === "products").x < 0, early.c.find((c) => c.v === "company").x > 0] : null, [true, true]);
  check("the two contents are never both fully visible; the arriving one fades in", [fr.every((f) => f.c.filter((c) => c.o > 0.99).length <= 1), fr.some((f) => f.c.some((c) => c.v === "company" && c.o > 0.05 && c.o < 0.95))], [true, true]);
  const budget = fr.slice(1).map((f) => f.dt).sort((a, b) => a - b);
  check(`frame budget while the box resizes (p90 ${budget[Math.floor(budget.length * 0.9)].toFixed(1)}ms): no frame over 50ms`, budget.at(-1) < 50, true);
  check("switching ends at rest: one content, the box its size, nothing running", await atRest(), [["company"], true, "1", "none", 0]);
  await p.hover(...tc[0]);
  const back = await track(150);
  const eb = back.find((f) => f.c.length === 2);
  check("back to the left: the old content leaves to the right, the new one comes from the left", eb ? [eb.c.find((c) => c.v === "company").x > 0, eb.c.find((c) => c.v === "products").x < 0] : null, [true, true]);
  await sleep(500);

  /* a fast sweep across three triggers and back never stacks or stops half-way */
  await p.hover(...tc[1]); await sleep(60);
  await p.hover(...tc[2]); await sleep(60);
  await p.hover(...tc[1]);
  const sw = await track(700);
  check("a fast sweep never shows more than two contents at once", sw.every((f) => f.c.length <= 2), true);
  check("a fast sweep ends at rest on the last panel", await atRest(), [["company"], true, "1", "none", 0]);

  /* keyboard: switching panels is instant */
  await open(fw, 3);
  await p.click(5, 5); await p.key("Tab"); await p.key("Enter"); await sleep(100);
  const kfrom = await vbox();
  await p.key("ArrowRight"); await p.key("Enter");
  const kf = await track(250);
  const kto = await vbox();
  check("keyboard: the other panel at once (no size in between, no shift, no fade)", [kfrom.w !== kto.w, kf.every((f) => !between(f.w, kfrom.w, kto.w) && f.c.every((c) => c.x === 0 && (c.v !== "company" || c.o === 1)))], [true, true]);

  /* reduced motion: a fade only */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 3);
  tc = await centres();
  await p.hover(...tc[0]); await sleep(700);
  const rfrom = await vbox();
  await p.hover(...tc[1]);
  const rf = await track(400);
  const rto = await vbox();
  check("reduced motion: the box jumps, the content does not shift, it only fades", [rf.every((f) => !between(f.w, rfrom.w, rto.w)), rf.every((f) => f.c.every((c) => c.x === 0)), rf.some((f) => f.c.some((c) => c.v === "company" && c.o > 0.05 && c.o < 0.95))], [true, true, true]);
  await p.media([]);

  /* right-to-left mirrors the direction: to the trigger on the left, the new content comes from the left */
  await open(fw, 3, "&dir=rtl");
  tc = await centres();
  await p.hover(...tc[0]); await sleep(700);
  await p.hover(...tc[1]);
  const rt = (await track(150)).find((f) => f.c.length === 2);
  check("rtl: moving left, the old content leaves to the right, the new one comes from the left", rt ? [rt.c.find((c) => c.v === "products").x > 0, rt.c.find((c) => c.v === "company").x < 0] : null, [true, true]);
}

async function run(fw, check) {
  await switching(fw, check);
  await open(fw, 0);
  check("root: a nav landmark named \"Main\"", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("navigation-menu"))});return [r.tagName,r.getAttribute("aria-label")]})()`), ["NAV", "Main"]);
  const t0 = await p.rect(TRIGGER), bl = await p.rect(S("navigation-menu-bar-link"));
  check("triggers: the real Button (data-slot=button), 28px, aria-expanded false, a caret; plain links: anchors as high, on one line",
    [await q(`(()=>{const t=document.querySelector(${JSON.stringify(TRIGGER)});return [t.dataset.slot,t.tagName,t.getAttribute("aria-expanded"),!!t.querySelector("[data-slot=navigation-menu-caret]")]})()`), t0.h, bl.h, Math.abs(t0.cy - bl.cy) <= 0.5, await q(`document.querySelector(${JSON.stringify(S("navigation-menu-bar-link"))}).tagName`)],
    [["button", "BUTTON", "false", true], 28, 28, true, "A"]);
  check("trigger and plain link share the type (13px, medium, ink)", await q(`(()=>{const a=getComputedStyle(document.querySelector(${JSON.stringify(TRIGGER)}));const b=getComputedStyle(document.querySelector(${JSON.stringify(S("navigation-menu-bar-link"))}));return [a.fontSize===b.fontSize,a.fontWeight===b.fontWeight,a.color===b.color]})()`), [true, true, true]);

  /* pointer: hover opens after the delay, growing from the trigger */
  await p.hover(t0.cx, t0.cy);
  await sleep(100);
  check("hover: nothing before the open delay (200ms)", (await state()).open, false);
  const f = await frames(450);
  const st = await state();
  check("hover: the panel opens with its links", [st.open, st.links, st.expanded[0]], [true, ["Analytics", "Automations", "Integrations"], "true"]);
  check("from the pointer it grows in (opacity passes through values between 0 and 1)", f.some((o) => o > 0.05 && o < 0.95), true);
  const vb = await vbox();
  check("the panel sits 4px under the row, its start edge on the trigger's", [Math.round(vb.y - (t0.y + t0.h)), Math.abs(vb.x - t0.x) <= 0.5], [4, true]);
  check("it grows from the trigger's centre at its top edge (transform-origin)", await q(`(()=>{const v=document.querySelector(${JSON.stringify(VIEWPORT)});const [x,y]=getComputedStyle(v).transformOrigin.split(" ").map(parseFloat);return [Math.abs(x-${t0.w / 2})<=1,y]})()`), [true, 0]);
  check("caret turned 180° while open", await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("navigation-menu-caret"))})).rotate`), "180deg");
  check("open trigger keeps the ghost button's darker fill (hover-2)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(TRIGGER)})).backgroundColor`), await token("--fndn-hover-2"));
  check("panel: the popup surface (surface, raised shadow, card radius), at least 220px wide, as large as its content", await q(`(()=>{const v=document.querySelector(${JSON.stringify(VIEWPORT)});const c=[...v.querySelectorAll("[data-slot=navigation-menu-content]")].find((e)=>!e.hidden);const cs=getComputedStyle(v);return [cs.backgroundColor,cs.borderRadius,v.offsetWidth===c.offsetWidth&&v.offsetHeight===c.offsetHeight,v.offsetWidth>=220]})()`), [await token("--fndn-surface"), await token("--fndn-radius-card", "borderRadius"), true, true]);
  const l1 = await p.rect(P("navigation-menu-link"));
  await p.hover(l1.cx, l1.cy); await sleep(300);
  check("hovering a link: the one glide highlight lands on it", await q(`(()=>{const h=document.querySelector(${JSON.stringify(P("navigation-menu-highlight"))});const l=document.querySelector(${JSON.stringify(P("navigation-menu-link"))});return [h.hasAttribute("data-visible"),Math.round(h.getBoundingClientRect().height)===Math.round(l.getBoundingClientRect().height)]})()`), [true, true]);
  check("a link: the option row (padding 5px 8px, 12.5px title), its description in xs ink-2",await q(`(()=>{const l=document.querySelector(${JSON.stringify(P("navigation-menu-link"))});const cs=getComputedStyle(l);const t=getComputedStyle(l.querySelector("[data-slot=navigation-menu-link-title]"));const d=getComputedStyle(l.querySelector("[data-slot=navigation-menu-link-description]"));return [cs.paddingTop,cs.paddingInlineStart,t.fontSize,d.fontSize,d.color]})()`), ["5px", "8px", "12.5px", "12px", await token("--fndn-ink-2", "color")]);

  /* moving to the other trigger swaps the content in the same box */
  const t1 = await q(`(()=>{const b=document.querySelectorAll(${JSON.stringify(TRIGGER)})[1].getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  await p.hover(t0.cx, t0.cy); await sleep(50);
  await p.hover(t1.x, t1.y);
  const sf = await frames(400);
  check("moving to the next trigger: its panel replaces the first in the same box, the box does not fade again", [(await state()).links, sf.every((o) => o === 1)], [["Documentation", "Changelog", "Status"], true]);
  await p.hover(5, 600); await sleep(900);
  check("leaving: the panel closes after the close delay", (await state()).open, false);

  /* click toggles */
  await open(fw, 0);
  await p.click(t0.cx, t0.cy); await sleep(450);
  check("a click opens the panel", (await state()).open, true);
  await p.click(t0.cx, t0.cy); await sleep(400);
  check("a second click closes it", (await state()).open, false);

  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab reaches the first trigger", await q(`document.activeElement?.dataset.navigationMenu`), "trigger");
  await p.key("Enter");
  const kf = await frames(100);
  check("Enter opens the panel at once (no fade, no scale)", [(await state()).open, kf.every((o) => o === 1)], [true, true]);
  check("from the keyboard the caret turns at once (kbd-instant)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("navigation-menu-caret"))})).transitionDuration.split(", ").every((d)=>d==="0s")`), true);
  await p.key("ArrowDown"); await sleep(100);
  check("Arrow Down moves into the panel, on its first link", await q(`document.activeElement?.dataset.slot`), "navigation-menu-link");
  check("the focused link: the shared ring and the glide on it", await q(`(()=>{const a=document.activeElement;return [getComputedStyle(a).outlineStyle,document.querySelector(${JSON.stringify(P("navigation-menu-highlight"))}).hasAttribute("data-visible")]})()`), ["solid", true]);
  await p.key("ArrowDown"); await sleep(50);
  check("Arrow Down: the next link", (await active()).startsWith("Automations"), true);
  await p.key("Escape"); await sleep(100);
  const ks = await state();
  check("Escape closes at once and returns focus to the trigger", [ks.open, await q(`document.activeElement?.dataset.navigationMenu`)], [false, "trigger"]);
  await p.key("ArrowRight"); await sleep(50);
  check("Arrow Right: the next entry of the row", (await active()).startsWith("Resources"), true);
  await p.key("End"); await sleep(50);
  check("End: the last entry (a plain link)", await q(`document.activeElement?.dataset.slot`), "navigation-menu-bar-link");

  /* open at mount: sized, no entrance; the current link */
  await open(fw, 1);
  const ms = await state();
  check("open at mount: the panel is there, sized to its content", [ms.open, (await vbox()).w >= 220], [true, true]);
  check("nothing plays at first paint (no running transition on the box)", await q(`document.querySelector(${JSON.stringify(VIEWPORT)}).getAnimations().length`), 0);
  check("the current link: aria-current=page, its title medium", await q(`(()=>{const l=document.querySelector("[data-slot=navigation-menu-link][aria-current=page]");return [l?.textContent.startsWith("Analytics"),getComputedStyle(l.querySelector("[data-slot=navigation-menu-link-title]")).fontWeight]})()`), [true, "500"]);

  await open(fw, 2);
  check("current page in the row: aria-current=page, the darker fill", await q(`(()=>{const l=document.querySelector("#stage [data-slot=navigation-menu-bar-link][aria-current=page]");return [l?.textContent,getComputedStyle(l).backgroundColor]})()`), ["Docs", await token("--fndn-hover-2")]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("worst long names: the row wraps rather than cutting (no ellipsis), the names whole", await q(`(()=>{const l=document.querySelector(${JSON.stringify(S("navigation-menu-list"))});const lab=l.querySelector("[data-slot=button-label]");return [l.getBoundingClientRect().height>30,lab.scrollWidth<=lab.clientWidth+1]})()`), [true, true]);
  check("worst: link titles shown whole on their own line (the unbroken one wraps), the description wraps", await q(`(()=>{const ts=[...document.querySelectorAll(${JSON.stringify(P("navigation-menu-link-title"))})];const d=document.querySelector(${JSON.stringify(P("navigation-menu-link-description"))});return [ts.every((t)=>t.scrollWidth<=t.clientWidth+1&&Math.abs(t.getBoundingClientRect().width-(t.parentElement.clientWidth-16))<=1),d.getBoundingClientRect().height>20]})()`), [true, true]);
  await open(fw, 1, "&data=worst");
  check("worst many entries: the row wraps, nothing pokes out", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("navigation-menu"))});const b=r.getBoundingClientRect();return [document.querySelector(${JSON.stringify(S("navigation-menu-list"))}).getBoundingClientRect().height>60,[...r.querySelectorAll("[data-slot=navigation-menu-item]")].every((e)=>{const x=e.getBoundingClientRect();return x.right<=b.right+0.5&&x.left>=b.left-0.5})]})()`), [true, true]);
  await p.viewport(320, 700, 1.25);
  await open(fw, 0, "&data=worst");
  check("a 320px window: the open panel stays inside it", await q(`(()=>{const v=document.querySelector(${JSON.stringify(VIEWPORT)}).getBoundingClientRect();return v.left>=0&&v.right<=320})()`), true);
  await p.viewport(1280, 900, 1.25);
  await open(fw, 4, "&data=worst");
  check("worst empty panel: renders, no error", (await state()).open, true);

  /* right-to-left: the panel's end edge on the trigger's end edge */
  await open(fw, 2, "&data=worst&dir=rtl");
  const rt = await p.rect(TRIGGER), rv = await vbox();
  check("rtl: the open panel's right edge on its trigger's right edge", Math.abs(rv.x + rv.w - (rt.x + rt.w)) <= 0.5, true);
  check("rtl: the caret still points down (not mirrored), the links read right to left", await q(`[getComputedStyle(document.querySelector(${JSON.stringify(P("navigation-menu-link-title"))})).unicodeBidi,document.querySelector(${JSON.stringify(S("navigation-menu"))}).getAttribute("dir")]`), ["plaintext", "rtl"]);

  /* the current page: the trigger of the panel that holds it is the current section */
  await open(fw, 4);
  check("currentHref in a panel: its trigger is aria-current=true with the hover-2 fill; the other trigger and the plain link are not", await q(`(()=>{const t=[...document.querySelectorAll(${JSON.stringify(TRIGGER)})];const b=document.querySelector("#stage [data-slot=navigation-menu-bar-link]");return [t.map((x)=>x.getAttribute("aria-current")),getComputedStyle(t[0]).backgroundColor,b.hasAttribute("aria-current")]})()`), [["true", null], await token("--fndn-hover-2"), false]);
  await open(fw, 5);
  check("currentHref on a plain link: aria-current=page; the trigger is not current", await q(`[document.querySelector("#stage [data-slot=navigation-menu-bar-link]").getAttribute("aria-current"),document.querySelector(${JSON.stringify(TRIGGER)}).getAttribute("aria-current")]`), ["page", null]);

  /* dark */
  await open(fw, 1, "&theme=dark");
  check("dark: the panel on the dark surface", await q(`getComputedStyle(document.querySelector(${JSON.stringify(VIEWPORT)})).backgroundColor`), await token("--fndn-surface"));
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await p.viewport(1280, 900, 1.25).catch(() => {}); await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
