// Drawer: opens from its edge (bottom, end, start), modal dialog semantics, focus trapped, Escape
// instant and focus returned, a pointer close slides out (shorter than it came), a short drag
// settles back, a long one or a fast flick dismisses, the Dialog's header and footer, worst cases, rtl, dark.
//   node components/drawer/drawer.test.mjs [react …]   (default: the spec's targets)
const C = "drawer";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const T = "#stage [data-drawer=trigger]";
const S = "[data-slot=drawer-content]";
const ready = async (search) => { for (let t = 0; t < 80; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector(${JSON.stringify(T)})`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const state = () => q(`document.querySelector(${JSON.stringify(S)})?.getAttribute("data-state") ?? null`);
const box = () => q(`(()=>{const b=document.querySelector(${JSON.stringify(S)}).getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.right),Math.round(b.bottom),innerWidth,innerHeight]})()`);
const focused = () => q(`(()=>{const a=document.activeElement;const c=document.querySelector(${JSON.stringify(S)});return c&&c.contains(a)?(a.getAttribute("aria-label")||a.textContent.trim()):a===document.querySelector(${JSON.stringify(T)})?"trigger":"outside"})()`);
const durations = () => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(S)}));const props=cs.transitionProperty.split(", ");const d=cs.transitionDuration.split(", ");return Object.fromEntries(["transform","display"].map((k)=>[k,d[props.indexOf(k)]]))})()`);

/* each matched Button's corners: "pill" (fully round), "rounded" (radius.chip, a 28px rounded Button), or the radius itself */
const shapes = (sel) => q(`(()=>{const d=document.createElement("i");d.style.borderRadius="var(--fndn-radius-chip)";document.body.append(d);const chip=getComputedStyle(d).borderTopLeftRadius;d.remove();return [...document.querySelectorAll(${JSON.stringify(sel)})].map((b)=>{const r=getComputedStyle(b).borderTopLeftRadius;return r===chip?"rounded":parseFloat(r)>=b.getBoundingClientRect().height/2-0.5?"pill":r})})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("trigger: the Button, announces a dialog", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});return [t.dataset.slot,t.getAttribute("aria-haspopup"),t.getAttribute("aria-expanded")]})()`), ["button", "dialog", "false"]);
  await p.clickSel(T); await sleep(80);
  check("pointer open slides in over duration.slow (translate, easing.drawer)", [await state(), (await durations()).transform, await q(`getComputedStyle(document.querySelector(${JSON.stringify(S)})).transitionTimingFunction.includes("0.32, 0.72, 0, 1")`)], ["open", "0.25s", true]);
  await sleep(450);
  check("bottom: against the bottom edge, centred, at most 640px wide", await q(`(()=>{const b=document.querySelector(${JSON.stringify(S)}).getBoundingClientRect();return [Math.abs(b.bottom-innerHeight)<=0.5,Math.abs(b.left+b.width/2-innerWidth/2)<=0.5,b.width<=640]})()`), [true, true, true]);
  check("modal dialog, labelled and described; the page is inert and does not scroll", await q(`(()=>{const c=document.querySelector(${JSON.stringify(S)});return [c.getAttribute("role"),c.getAttribute("aria-modal"),document.getElementById(c.getAttribute("aria-labelledby"))?.textContent,!!document.getElementById(c.getAttribute("aria-describedby")),document.querySelector("#stage").closest("[aria-hidden='true'],[inert]")!==null,getComputedStyle(document.body).overflow]})()`), ["dialog", "true", "Order #4821", true, true, "hidden"]);
  check("radius.window on the top corners only; a grabber with its 36×4 handle", await q(`(()=>{const c=document.querySelector(${JSON.stringify(S)});const cs=getComputedStyle(c);const h=c.querySelector("[data-slot=drawer-grabber-indicator]").getBoundingClientRect();return [cs.borderTopLeftRadius,cs.borderBottomLeftRadius,Math.round(h.width),Math.round(h.height),c.querySelector("[data-slot=drawer-grabber]").getAttribute("aria-hidden")]})()`), ["14px", "0px", 36, 4, "true"]);
  check("focus starts on the first control (Close)", await focused(), "Close");
  const seen = [];
  for (let i = 0; i < 4; i++) { await p.key("Tab"); await sleep(40); seen.push(await focused()); }
  /* the X is named Close, and so is the footer's first action */
  check("Tab cycles inside the sheet: footer actions, then back to the close button", seen, ["Close", "Mark received", "Close", "Close"]);
  await p.key("Escape"); await sleep(30);
  check("Escape closes at once (kbd-instant) and returns focus to the trigger", [await state(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(S)})).display`), await focused()], ["closed", "none", "trigger"]);
  check("the page is interactive and scrolls again", await q(`[document.querySelector("#stage").closest("[aria-hidden='true'],[inert]")===null,getComputedStyle(document.body).overflow]`), [true, "visible"]);

  /* pointer close: slides out over duration.base, shorter than the way in */
  await p.clickSel(T); await sleep(500);
  await p.click(12, 12); await sleep(40);
  check("a press outside closes: it slides out over duration.base, still painted", [await state(), (await durations()).transform, await q(`getComputedStyle(document.querySelector(${JSON.stringify(S)})).display`)], ["closed", "0.15s", "flex"]);
  await sleep(350);
  check("…then it is gone and focus is back on the trigger", [await q(`getComputedStyle(document.querySelector(${JSON.stringify(S)})).display`), await focused()], ["none", "trigger"]);

  /* drag: a short pull settles back, a long one dismisses and the sheet leaves from where it is */
  await p.clickSel(T); await sleep(500);
  let g = await p.rect("[data-slot=drawer-grabber]");
  const top = (await box())[1];
  await p.drag(g.cx, g.cy + 2, g.cx, g.cy + 22, { steps: 5 });
  check("a short drag: still open", await state(), "open");
  await sleep(450);
  check("…and it settles back where it was", (await box())[1], top);
  await p.drag(g.cx, g.cy + 2, g.cx, g.cy + 70, { steps: 3, stepDelay: 30 });
  await sleep(30);
  const leaving = await q(`(()=>{const c=document.querySelector(${JSON.stringify(S)});return [c.dataset.state,getComputedStyle(c).display,c.getBoundingClientRect().top]})()`);
  check("a drag past a quarter dismisses; the sheet is still sliding out, below where it was", [leaving[0], leaving[1], leaving[2] > top], ["closed", "flex", true]);
  await sleep(400);
  check("…and then it is gone, focus on the trigger", [await q(`getComputedStyle(document.querySelector(${JSON.stringify(S)})).display`), await focused()], ["none", "trigger"]);
  /* a fast flick dismisses even when it travels less than a quarter (the swipe's velocity) */
  await p.clickSel(T); await sleep(500);
  g = await p.rect("[data-slot=drawer-grabber]");
  await p.drag(g.cx, g.cy + 2, g.cx, g.cy + 38, { steps: 2, stepDelay: 8 });
  await sleep(450);
  check("a fast short flick dismisses", [await state(), await focused()], ["closed", "trigger"]);

  /* an action closes; one with close: false does not */
  await p.clickSel(T); await sleep(450);
  await p.clickSel(`${S} [data-slot=drawer-footer] > [data-slot=button]:last-child`); await sleep(400);
  check("an action closes it", await state(), "closed");
  await open(fw, 1); await p.clickSel(T); await sleep(450);
  check("end: full height against the right edge, 400px, radius on the inner corners", [...(await box()).slice(1, 3), Math.round((await p.rect(S)).w), await q(`getComputedStyle(document.querySelector(${JSON.stringify(S)})).borderTopLeftRadius`)], [0, 1280, 400, "14px"]);
  check("end: no grabber; footer at the bottom", await q(`(()=>{const c=document.querySelector(${JSON.stringify(S)});const f=c.querySelector("[data-slot=drawer-footer]").getBoundingClientRect();return [!!c.querySelector("[data-slot=drawer-grabber]"),Math.abs(f.bottom-c.getBoundingClientRect().bottom)<=0.5]})()`), [false, true]);
  await p.clickSel(`${S} [data-slot=drawer-footer] > [data-slot=button]:first-child`); await sleep(300);
  check("an action with close: false keeps it open", await state(), "open");
  await open(fw, 2); await p.clickSel(T); await sleep(450);
  check("start: against the left edge", (await box())[0], 0);
  await open(fw, 3); await p.clickSel(T); await sleep(450);
  check("closable false: no close button", await q(`!!document.querySelector("${S} [data-drawer=close]")`), false);
  check("the trigger and footer actions are in the app's shape: pills", await shapes(`${T}, ${S} [data-slot=drawer-footer] > [data-slot=button]`), ["pill", "pill"]);
  await q(`document.documentElement.dataset.shape="rounded"`); await sleep(60);
  check("in a rounded app (data-shape on <html>) they are rounded", await shapes(`${T}, ${S} [data-slot=drawer-footer] > [data-slot=button]`), ["rounded", "rounded"]);
  await q(`delete document.documentElement.dataset.shape`);

  /* worst cases */
  await p.viewport(1280, 400, 1.25, false);
  await open(fw, 0, "&data=worst"); await p.clickSel(T); await sleep(450);
  check("worst, 400px high: the sheet stays inside the viewport (48px of page above it) and its body scrolls", await q(`(()=>{const c=document.querySelector(${JSON.stringify(S)});const b=c.getBoundingClientRect();const body=c.querySelector("[data-slot=drawer-body]");return [b.top>=47.5,b.bottom<=innerHeight+0.5,body.scrollHeight>body.clientHeight,getComputedStyle(body).overflowY,c.scrollWidth<=c.clientWidth]})()`), [true, true, true, "auto", true]);
  await p.viewport(1280, 900, 1.25, false);
  await open(fw, 2, "&data=worst&dir=rtl"); await p.clickSel(T); await sleep(450);
  check("rtl: the end panel is on the left", (await box())[0], 0);
  await p.viewport(320, 640, 1.25, true);
  await open(fw, 0); await p.clickSel(T); await sleep(450);
  check("320px phone: full width, footer Buttons inside it", await q(`(()=>{const c=document.querySelector(${JSON.stringify(S)});const b=c.getBoundingClientRect();return [Math.round(b.width),[...c.querySelectorAll("[data-slot=drawer-footer] [data-slot=button]")].every((e)=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=320})]})()`), [320, true]);
  await p.viewport(1280, 900, 1.25, false);
  /* reduced motion: motion.sheet-shift is 0%, so the sheet fades in place, no travel */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 0); await p.clickSel(T); await sleep(30);
  const reduced = await q(`document.getAnimations().filter((a)=>a.effect?.target?.matches?.(${JSON.stringify(S)})).map((a)=>{const k=a.effect.getKeyframes();return a.transitionProperty+" "+k.at(0)[a.transitionProperty]})`);
  check("reduced motion: the sheet fades in (opacity 0 →), its translate carries no travel (0%)", [reduced.some((x)=>x==="opacity 0"),reduced.filter((x)=>x.startsWith("translate")).every((x)=>/ 0%$|^translate 0px 0%$|none/.test(x))], [true, true]);
  await p.media([]); await sleep(450);
  await open(fw, 0, "&theme=dark"); await p.clickSel(T); await sleep(450);
  check("dark: the dark surface", await q(`getComputedStyle(document.querySelector(${JSON.stringify(S)})).backgroundColor`), await q(`(()=>{const d=document.createElement("div");d.style.backgroundColor="var(--fndn-surface)";document.body.append(d);const v=getComputedStyle(d).backgroundColor;d.remove();return v})()`));

  /* Mounted open: nothing animates because it mounted. The example is mounted in the page and its
   * first frames are read there: sheet and backdrop at rest (no travel, full opacity, no transition
   * running). Its close and a later open from the pointer still animate. */
  const frames = (mount) => q(`(async()=>{${mount}const out=[];for(let i=0;i<4;i++){await new Promise((r)=>requestAnimationFrame(r));const c=document.querySelector(${JSON.stringify(S)}),b=document.querySelector("[data-slot=drawer-backdrop]");out.push([c?.dataset.state,getComputedStyle(c).opacity,getComputedStyle(c).translate,getComputedStyle(b).opacity,c.getAnimations().length+b.getAnimations().length])}return out})()`);
  const moving = (out) => out.some(([, o, t, bo, n]) => o !== "1" || t !== "none" || bo !== "1" || n > 0);
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=none`, 300); await sleep(300);
  const mFirst = await frames(`const m=await import("/src/harness/mount.ts");const spec=await (await import("/src/harness/specs.ts")).specOf("drawer");await m.mountExample(document.querySelector("#stage"),spec,${JSON.stringify(fw)},spec.examples.findIndex((e)=>e.name==="Mounted open"));`);
  check("mounted open: drawn at once, sheet and backdrop at rest from the first frame", [mFirst[0]?.[0], moving(mFirst)], ["open", false]);
  await p.clickSel(`${S} [data-drawer=close]`);
  const mLeaving = await frames("");
  check("mounted open: its close from the pointer still slides out", [mLeaving[0]?.[0], moving(mLeaving), await q(`document.querySelector(${JSON.stringify(S)}).hasAttribute("data-mounted-open")`)], ["closed", true, false]);
  await sleep(450);
  const mReopen = await frames(`document.querySelector(${JSON.stringify(T)}).click();`);
  check("mounted open: opened again from the pointer, it slides in", [mReopen[mReopen.length - 1]?.[0], moving(mReopen)], ["open", true]);
  await sleep(450);
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await p.viewport(1280, 900, 1.25, false); await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
