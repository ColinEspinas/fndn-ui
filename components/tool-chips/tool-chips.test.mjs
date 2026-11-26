// Keyboard, pointer, semantics and alignment contract of Tool Chips, run against every target.
//   node components/tool-chips/tool-chips.test.mjs            all four targets
//   node components/tool-chips/tool-chips.test.mjs react      one target
// Measured at device pixel ratio 2 with a real mouse (gated hover rules apply).
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2, hover: true });
let failed = 0;

async function open(fw, ex = 0, extra = "") {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=tool-chips&fw=${fw}&ex=${ex}${extra}`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  /* the stage centres its content: pin it to the top so a growing region does not move what is above it */
  await p.eval(`document.body.style.placeItems = "start center"`);
  await sleep(700);
}
const q = (js) => p.eval(js);
const H = "#stage [data-slot=tool-chips]>[data-slot=collapsible] > [data-slot=collapsible-trigger]";
const RUN = "#stage [data-slot=tool-chips]>[data-slot=collapsible] > [data-slot=collapsible-content]";
const steps = `[...document.querySelectorAll("#stage [data-slot=tool-chips-rows]>[data-slot=collapsible]")]`;
const rows = `${steps}.map((s)=>s.querySelector(":scope > [data-slot=collapsible-trigger]"))`;
const centre = (child, parent) => q(`(()=>{const c=${child},b=${parent};if(!c||!b)return null;const r=c.getBoundingClientRect(),s=b.getBoundingClientRect();return [Math.round((r.x+r.width/2-(s.x+s.width/2))*4)/4, Math.round((r.y+r.height/2-(s.y+s.height/2))*4)/4]})()`);
/* [caret, glyph] opacity of a step row */
const swap = (i) => q(`(()=>{const t=${rows}[${i}];return [getComputedStyle(t.querySelector("[data-slot=collapsible-caret]")).opacity, getComputedStyle(t.querySelector("[data-slot=tool-chips-icon]")).opacity]})()`);
const angle = (sel) => q(`(()=>{const t=getComputedStyle(${sel}).transform;if(t==="none")return 0;const m=new DOMMatrix(t);return Math.round(Math.atan2(m.b,m.a)*180/Math.PI)})()`);
const card = () => q(`(()=>{const c=[...document.querySelectorAll("[data-slot=hover-card-content]")].find((n)=>n.getAttribute("data-state")==="open"&&!n.hidden);return c?c.querySelector("[data-slot=hover-card-title]").textContent+":"+c.querySelectorAll("[data-slot=hover-card-line]").length:null})()`);

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  try {
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  await open(fw);
  check("the run and every step are collapsibles: button with aria-expanded + aria-controls → its region", await q(`[document.querySelector(${JSON.stringify(H)}), ...${rows}].map((t)=>{const r=document.getElementById(t.getAttribute("aria-controls"));return t.tagName+":"+t.getAttribute("aria-expanded")+":"+(r?r.dataset.slot:"none")+":"+(r?r.hidden:"")+":"+t.parentElement.dataset.slot})`),
    ["BUTTON:true:collapsible-content:false:collapsible", "BUTTON:false:collapsible-content:true:collapsible", "BUTTON:true:collapsible-content:false:collapsible", "BUTTON:false:collapsible-content:true:collapsible", "BUTTON:false:collapsible-content:true:collapsible"]);
  check("open row shows its caret (turned down), not its glyph", [await swap(1), await angle(`${rows}[1].querySelector("[data-slot=collapsible-caret]")`)], [["1", "0"], 90]);
  check("closed row shows its glyph; its caret points right", [await swap(0), await angle(`${rows}[0].querySelector("[data-slot=collapsible-caret]")`)], [["0", "1"], 0]);
  check("glyph lies exactly over the caret", await centre(`${rows}[0].querySelector("[data-slot=tool-chips-icon]")`, `${rows}[0].querySelector("[data-slot=collapsible-caret]")`), [0, 0]);
  check("row is 28px; value chip centred on it", [await q(`${rows}[0].getBoundingClientRect().height`), await centre(`${rows}[0].querySelector("[data-slot=tool-chips-value]")`, `${rows}[0]`).then((c) => c && c[1])], [28, 0]);
  check("header caret centred on its text", await q(`(()=>{const c=document.querySelector(${JSON.stringify(H)} + " > [data-slot=collapsible-caret]").getBoundingClientRect(),t=document.querySelector(${JSON.stringify(H)} + " > [data-slot=collapsible-label]").getBoundingClientRect();return Math.abs((c.y+c.height/2)-(t.y+t.height/2))<=0.5})()`), true);
  check("diff chips are hover-card triggers; labels centred in the chip", [await q(`[...document.querySelectorAll("#stage [data-slot=tool-chips-diff]")].every((b)=>b.matches("[data-hover-card=trigger][data-state]")&&b.closest("[data-slot=hover-card]"))`), await centre(`document.querySelector("#stage [data-slot=tool-chips-diff] [data-slot=tool-chips-add]")`, `document.querySelector("#stage [data-slot=tool-chips-diff]")`).then((c) => c && Math.abs(c[1]) <= 0.5)], [true, true]);
  check("truncated text carries title", await q(`${rows}.every((r)=>r.querySelector("[data-slot=tool-chips-label]").title && r.querySelector("[data-slot=tool-chips-value]").title)`), true);
  check("+2 more shares a line with the last file chip", await q(`(()=>{const m=document.querySelector("#stage [data-slot=tool-chips-more]").getBoundingClientRect(),c=[...document.querySelectorAll("#stage [data-slot=tool-chips-diff]")].pop().getBoundingClientRect();return Math.abs(m.y+m.height/2-(c.y+c.height/2))<0.5})()`), true);

  /* pointer: hovering a closed row swaps its glyph for the caret; the trigger hovers --fndn-hover */
  const r0 = await q(`(()=>{const b=${rows}[0].getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  await p.hover(r0.x, r0.y); await sleep(250);
  check("hover swaps the glyph for the caret; row fill is --fndn-hover", [await swap(0), await q(`getComputedStyle(${rows}[0]).backgroundColor === getComputedStyle(document.documentElement).getPropertyValue("--fndn-hover").trim() || getComputedStyle(${rows}[0]).backgroundColor`)], [["1", "0"], true]);
  /* pointer close of an open row: the reveal plays, then the region leaves the layout */
  const r1 = await q(`(()=>{const b=${rows}[1].getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  const below = await q(`${rows}[2].getBoundingClientRect().y`);
  await p.click(r1.x, r1.y);
  const ys = [];
  for (let i = 0; i < 10; i++) { ys.push(await q(`${rows}[2].getBoundingClientRect().y`)); await sleep(20); }
  await sleep(300);
  const settled = await q(`${rows}[2].getBoundingClientRect().y`);
  check("pointer close: the row below moves up with the region, monotonic, then the region is hidden", [ys.every((y, i) => i === 0 || y <= ys[i - 1] + 0.01) && ys.some((y) => y < below - 1 && y > settled + 1), await q(`document.getElementById(${rows}[1].getAttribute("aria-controls")).hidden`)], [true, true]);
  await p.click(r1.x, r1.y); await sleep(400);

  /* the diff card: pointer hover opens it after the hover-card's delay */
  const chip = await q(`(()=>{const b=document.querySelector("#stage [data-slot=tool-chips-diff]").getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  await p.hover(chip.x, chip.y); await sleep(600);
  check("hovering a diff chip opens its hover-card with the file's diff", await card(), "invoices.css:5");
  await p.hover(5, 5); await sleep(600);
  check("leaving it closes the card", await card(), null);

  /* keyboard */
  await q(`document.querySelector(${JSON.stringify(H)}).focus()`);
  await p.key("Tab");
  check("Tab goes from the header to the first row", await q(`document.activeElement === ${rows}[0]`), true);
  await sleep(200);
  check("keyboard focus swaps the glyph for the caret", await swap(0), ["1", "0"]);
  const kb = await q(`${rows}[1].getBoundingClientRect().y`);
  await p.key("Enter"); await sleep(40);
  const kbNow = await q(`${rows}[1].getBoundingClientRect().y`);
  await sleep(300);
  const kbSettled = await q(`${rows}[1].getBoundingClientRect().y`);
  check("Enter expands the row instantly; focus stays", [await q(`[${rows}[0].getAttribute("aria-expanded"), document.getElementById(${rows}[0].getAttribute("aria-controls")).hidden, document.activeElement === ${rows}[0]]`), kbSettled > kb, Math.abs(kbNow - kbSettled) < 0.5], [["true", false, true], true, true]);
  await p.key(" "); await sleep(60);
  check("Space collapses it again; the detail is hidden at once", await q(`[${rows}[0].getAttribute("aria-expanded"), document.getElementById(${rows}[0].getAttribute("aria-controls")).hidden]`), ["false", true]);
  for (let i = 0; i < 4; i++) await p.key("Tab");
  await sleep(650); /* the hover-card open delay is 500ms */
  check("Tab reaches the first diff chip after the rows; focus opens its card", [await q(`document.activeElement === document.querySelector("#stage [data-slot=tool-chips-diff]")`), await card()], [true, "invoices.css:5"]);
  await p.key("Tab"); await sleep(650);
  check("Tab to the next chip moves the card with it", [await q(`document.activeElement === document.querySelectorAll("#stage [data-slot=tool-chips-diff]")[1]`), await card()], [true, "InvoiceSchedule.tsx:5"]);
  await q(`document.querySelector(${JSON.stringify(H)}).focus()`); await sleep(400);
  await p.key("Enter"); await sleep(60);
  check("Enter on the header collapses the run at once; focus stays", await q(`[document.querySelector(${JSON.stringify(H)}).getAttribute("aria-expanded"), document.querySelector(${JSON.stringify(RUN)}).hidden, getComputedStyle(document.querySelector(${JSON.stringify(RUN)})).visibility, document.activeElement === document.querySelector(${JSON.stringify(H)})]`), ["false", true, "hidden", true]);
  await p.key("Tab");
  check("collapsed run is out of the tab order", await q(`!document.activeElement.closest("[data-slot=tool-chips]>[data-slot=collapsible] > [data-slot=collapsible-content]")`), true);
  await q(`document.querySelector(${JSON.stringify(H)}).focus()`);
  await p.key(" "); await sleep(60);
  check("Space expands the run again; no step replays its entrance", [await q(`document.querySelector(${JSON.stringify(H)}).getAttribute("aria-expanded")`), await q(`document.getAnimations().filter((a)=>a.animationName==="fndn-fade-up"&&a.playState==="running").length`)], ["true", 0]);

  /* press feedback: the diff chip is the hover-card trigger, which scales */
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: chip.x, y: chip.y });
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: chip.x, y: chip.y, button: "left", clickCount: 1 });
  await sleep(250);
  check("diff chip scales on press", await q(`getComputedStyle(document.querySelector("#stage [data-slot=tool-chips-diff]")).transform`), "matrix(0.97, 0, 0, 0.97, 0, 0)");
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: chip.x, y: chip.y, button: "left", clickCount: 1 });
  await p.hover(5, 5);

  /* the scenario's fourth chip: "+2 more" stays with it */
  await open(fw, 0, "&step=3");
  check("step 3 (four chips): +2 more shares a line with the last chip", await q(`(()=>{const m=document.querySelector("#stage [data-slot=tool-chips-more]").getBoundingClientRect(),c=[...document.querySelectorAll("#stage [data-slot=tool-chips-diff]")].pop().getBoundingClientRect();return Math.abs(m.y+m.height/2-(c.y+c.height/2))<0.5&&m.x+m.width<=document.querySelector("#stage [data-slot=tool-chips-diffs]").getBoundingClientRect().right+0.5})()`), true);

  /* a step that arrives makes its room as it fades: the diffs below slide, they do not jump */
  await p.goto(`${BASE}/harness.html?c=tool-chips&fw=${fw}&ex=0&play=1`, 300);
  await q(`document.body.style.placeItems = "start center"`);
  await q(`window.__ys=[];window.__room=false;(function t(){const d=document.querySelector("#stage [data-slot=tool-chips-diffs]");if(d)__ys.push(Math.round(d.getBoundingClientRect().y));if(document.querySelector("#stage [data-slot=tool-chips-rows]>[data-slot=collapsible]")?.parentElement&&[...document.querySelectorAll("#stage [data-slot=tool-chips-rows]>[data-slot=collapsible]")].some((s)=>s.getAnimations().some((a)=>a.transitionProperty==="grid-template-rows")))__room=true;if(__ys.length<240)requestAnimationFrame(t)})()`);
  await sleep(4000);
  check("an arriving step opens its room (grid-template-rows), so the diffs never jump down more than 12px in a frame", await q(`[__room, __ys.every((y,i)=>i===0||y-__ys[i-1]<=12)]`), [true, true]);
  check("an arrival after mount enters (plain mount): the steps added fade up; the steps and the diff row present at mount do not", await q(`(()=>{const s=[...document.querySelectorAll("#stage [data-tool-chips=step]")];return [s.length, s.map((e)=>getComputedStyle(e).animationName), getComputedStyle(document.querySelector("#stage [data-slot=tool-chips-diffs]")).animationName]})()`), [6, ["none", "none", "none", "none", "fndn-fade-up", "fndn-fade-up"], "none"]);

  /* right-to-left: closed carets point to the inline end (left) */
  await open(fw, 0, "&dir=rtl");
  check("rtl: a closed row's caret points left, an open one down", [await angle(`${rows}[0].querySelector("[data-slot=collapsible-caret]")`), await angle(`${rows}[1].querySelector("[data-slot=collapsible-caret]")`)], [180, 90]);
  check("rtl: the glyph lies over the caret", await centre(`${rows}[0].querySelector("[data-slot=tool-chips-icon]")`, `${rows}[0].querySelector("[data-slot=collapsible-caret]")`), [0, 0]);
  /* a mount is not an arrival: a plain mount shows its steps and diffs at once; appear opts in */
  await open(fw, 0);
  check("plain mount (appear off by default): the steps and the diff row present at mount have no entrance", await q(`[...document.querySelectorAll("#stage [data-tool-chips=step], #stage [data-slot=tool-chips-diffs]")].map((e)=>getComputedStyle(e).animationName)`), Array(await q(`document.querySelectorAll("#stage [data-tool-chips=step], #stage [data-slot=tool-chips-diffs]").length`)).fill("none"));
  check("appear: the steps fade up and the diff row fades in", await (async () => { await open(fw, 1); return q(`[getComputedStyle(document.querySelector("#stage [data-tool-chips=step]")).animationName, getComputedStyle(document.querySelector("#stage [data-slot=tool-chips-diffs]")).animationName]`); })(), ["fndn-fade-up", "fndn-fade-in"]);
  check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ run aborted — ${String(e.message ?? e).slice(0, 160)}`); }
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
