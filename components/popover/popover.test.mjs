// Keyboard and pointer contract of the Popover, run against every target through the harness.
//   node components/popover/popover.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const T = "#stage [data-popover=trigger]";
const C = "[data-slot=popover-content]";
const p = await launch();
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js).catch((e) => `error: ${e.message.split("\n")[0].slice(0, 120)}`);
  const state = () => q(`document.querySelector(${JSON.stringify(C)}).getAttribute("data-state")`);
  const focusOnTrigger = () => q(`document.activeElement === document.querySelector(${JSON.stringify(T)})`);
  const focusInside = () => q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return c===document.activeElement||c.contains(document.activeElement)})()`);

  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=popover&fw=${fw}&ex=0`, 300); await ready();
  check("trigger announces a dialog", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});return [t.getAttribute("aria-haspopup"),t.getAttribute("aria-expanded")]})()`), ["dialog", "false"]);
  await p.clickSel(T).catch(() => {}); await sleep(350);
  check("click opens, focus moves to the close button", [await state(), await q(`document.activeElement?.matches("[data-popover=close]")`)], ["open", true]);
  check("surface is a labelled dialog", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return [c.getAttribute("role"),document.getElementById(c.getAttribute("aria-labelledby"))?.textContent.trim()]})()`), ["dialog", "Share this rollout plan"]);
  check("surface sits 6px under its trigger, start-aligned (±1px)", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();const b=document.querySelector(${JSON.stringify(C)}).getBoundingClientRect();return Math.abs(b.top-t.bottom-6)<=1&&Math.abs(b.left-t.left)<=1})()`), true);
  check("surface scales out of the trigger (--transform-origin from the positioner)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(C)})).getPropertyValue("--transform-origin").trim().length > 0`), true);
  check("surface is the shared popup (recipe popup) with its own 12px padding", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});const s=getComputedStyle(c);return [c.classList.contains("origin-(--transform-origin)"),s.paddingTop,s.borderTopLeftRadius,s.zIndex,getComputedStyle(c.parentElement).zIndex]})()`), [true, "12px", "10px", "auto", "50"]);
  check("close is a 24px square rounded ghost Button", await q(`(()=>{const b=document.querySelector("[data-popover=close]");const r=b.getBoundingClientRect();return [b.dataset.slot==="button",r.width,r.height]})()`), [true, 24, 24]);
  await p.key("Escape"); await sleep(250);
  check("Escape closes and returns focus to the trigger", [await state(), await focusOnTrigger()], ["closed", true]);
  await p.clickSel(T).catch(() => {}); await sleep(350);
  const cb = await q(`(()=>{const r=document.querySelector("[data-popover=close]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await p.hover(cb.x, cb.y); await sleep(800);
  check("hovering the close button shows its tooltip", await q(`[...document.querySelectorAll("[data-slot=tooltip][data-state=open] [data-slot=tooltip-label]")].map((t)=>t.textContent)`), ["Close"]);
  await p.click(cb.x, cb.y); await sleep(300);
  check("clicking it closes and returns focus", [await state(), await focusOnTrigger()], ["closed", true]);
  await p.key("Enter"); await sleep(250);
  check("Enter on the trigger opens; keyboard open is instant", [await state(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(C)})).transitionDuration.split(",").every((d)=>parseFloat(d)===0)`)], ["open", true]);
  await p.key("Enter"); await sleep(250);
  check("Enter on the close button closes and returns focus", [await state(), await focusOnTrigger()], ["closed", true]);
  await p.clickSel(T).catch(() => {}); await sleep(300);
  await p.click(20, 20); await sleep(300);
  check("click outside closes", await state(), "closed");
  await p.clickSel(T).catch(() => {}); await sleep(300);
  await p.clickSel(T).catch(() => {}); await sleep(300);
  check("trigger click toggles it closed", [await state(), await focusOnTrigger()], ["closed", true]);

  /* plain: nothing focusable inside, so the surface itself takes focus; placement top */
  await p.goto(`${BASE}/harness.html?c=popover&fw=${fw}&ex=1`, 300); await ready();
  await p.clickSel(T).catch(() => {}); await sleep(350);
  check("plain: opens above its trigger", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();const b=document.querySelector(${JSON.stringify(C)}).getBoundingClientRect();return [document.querySelector(${JSON.stringify(C)}).getAttribute("data-state"),Math.abs(t.top-b.bottom-6)<=1]})()`), ["open", true]);
  check("plain: focus moves to the surface", await focusInside(), true);
  await p.key("Escape"); await sleep(250);
  check("plain: Escape closes and returns focus", [await state(), await focusOnTrigger()], ["closed", true]);
  /* Mounted open: nothing animates because it mounted. The example is mounted in the page and its
   * first frames are read there: the surface at its final opacity and scale, no transition running.
   * Its close and a later open from the pointer still animate. */
  const frames = (mount, want) => q(`(async()=>{${mount}const c=()=>document.querySelector(${JSON.stringify(C)});for(let t=0;t<120&&c()?.dataset.state!==${JSON.stringify(want)};t++)await new Promise((r)=>requestAnimationFrame(r));const out=[];for(let i=0;i<4;i++){await new Promise((r)=>requestAnimationFrame(r));out.push([c().dataset.state,getComputedStyle(c()).opacity,getComputedStyle(c()).transform,c().getAnimations().length])}return out})()`);
  const moving = (out) => !Array.isArray(out) || out.some(([, o, t, n]) => o !== "1" || t !== "matrix(1, 0, 0, 1, 0, 0)" || n > 0);
  await p.goto(`${BASE}/harness.html?c=none`, 300); await sleep(300);
  const mFirst = await frames(`const m=await import("/src/harness/mount.ts");const spec=await (await import("/src/harness/specs.ts")).specOf("popover");await m.mountExample(document.querySelector("#stage"),spec,${JSON.stringify(fw)},spec.examples.findIndex((e)=>e.name==="Mounted open"));`, "open");
  check("mounted open: drawn at once, at rest from the first frame", [mFirst[0]?.[0], moving(mFirst)], ["open", false]);
  await p.click(5, 5);
  const mLeaving = await frames("", "closed");
  check("mounted open: its close from the pointer still animates", [mLeaving[0]?.[0], moving(mLeaving), await q(`document.querySelector(${JSON.stringify(C)}).hasAttribute("data-mounted-open")`)], ["closed", true, false]);
  await sleep(300);

  const mReopen = await frames(`document.querySelector(${JSON.stringify(T)}).click();`, "open");
  check("mounted open: opened again from the pointer, it animates", [mReopen[0]?.[0], moving(mReopen)], ["open", true]);
  await sleep(300);
  check("no console errors", p.errors.slice(0, 2), []);
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
