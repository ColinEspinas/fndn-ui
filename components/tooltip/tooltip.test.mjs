// Keyboard and pointer contract of the Tooltip, run against every target through the harness.
//   node components/tooltip/tooltip.test.mjs [react|vue|svelte …]
// A second tooltip (example 1) is mounted next to the first through the harness's own mount
// module, so the neighbour behaviour is tested in every target.
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch();
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };
const A = "#stage button:nth-of-type(1)";
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js).catch((e) => `error: ${e.message.split("\n")[0].slice(0, 120)}`);
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=tooltip&fw=${fw}&ex=0`, 300); await ready();
  /* the neighbour: example 1 mounted beside example 0, with its own id (two Vue apps on one page
   would otherwise both generate "v-0") */
  await q(`(async()=>{const m=await import("/src/harness/mount.ts");const spec=(await (await import("/src/harness/specs.ts")).specOf("tooltip"));const host=document.createElement("div");host.id="second";host.style.display="contents";document.querySelector("#stage").append(host);const ex=spec.examples[1];await m.mountExample(host,{...spec,examples:[spec.examples[0],{...ex,props:{...ex.props,id:"neighbour"}}]},${JSON.stringify(fw)},1);})()`);
  await sleep(300);
  const tips = () => q(`[...document.querySelectorAll("[data-slot=tooltip]")].filter((n)=>n.getAttribute("data-state")==="open").map((n)=>n.querySelector("[data-slot=tooltip-label]").textContent.trim())`);
  const tip = (label) => `[...document.querySelectorAll("[data-slot=tooltip]")].find((n)=>n.querySelector("[data-slot=tooltip-label]").textContent.trim()===${JSON.stringify(label)})`;
  const a = ((await p.rect(A)) ?? { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 });
  const b = await q(`(()=>{const e=document.querySelector("#second button");const r=e.getBoundingClientRect();return {cx:r.x+r.width/2,cy:r.y+r.height/2}})()`);

  await p.hover(5, 5); await sleep(100);
  await p.hover(a.cx, a.cy); await sleep(200);
  check("hover: nothing yet after 200ms", await tips(), []);
  await sleep(350);
  check("hover: open after the delay (~400ms)", await tips(), ["Copy to clipboard"]);
  check("trigger is described by the chip", await q(`(()=>{const t=document.querySelector(${JSON.stringify(A)});const c=${tip("Copy to clipboard")};return t.getAttribute("aria-describedby")===c.id})()`), true);
  check("chip sits 6px above its trigger (±1px)", await q(`(()=>{const t=document.querySelector(${JSON.stringify(A)}).getBoundingClientRect();const c=${tip("Copy to clipboard")}.getBoundingClientRect();return Math.abs(t.top-c.bottom-6)<=1&&Math.abs((c.left+c.width/2)-(t.left+t.width/2))<=1})()`), true);
  check("the first chip animates in (duration.tooltip)", await q(`getComputedStyle(${tip("Copy to clipboard")}).transitionDuration.split(",")[0]`), "0.125s");
  await p.hover(b.cx, b.cy); await sleep(60);
  check("neighbour opens with no delay", await tips(), ["Send message"]);
  check("neighbour has no animation (data-instant, 0ms)", await q(`(()=>{const c=${tip("Send message")};return [c.hasAttribute("data-instant"),getComputedStyle(c).transitionDuration.split(",").every((d)=>parseFloat(d)===0)]})()`), [true, true]);
  check("neighbour shows its shortcut", await q(`${tip("Send message")}.querySelector("[data-tooltip=shortcut]")?.textContent`), "⌘↵");
  check("the shortcut is the kbd atom, plain, in the muted tooltip colour", await q(`(()=>{const k=${tip("Send message")}.querySelector("[data-slot=kbd]");return [k.tagName,k.dataset.slot==="kbd",getComputedStyle(k.querySelector("[data-slot=kbd-key]")).backgroundColor,k.querySelectorAll("[data-slot=kbd-key]").length,getComputedStyle(k).color===getComputedStyle(document.documentElement).getPropertyValue("--fndn-tooltip-muted").trim()||getComputedStyle(k).color]})()`), ["KBD", true, "rgba(0, 0, 0, 0)", 1, true]);
  await p.hover(5, 5); await sleep(450);
  check("pointer leaves: closed", await tips(), []);
  /* a click during the delay cancels it, even on a trigger whose engine prevents the default of its
   * press (a date picker's calendar button, a menu's trigger: the tooltip engine then ignores it), so
   * no label comes up over what the click opened. After a second away, so the click lands in the
   * delay, not in the neighbours' instant window. */
  await q(`(()=>{const s=document.querySelector("#stage");window.__pd=(e)=>e.preventDefault();for(const n of ["pointerdown","click"])s.addEventListener(n,window.__pd,true)})()`);
  await sleep(1000);
  await p.click(a.cx, a.cy); await sleep(800);
  const quick = await tips();
  await q(`(()=>{const s=document.querySelector("#stage");for(const n of ["pointerdown","click"])s.removeEventListener(n,window.__pd,true)})()`);
  await p.hover(5, 5); await sleep(150); await p.hover(a.cx, a.cy); await sleep(650);
  check("a click during the delay cancels it until the pointer leaves (default prevented too); it opens again after", [quick, await tips()], [[], ["Copy to clipboard"]]);
  await p.hover(5, 5); await sleep(450);

  /* keyboard: focus shows it at once, Escape hides it */
  await p.click(5, 5); await sleep(100);
  await p.key("Tab"); await sleep(80);
  check("keyboard focus shows it at once", await tips(), ["Copy to clipboard"]);
  check("keyboard open is instant", await q(`getComputedStyle(${tip("Copy to clipboard")}).transitionDuration.split(",").every((d)=>parseFloat(d)===0)`), true);
  await p.key("Escape"); await sleep(150);
  check("Escape hides it, focus stays on the trigger", [await tips(), await q(`document.activeElement===document.querySelector(${JSON.stringify(A)})`)], [[], true]);
  await p.key("Tab"); await sleep(80);
  check("Tab to the neighbour shows its tooltip", await tips(), ["Send message"]);
  await p.key("Tab", { shift: true }); await sleep(250);
  check("Shift+Tab back: the neighbour hides, the first shows", await tips(), ["Copy to clipboard"]);
  check("chip takes no pointer events", await q(`getComputedStyle(${tip("Copy to clipboard")}).pointerEvents`), "none");
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
