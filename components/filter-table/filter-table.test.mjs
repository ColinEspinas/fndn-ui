// Keyboard and pointer contract of the Filter Table, run against every target through the harness.
//   node components/filter-table/filter-table.test.mjs            all four targets
//   node components/filter-table/filter-table.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2, hover: true });
let failed = 0;
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  p.errors.length = 0;
  await p.media([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto(`${BASE}/harness.html?c=filter-table&fw=${fw}&ex=0`, 200);
  const mountRects = [];
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(50); }
  const rectsJs = `[...document.querySelectorAll("#stage [data-slot=segmented-control-option], #stage [data-slot=filter-table-row], #stage [data-slot=filter-table-th]")].map((e)=>{const b=e.getBoundingClientRect();return [b.x,b.y,b.width,b.height].map((n)=>Math.round(n*2)/2).join(",")}).join(" ")`;
  mountRects.push(await p.eval(rectsJs));
  await sleep(600);
  mountRects.push(await p.eval(rectsJs));
  const q = (js) => p.eval(js);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const checked = () => q(`[...document.querySelectorAll("#stage [data-slot=segmented-control-option]")].filter((c)=>c.getAttribute("data-state")==="checked").map((c)=>c.querySelector("input").value).join()`);
  const shown = () => q(`[...document.querySelectorAll("#stage [data-slot=filter-table-row]")].filter((r)=>getComputedStyle(r).visibility==="visible").length`);
  const visibleRows = () => q(`[...document.querySelectorAll("#stage [data-slot=filter-table-row]")].filter((r)=>getComputedStyle(r).visibility==="visible").length`);
  const active = () => q(`(()=>{const a=document.activeElement;return a?.matches?.("[data-slot=segmented-control-input]") ? a.value : (a?.dataset?.slot ?? null)})()`);

  try {
  check("no layout shift after mount", mountRects[0] === mountRects[1], true);
  check("composed: segmented chips with dots and counts, status pills (sm), no local copies", await q(`(()=>{const g=document.querySelector("#stage [data-filter-table=filters]");return [g.dataset.slot==="segmented-control",g.querySelectorAll("[data-slot=segmented-control-dot]").length>0?"chips":"",g.querySelectorAll("[data-slot=segmented-control-dot]").length,g.querySelectorAll("[data-slot=count]").length,[...document.querySelectorAll("#stage [data-slot=filter-table-cell] [data-slot=status-pill][data-filter-table=status]")].filter((t)=>t.getBoundingClientRect().height===22).length,document.querySelectorAll("#stage [data-slot=filter-table-cell] [data-slot=tag]").length]})()`), [true, "chips", 3, 4, 5, 0]);
  check("the built-in statuses are pill tones: In Progress is blue, not a neutral pill", await q(`(()=>{const [a,b]=[...document.querySelectorAll("#stage [data-slot=filter-table-row]")].slice(0,2).map((r)=>getComputedStyle(r.querySelector("[data-filter-table=status]")).backgroundColor);const n=document.createElement("span");n.className="bg-inset";document.body.append(n);const inset=getComputedStyle(n).backgroundColor;n.remove();return [a!==inset,b!==inset,a!==b]})()`), [true, true, true]);
  const statusRowHeight = await q(`document.querySelector("#stage [data-slot=filter-table-cells]").getBoundingClientRect().height`);
  check("chips are one labelled radio group", await q(`(()=>{const g=document.querySelector("#stage [data-filter-table=filters]");return [g.getAttribute("role"), g.getAttribute("aria-label"), g.querySelectorAll('input[type="radio"]').length]})()`), ["radiogroup", "Filter by status", 4]);
  check("radio is named by its chip text and count", await q(`(()=>{const i=document.querySelector('#stage [data-slot=segmented-control-option]:has(input[value=\"todo\"]) input');return document.getElementById(i.getAttribute("aria-labelledby"))?.textContent.replace(/\\s+/g," ").trim()})()`), "To do 2");
  check("All is selected at mount; every row shown", [await checked(), await shown()], ["all", 5]);
  check("table semantics", await q(`[document.querySelector("#stage [data-slot=filter-table-table]").getAttribute("role"), document.querySelectorAll("#stage [role=columnheader]").length, document.querySelectorAll("#stage [data-slot=filter-table-cells][role=row]").length, document.querySelectorAll("#stage [role=cell]").length]`), ["table", 4, 5, 20]);
  check("counts use tabular numbers; the scroll region keeps sideways overscroll in and lets the page scroll on", await q(`[getComputedStyle(document.querySelector("#stage [data-filter-table=filters] [data-slot=count]")).fontVariantNumeric, getComputedStyle(document.querySelector("#stage [data-slot=filter-table-card]")).overscrollBehaviorX, getComputedStyle(document.querySelector("#stage [data-slot=filter-table-card]")).overscrollBehaviorY]`), ["tabular-nums", "contain", "auto"]);

  /* alignment at device pixel ratio 2 */
  const align = await q(`(()=>{
    const r=(e)=>e.getBoundingClientRect();
    const th=[...document.querySelectorAll("#stage [data-slot=filter-table-th]")].map((e)=>[r(e).left,r(e).right]);
    const td=[...document.querySelectorAll("#stage [data-slot=filter-table-cells]")][0].children;
    const cols=[...td].map((e)=>[r(e).left,r(e).right]);
    const edges=th.every((h,i)=>Math.abs(h[0]-cols[i][0])<0.01&&Math.abs(h[1]-cols[i][1])<0.01);
    const pills=[...document.querySelectorAll("#stage [data-slot=filter-table-cell] [data-filter-table=status]")].map((pl)=>{const c=r(pl.parentElement),b=r(pl);return Math.abs((b.top+b.bottom)/2-(c.top+c.bottom)/2)});
    const chips=[...document.querySelectorAll("#stage [data-slot=segmented-control-option]")].map((ch)=>{const c=r(ch),t=r(ch.querySelector("[data-slot=segmented-control-label]"));return Math.abs((t.top+t.bottom)/2-(c.top+c.bottom)/2)});
    const dots=[...document.querySelectorAll("#stage [data-slot=segmented-control-dot]")].map((d)=>{const c=r(d.parentElement),b=r(d);return Math.abs((b.top+b.bottom)/2-(c.top+c.bottom)/2)});
    return {edges, pill:Math.max(...pills)<=0.5, chip:Math.max(...chips)<=0.5, dot:Math.max(...dots)<=0.5};
  })()`);
  check("header and body column edges align; pills, chip text and dots centred (±0.5px)", align, { edges: true, pill: true, chip: true, dot: true });

  /* pointer: a leaving row gives its space back while it fades */
  const progressRow = `document.querySelectorAll("#stage [data-slot=filter-table-row]")[1]`;
  const belowRow = `document.querySelectorAll("#stage [data-slot=filter-table-row]")[2]`;
  const h0 = await q(`${progressRow}.getBoundingClientRect().height`);
  const relTop = `(${belowRow}.getBoundingClientRect().top - document.querySelector("#stage [data-slot=filter-table-table]").getBoundingClientRect().top)`;
  const y0 = await q(relTop);
  await p.clickSel('#stage [data-slot=segmented-control-option]:has(input[value=\"todo\"])');
  await sleep(60);
  const mid = await q(`({h:${progressRow}.getBoundingClientRect().height, o:+getComputedStyle(${progressRow}).opacity, y:${relTop}})`);
  check("mid-collapse: the leaving row shrinks and fades while the row below moves up", [mid.h > 0 && mid.h < h0, mid.o < 1, mid.y < y0], [true, true, true]);
  await sleep(400);
  check("click selects the chip and filters the rows", [await checked(), await shown(), await visibleRows()], ["todo", 2, 2]);
  check("filtered rows leave the layout", await q(`${progressRow}.getBoundingClientRect().height`), 0);
  check("the empty state is hidden while rows match (toggled with hidden, the same in every target)", await q(`document.querySelector("#stage [data-filter-table=empty]")?.hidden`), true);

  /* keyboard: one tab stop, arrows move and select, instantly */
  await q(`document.activeElement?.blur()`);
  await p.click(5, 5);
  await p.key("Tab");
  check("Tab lands on the selected chip", await active(), "todo");
  check("the focused chip shows a ring", await q(`(()=>{const c=document.querySelector('#stage [data-slot=segmented-control-option]:has(input[value=\"todo\"])');return [c.hasAttribute("data-focus-visible"), getComputedStyle(c).outlineStyle]})()`), [true, "solid"]);
  await p.key("ArrowRight"); await sleep(50);
  check("ArrowRight moves and selects", [await active(), await checked()], ["progress", "progress"]);
  check("keyboard filtering is instant", [await shown(), await visibleRows(), await q(`getComputedStyle(${progressRow}).transitionDuration.split(",").every((d)=>parseFloat(d)===0)`)], [2, 2, true]);
  await p.key("ArrowLeft"); await sleep(50);
  check("ArrowLeft moves back", await checked(), "todo");
  await p.key("End"); await sleep(50);
  check("End selects the last chip", [await active(), await checked(), await shown()], ["done", "done", 1]);
  await p.key("Home"); await sleep(50);
  check("Home selects the first chip", [await active(), await checked(), await shown()], ["all", "all", 5]);
  await p.key("Tab");
  check("Tab leaves the group for the table region", await q(`document.activeElement?.getAttribute("data-slot")`), "filter-table-card");
  check("the region shows a focus ring", await q(`getComputedStyle(document.activeElement).outlineStyle`), "solid");
  await p.key("Tab", { shift: true });
  check("Shift+Tab returns to the selected chip", await active(), "all");


  /* row hover: lit and unlit at once (the tables' one hover is instant) */
  {
    const hr = await p.rect(`#stage [data-slot=filter-table-row]:nth-child(3) [data-slot=filter-table-cells]`);
    const paint = () => q(`(()=>{const e=document.querySelector(\`#stage [data-slot=filter-table-row]:nth-child(3) [data-slot=filter-table-cells]\`);const cs=getComputedStyle(e);return [cs.backgroundColor+"|"+cs.backgroundImage, e.getAnimations().filter((a)=>/background/.test(a.transitionProperty)).length]})()`);
    await p.hover(2, 2); await sleep(150); const rest = await paint();
    await p.hover(hr.x + 40, hr.cy); await q(`new Promise((r)=>requestAnimationFrame(r))`); const on = await paint();
    await p.hover(2, 2); await q(`new Promise((r)=>requestAnimationFrame(r))`); const off = await paint();
    check("row hover: lit at once, unlit at once (no background transition)", [on[0] !== rest[0], on[1], off[0] === rest[0], off[1]], [true, 0, true, 0]);
  }
  /* press feedback and hover */
  const chip = await p.rect('#stage [data-slot=segmented-control-option]:has(input[value=\"done\"])');
  /* hover is gated behind (hover: hover) and (pointer: fine); the browser runs with a real-pointer profile (launch hover: true) */
  await p.hover(chip.cx, chip.cy);
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: chip.cx, y: chip.cy, button: "left", clickCount: 1 });
  await sleep(220);
  check("press scales the chip", await q(`(() => { const cs = getComputedStyle(document.querySelector('#stage [data-slot=segmented-control-option]:has(input[value=\"done\"])')); return cs.scale !== "none" || /^matrix\\((?!1, 0, 0, 1,)/.test(cs.transform); })()`), true);
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: chip.cx, y: chip.cy, button: "left", clickCount: 1 });
  await sleep(400);
  check("release selects it", [await checked(), await shown()], ["done", 1]);

  /* edge veils: on only while there is something to scroll to on that side, drawn from the scroll
   * position (no animation), in both directions; a card scrolled to the end that grows to fit shows
   * none. The card is squeezed to 300px so that it scrolls. */
  const CARD = "#stage [data-slot=filter-table-card]";
  const veils = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(CARD)});return [e.scrollWidth>e.clientWidth,e.hasAttribute("data-overflow-start"),e.hasAttribute("data-overflow-end"),+getComputedStyle(e,"::before").opacity,+getComputedStyle(e,"::after").opacity]})()`);
  const frames = () => q(`new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  const squeeze = async () => { await q(`document.querySelector("#stage [data-slot=filter-table]").style.width="300px"`); await frames(); };
  const sweep = () => q(`(async()=>{const e=document.querySelector(${JSON.stringify(CARD)});const rtl=getComputedStyle(e).direction==="rtl";const range=e.scrollWidth-e.clientWidth;const frame=()=>new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r)));const at=[];for(const f of [0,0.5,1]){e.scrollLeft=(rtl?-1:1)*Math.round(range*f);await frame();at.push([e.hasAttribute("data-overflow-start"),e.hasAttribute("data-overflow-end"),getComputedStyle(e,"::before").opacity,getComputedStyle(e,"::after").opacity])}return {at,animations:[getComputedStyle(e).animationName,getComputedStyle(e,"::before").animationName,getComputedStyle(e,"::after").animationName]}})()`);
  const SWEPT = { at: [[false, true, "0", "1"], [true, true, "1", "1"], [true, false, "1", "0"]], animations: ["none", "none", "none"] };
  await squeeze();
  check("an overflowing card: end veil at the start, both in the middle, start veil at the end; no animation", await sweep(), SWEPT);
  await q(`(()=>{let n=document.querySelector(${JSON.stringify(CARD)});while(n&&n.id!=="stage"){n.style.maxWidth="none";n.style.width="1100px";n=n.parentElement}})()`); await frames(); await sleep(100);
  check("then grown to fit: no veil on either side", await veils(), [false, false, false, 0, 0]);
  await p.goto(`${BASE}/harness.html?c=filter-table&fw=${fw}&ex=0&dir=rtl`, 1500);
  await squeeze();
  check("rtl: the same veils at the start, the middle and the end", await sweep(), SWEPT);
  /* generic: its own columns, chips and filtered field (deploys by environment) */
  await p.goto(`${BASE}/harness.html?c=filter-table&fw=${fw}&ex=1`, 1500);
  check("generic: the columns from props, the chips with their tones and counts", await q(`(()=>{const th=[...document.querySelectorAll("#stage [data-slot=filter-table-th]")].map((t)=>t.textContent);const chips=[...document.querySelectorAll("#stage [data-slot=segmented-control-option]")].map((c)=>c.textContent.replace(/\s+/g," ").trim());return [th,chips]})()`), [["Commit", "Environment", "Author", "Duration"], ["All 4", "Production 2", "Staging 1", "Preview 1"]]);
  check("generic: a tag cell is the Tag of the matching filter (its label); a number column ends at the end", await q(`(()=>{const row=document.querySelector("#stage [data-slot=filter-table-cells]");const c=row.children;const n=c[3];const t=c[1].querySelector("[data-filter-table=tag]");return [t?.dataset.slot,t?.textContent.trim(),getComputedStyle(n).justifyContent,getComputedStyle(document.querySelectorAll("#stage [data-slot=filter-table-th]")[3]).textAlign]})()`), ["tag", "Production", "flex-end", "end"]);
  check("a row of tags is as tall as a row of status pills", await q(`document.querySelector("#stage [data-slot=filter-table-cells]").getBoundingClientRect().height`), statusRowHeight);
  await p.clickSel('#stage [data-slot=segmented-control-option]:has(input[value="staging"])'); await sleep(600);
  check("generic: Staging leaves the one staging row", await visibleRows(), 1);
  check("generic: four columns at least 420px wide on one grid", await q(`(()=>{const t=document.querySelector("#stage [data-slot=filter-table-table]");const h=document.querySelector("#stage [data-slot=filter-table-head]").getBoundingClientRect();const c=document.querySelector("#stage [data-slot=filter-table-cells]").getBoundingClientRect();return [t.getBoundingClientRect().width>=420,Math.abs(h.width-c.width)<0.5,getComputedStyle(document.querySelector("#stage [data-slot=filter-table-head]")).gridTemplateColumns.split(" ").length]})()`), [true, true, 4]);
  } catch (error) { check("script ran to the end", String(error.message).split("\n")[0].slice(0, 160), "ok"); }
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
