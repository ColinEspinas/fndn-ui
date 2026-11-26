// Contract of the Agent Screen, run against every target and every example through the harness:
// text alternative, status announcements, the cursor's position and travel, reduced motion.
//   node components/agent-screen/agent-screen.test.mjs            all four targets
//   node components/agent-screen/agent-screen.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=agent-screen]";
/* hover: true makes headless Chromium report a mouse, so tooltips open on hover */
const p = await launch({ hover: true });
let failed = 0;

/* the timed transitions of an element: [property, duration, easing] for each one that lasts */
const timed = (sel) => p.eval(`(()=>{const s=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));const sp=(v)=>v.split(/,(?![^(]*\\))/).map((x)=>x.trim());const p=sp(s.transitionProperty),d=sp(s.transitionDuration),e=sp(s.transitionTimingFunction),l=sp(s.transitionDelay);return p.map((x,i)=>[x,d[i%d.length],e[i%e.length],l[i%l.length]]).filter((t)=>parseFloat(t[1])>0||parseFloat(t[3])>0).map((t)=>t.slice(0,3)).sort((a,b)=>a[0]<b[0]?-1:1)})()`);
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js).catch((e) => `error: ${String(e.message).slice(0, 80)}`);
  const open = async (ex) => {
    p.errors.length = 0;
    await p.media([]);
    await p.goto(`${BASE}/harness.html?c=agent-screen&fw=${fw}&ex=${ex}`, 300);
    for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
    await sleep(400);
  };
  /* where the cursor's tip sits, in percent of the frame (from the computed transform) */
  const cursorAt = () => q(`(()=>{const f=document.querySelector('${R} [data-slot=agent-screen-frame]').getBoundingClientRect();const m=new DOMMatrix(getComputedStyle(document.querySelector('${R} [data-slot=agent-screen-cursor]')).transform);return [Math.round(m.m41/f.width*100),Math.round(m.m42/f.height*100)]})()`);
  const visible = (part) => q(`(()=>{const s=getComputedStyle(document.querySelector('${R} [data-slot=agent-screen-${part}]'));return s.visibility==="visible"&&s.opacity==="1"})()`);
  const status = () => q(`document.querySelector('${R} [role=status]').textContent.trim()`);

  /* Live */
  await open(0);
  check("frame is an image with a text alternative", await q(`(()=>{const f=document.querySelector('${R} [data-slot=agent-screen-frame]');return [f.getAttribute("role"),f.getAttribute("aria-label")]})()`), ["img", "Agent's screen"]);
  check("caption, and exactly one status region", await q(`[document.querySelector('${R} figcaption').textContent.trim(), document.querySelectorAll('${R} [role=status]').length]`), ["Agent's screen", 1]);
  check("status says the state", await status(), "Agent's screen: Live");
  check("placeholder drawn when there is no src; nothing focusable", await q(`[!!document.querySelector('${R} [data-slot=agent-screen-placeholder]'), !document.querySelector('${R} img'), !document.querySelector('${R} a, ${R} button, ${R} [tabindex]')]`), [true, true, true]);
  check("frame is 16:10", await q(`(()=>{const b=document.querySelector('${R} [data-slot=agent-screen-frame]').getBoundingClientRect();return Math.round(b.width/b.height*100)/100})()`), 1.6);
  check("cursor sits at x 42%, y 53%", await cursorAt(), [42, 53]);
  check("cursor shown while live, REC hidden", [await visible("cursor"), await visible("rec")], [true, false]);
  check("cursor travels on transform, duration.slow, easing.in-out-strong", await timed(`${R} [data-slot=agent-screen-cursor]`), [["opacity", "0.15s", "ease"], ["transform", "0.25s", "cubic-bezier(0.77, 0, 0.175, 1)"]]);
  await q(`document.querySelector('${R} [data-slot=agent-screen-cursor]').style.setProperty("--fndn-agent-screen-cursor", "80%, 20%")`);
  await sleep(110);
  const mid = await cursorAt();
  check("a new position is reached by a glide, not a jump", mid[0] > 42 && mid[0] < 80 && mid[1] < 53 && mid[1] > 20, true);
  await sleep(300);
  check("and arrives at x 80%, y 20%", await cursorAt(), [80, 20]);
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]); await sleep(50);
  check("reduced motion: only the fade remains", await timed(`${R} [data-slot=agent-screen-cursor]`).then((t) => t.map((x) => x[0])), ["opacity"]);
  await q(`document.querySelector('${R} [data-slot=agent-screen-cursor]').style.setProperty("--fndn-agent-screen-cursor", "10%, 90%")`);
  await sleep(40);
  check("reduced motion: the cursor jumps", await cursorAt(), [10, 90]);
  await p.media([]);
  const errs0 = p.errors.slice(0, 2);

  /* Recording */
  await open(1);
  await sleep(250);
  check("recording: REC badge shown, status says so", [await visible("rec"), await status()], [true, "Atlas's screen: Live, Recording"]);
  check("recording: cursor at x 68%, y 30%", await cursorAt(), [68, 30]);
  check("REC pulses on opacity only", await q(`(()=>{const s=getComputedStyle(document.querySelector('${R} [data-slot=agent-screen-rec-dot]'));return [s.animationName, s.animationIterationCount]})()`), ["fndn-agent-screen-pulse", "infinite"]);
  check("REC sits in the placeholder's title bar, clear of its three dots", await q(`(()=>{const c=document.querySelector('${R} [data-slot=agent-screen-chrome]').getBoundingClientRect();const r=document.querySelector('${R} [data-slot=agent-screen-rec]').getBoundingClientRect();return [r.left>c.left+40, r.top>=c.top-0.5, r.bottom<=c.bottom+0.5, Math.round(c.right-r.right)]})()`), [true, true, true, 8]);
  const errs1 = p.errors.slice(0, 2);

  /* Loading */
  await open(2);
  check("loading: spinner overlay shown, cursor hidden", [await visible("loading"), await visible("cursor")], [true, false]);
  check("loading: status says connecting", await status(), "Agent's screen: Connecting…");
  const errs2 = p.errors.slice(0, 2);

  /* Image */
  await open(3);
  check("image: the capture covers the frame, alt on the frame", await q(`(()=>{const i=document.querySelector('${R} img[data-slot=agent-screen-media]');const f=document.querySelector('${R} [data-slot=agent-screen-frame]').getBoundingClientRect();const b=i?.getBoundingClientRect();return [!!i, i?.getAttribute("alt"), !!b && Math.abs(b.width-f.width)<1 && Math.abs(b.height-f.height)<1, document.querySelector('${R} [data-slot=agent-screen-frame]').getAttribute("aria-label"), !document.querySelector('${R} [data-slot=agent-screen-placeholder]')]})()`), [true, "", true, "A gradient test card on the agent's screen", true]);
  check("image: idle hides the cursor", await visible("cursor"), false);
  const errs3 = p.errors.slice(0, 2);

  /* Expandable: a button with our tooltip opens the screen larger in our dialog */
  await open(4);
  const EXP = `${R} [data-agent-screen=expand]`;
  const dlg = `[...document.querySelectorAll("[data-slot=dialog-content]")].find((c)=>c.querySelector("[data-slot=agent-screen-viewer]"))`;
  check("expand: a Button (outline xs square rounded) named for its action, on the frame's bottom end corner", await q(`(()=>{const b=document.querySelector('${EXP}');const f=document.querySelector('${R} [data-slot=agent-screen-frame]').getBoundingClientRect();const r=b.getBoundingClientRect();return [b.dataset.slot==="button",Math.round(r.width)===Math.round(r.height),b.getAttribute("aria-label"),b.getAttribute("aria-haspopup"),Math.round(f.right-r.right),Math.round(f.bottom-r.bottom)]})()`), [true, true, "Expand screen", "dialog", 8, 8]);
  check("expand: paints above the frame (topmost at its centre)", await q(`(()=>{const b=document.querySelector('${EXP}');const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()`), true);
  const eb = await p.rect(EXP);
  await p.hover(eb.cx, eb.cy); await sleep(700);
  check("expand: hover shows our tooltip with its name", await q(`[...document.querySelectorAll("[data-slot=tooltip]")].filter((t)=>t.getAttribute("data-state")==="open").map((t)=>t.textContent.trim())`), ["Expand screen"]);
  await p.hover(5, 5); await sleep(300);
  check("expand: the viewer dialog starts closed", await q(`${dlg}?.getAttribute("data-state") ?? "missing"`), "closed");
  await p.click(5, 5);
  for (let i = 0; i < 4 && !(await q(`document.activeElement===document.querySelector('${EXP}')`)); i++) await p.key("Tab");
  check("expand: Tab reaches the button", await q(`document.activeElement===document.querySelector('${EXP}')`), true);
  await p.key("Enter"); await sleep(450);
  check("Enter opens the viewer: our dialog, titled by the label, focus inside", await q(`(()=>{const c=${dlg};return [c?.getAttribute("data-state"),c?.getAttribute("role"),c?.querySelector("[data-slot=dialog-title]")?.textContent.trim(),!!c&&c.contains(document.activeElement)]})()`), ["open", "dialog", "Agent's screen", true]);
  check("the viewer holds the frame, larger, with the card's state", await q(`(()=>{const c=${dlg};const v=c.querySelector("[data-slot=agent-screen-viewer]");const big=v.querySelector("[data-slot=agent-screen-frame]").getBoundingClientRect();const small=document.querySelector('${R} [data-slot=agent-screen-frame]').getBoundingClientRect();return [getComputedStyle(v.querySelector("[data-slot=agent-screen-cursor]")).opacity==="1"?"live":"not live",getComputedStyle(v.querySelector("[data-slot=agent-screen-rec]")).opacity==="1",big.width>small.width*1.5,Math.round(big.width/big.height*100)/100,getComputedStyle(v.querySelector("[data-slot=agent-screen-rec]")).visibility]})()`), ["live", true, true, 1.6, "visible"]);
  await p.key("Escape"); await sleep(400);
  check("Escape closes the viewer and focus returns to the button", await q(`[${dlg}?.getAttribute("data-state") ?? "missing", document.activeElement===document.querySelector('${EXP}')]`), ["closed", true]);
  await p.clickSel(EXP); await sleep(450);
  check("a click opens it too", await q(`${dlg}?.getAttribute("data-state")`), "open");
  await p.key("Escape"); await sleep(400);
  check("no console errors", [...errs0, ...errs1, ...errs2, ...errs3, ...p.errors].slice(0, 2), []);

  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
