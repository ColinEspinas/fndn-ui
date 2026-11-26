// Pointer and keyboard contract of the Hover Card, run against every target through the harness.
//   node components/hover-card/hover-card.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const T = "#stage [data-slot=hover-card-trigger]";
const C = "[data-slot=hover-card-content]";
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

  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=hover-card&fw=${fw}&ex=0`, 300); await ready();
  const t = ((await p.rect(T)) ?? { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 });
  await p.hover(5, 5); await sleep(100);
  await p.hover(t.cx, t.cy); await sleep(350);
  check("hover: still closed after 350ms (a pointer crossing the chip does not open it)", await state(), "closed");
  await sleep(300);
  check("hover: open after the open delay (500ms)", await state(), "open");
  check("card sits 6px under its trigger, start-aligned (±1px)", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();const b=document.querySelector(${JSON.stringify(C)}).getBoundingClientRect();return Math.abs(b.top-t.bottom-6)<=1&&Math.abs(b.left-t.left)<=1})()`), true);
  check("diff preview: 288px wide, 10px radius, five tinted lines", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});const s=getComputedStyle(c);return [Math.round(c.getBoundingClientRect().width),s.borderTopLeftRadius,[...c.querySelectorAll("[data-slot=hover-card-line]")].map((l)=>({" ":"ctx","+":"add","−":"del"})[l.querySelector("[data-slot=hover-card-sign]").textContent]).join(",")]})()`), [288, "10px", "ctx,del,add,add,add"]);
  check("surface is the shared popup (recipe popup) without padding of its own; stacked as a popup", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});const s=getComputedStyle(c);return [c.classList.contains("origin-(--transform-origin)"),s.paddingTop,s.boxShadow===(()=>{const d=document.createElement("div");d.className="shadow-raised";document.body.append(d);const v=getComputedStyle(d).boxShadow;d.remove();return v})(),getComputedStyle(c.parentElement).zIndex]})()`), [true, "0px", true, "50"]);
  check("added and removed lines are tinted differently", await q(`(()=>{const bg=(t)=>getComputedStyle([...document.querySelectorAll("[data-slot=hover-card-line]")].find((l)=>l.querySelector("[data-slot=hover-card-sign]").textContent===({ctx:" ",add:"+",del:"−"})[t])).backgroundColor;return bg("add")!==bg("del")&&bg("ctx")==="rgba(0, 0, 0, 0)"})()`), true);
  /* the pointer travels from the trigger into the card: it stays open */
  const c = ((await p.rect(C)) ?? { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 });
  await p.hover(t.cx, c.y - 2); await sleep(40);
  await p.hover(c.cx, c.cy); await sleep(350);
  check("pointer inside the card keeps it open", await state(), "open");
  await p.hover(c.x + c.w + 120, c.cy); await sleep(60);
  check("pointer leaves: still open within the close delay", await state(), "open");
  await sleep(300);
  check("pointer leaves: closed after the close delay (150ms)", await state(), "closed");
  /* a pass over the trigger shorter than the open delay never opens it */
  await p.hover(t.cx, t.cy); await sleep(100); await p.hover(5, 5); await sleep(300);
  check("a quick pass over the trigger does not open it", await state(), "closed");

  /* keyboard */
  await p.click(5, 5); await sleep(100);
  await p.key("Tab"); await sleep(650);
  check("keyboard focus opens it; keyboard open is instant", [await state(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(C)})).transitionDuration.split(",").every((d)=>parseFloat(d)===0)`)], ["open", true]);
  await p.key("Escape"); await sleep(200);
  check("Escape closes, focus stays on the trigger", [await state(), await q(`document.activeElement===document.querySelector(${JSON.stringify(T)})`)], ["closed", true]);

  await p.goto(`${BASE}/harness.html?c=hover-card&fw=${fw}&ex=1`, 300); await ready();
  const t2 = ((await p.rect(T)) ?? { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 });
  await p.hover(5, 5); await sleep(100); await p.hover(t2.cx, t2.cy); await sleep(700);
  check("text card opens above its trigger (top-start)", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();const b=document.querySelector(${JSON.stringify(C)}).getBoundingClientRect();return [document.querySelector(${JSON.stringify(C)}).getAttribute("data-state"),Math.abs(t.top-b.bottom-6)<=1,Math.abs(b.left-t.left)<=1]})()`), ["open", true, true]);
  /* Mounted open: nothing animates because it mounted. The example is mounted in the page and its
   * first frames are read there: the surface at its final opacity and scale, no transition running.
   * Its close and a later open from the pointer still animate. */
  const frames = (mount, want) => q(`(async()=>{${mount}const c=()=>document.querySelector(${JSON.stringify(C)});for(let t=0;t<120&&c()?.dataset.state!==${JSON.stringify(want)};t++)await new Promise((r)=>requestAnimationFrame(r));const out=[];for(let i=0;i<4;i++){await new Promise((r)=>requestAnimationFrame(r));out.push([c().dataset.state,getComputedStyle(c()).opacity,getComputedStyle(c()).transform,c().getAnimations().length])}return out})()`);
  const moving = (out) => !Array.isArray(out) || out.some(([, o, t, n]) => o !== "1" || t !== "matrix(1, 0, 0, 1, 0, 0)" || n > 0);
  await p.goto(`${BASE}/harness.html?c=none`, 300); await sleep(300);
  const mFirst = await frames(`const m=await import("/src/harness/mount.ts");const spec=await (await import("/src/harness/specs.ts")).specOf("hover-card");await m.mountExample(document.querySelector("#stage"),spec,${JSON.stringify(fw)},spec.examples.findIndex((e)=>e.name==="Mounted open"));`, "open");
  check("mounted open: drawn at once, at rest from the first frame", [mFirst[0]?.[0], moving(mFirst)], ["open", false]);
  { const r = await p.rect(T); await p.hover(r.cx, r.cy); await sleep(100); await p.hover(5, 5); }
  const mLeaving = await frames("", "closed");
  check("mounted open: its close from the pointer still animates", [mLeaving[0]?.[0], moving(mLeaving), await q(`document.querySelector(${JSON.stringify(C)}).hasAttribute("data-mounted-open")`)], ["closed", true, false]);
  await sleep(300);
  { const r = await p.rect(T); await p.hover(r.cx, r.cy); }
  const mReopen = await frames("", "open");
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
