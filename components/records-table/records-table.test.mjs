// Keyboard and pointer contract of the Records table, run against every target through the harness,
// plus a measurement of 500 rows (mount, scroll, sort, select all).
//   node components/records-table/records-table.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=records-table]";
/* hover: true makes headless Chromium report a mouse, so the gated row hover is really exercised */
const p = await launch({ hover: true, width: 1280, height: 900 });
let failed = 0;
const ready = async (extra = "true") => { for (let t = 0; t < 100; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset && (${extra})`)) break; await sleep(100); } await sleep(300); };
const q = (js) => p.eval(js);
const S = (s) => JSON.stringify(s);

const names = () => q(`[...document.querySelectorAll("${R} tbody [data-slot=records-table-row]")].map((r)=>r.querySelector("td:first-child [data-slot=records-table-text]").textContent)`);
const colText = (key) => q(`[...document.querySelectorAll("${R} tbody [data-slot=records-table-row]")].map((r)=>r.querySelector('[data-col="${key}"]').textContent.trim())`);
const sortAttrs = () => q(`Object.fromEntries([...document.querySelectorAll("${R} thead [data-slot=records-table-th][data-col]")].map((t)=>[t.dataset.col,t.getAttribute("aria-sort")]))`);
/* row numbers are a CSS counter (::before): each shows its row's position in the current order */
const rownums = () => q(`[...document.querySelectorAll("${R} tbody [data-slot=records-table-row]")].map((r,i)=>getComputedStyle(r.querySelector("[data-slot=records-table-rownum]"),"::before").content==="counter(fndn-records-row)"&&getComputedStyle(r).counterIncrement.startsWith("fndn-records-row")?String(i+1):"x")`);
const selectedIds = () => q(`[...document.querySelectorAll("${R} [data-slot=records-table-row]:has([data-slot=records-table-gutter] input:checked)")].map((r)=>r.dataset.id)`);
const allState = () => q(`(()=>{const c=document.querySelector("${R} thead [data-slot=checkbox-control]");const i=document.querySelector("${R} thead [data-slot=checkbox-input]");return [c.dataset.state,i.indeterminate,i.checked]})()`);
const bar = () => q(`(()=>{const b=document.querySelector("${R} [data-slot=records-table-selection]");return [!b.inert,b.inert,document.querySelector("${R} [data-slot=records-table-selection-count]").textContent.trim()]})()`);
const center = (sel) => q(`(()=>{const e=document.querySelector(${S(sel)});if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
const clickAt = async (sel) => { const c = await center(sel); if (!c) throw new Error("no " + sel); await p.click(c.x, c.y); await sleep(120); };
const focusSel = (sel) => q(`document.querySelector(${S(sel)}).focus()`);
const openMenuItems = () => q(`[...document.querySelectorAll("[data-slot=menu-content][data-state=open] [data-slot=menu-item]")].map((i)=>i.textContent.trim())`);
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  try {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=0`, 300); await ready();
  const initial = await names();

  // semantics
  check("a real table in a named, focusable scroll region", await q(`(()=>{const s=document.querySelector("${R} [data-slot=records-table-scroll]");return [s.getAttribute("role"),s.getAttribute("aria-label"),s.tabIndex,s.firstElementChild.tagName,getComputedStyle(s).overscrollBehaviorX]})()`), ["region", "Records", 0, "TABLE", "contain"]);
  check("header cells: scope=col, aria-sort on sortable columns only", await sortAttrs(), { company: "none", categories: "none", last: null, strength: "none", orders: "none", website: "none" });
  check("sticky header and first column", await q(`(()=>{const th=getComputedStyle(document.querySelector("${R} thead th"));const td=getComputedStyle(document.querySelector("${R} tbody td:first-child"));return [th.position,th.top,td.position,document.querySelectorAll("${R} th[scope=col]").length]})()`), ["sticky", "0px", "sticky", 7]);
  check("numbers are tabular and end-aligned", await q(`(()=>{const td=document.querySelector("${R} tbody [data-slot=records-table-number]").closest("td");return [getComputedStyle(td.firstElementChild).fontVariantNumeric,getComputedStyle(td).textAlign]})()`), ["tabular-nums", "end"]);
  check("truncated values carry their full text in title", await q(`[...document.querySelectorAll("${R} [data-slot=records-table-text], ${R} [data-slot=records-table-link], ${R} [data-slot=records-table-tags]")].every((n)=>n.title && n.title.length>0)`), true);

  // composition: the system's parts, not local copies
  check("tags are Tags, +N a boxed count, triggers ghost xs Buttons", await q(`(()=>{const r=document.querySelector("${R}");const t=[...r.querySelectorAll("tbody [data-slot=records-table-row]:nth-child(2) [data-slot=records-table-tags] > *")];const b=r.querySelector("tbody td:last-child [data-records-table=menu-trigger]");return [t.map((e)=>e.dataset.slot+":"+(getComputedStyle(e).borderTopWidth==="1px"?"tag":getComputedStyle(e).backgroundColor!=="rgba(0, 0, 0, 0)"?"boxed":"")).join(" "),b.dataset.slot==="button",b.getBoundingClientRect().width,!!r.querySelector("[data-slot=records-table-tag], [data-slot=records-table-more]")]})()`), ["tag:tag tag:tag count:boxed", true, 24, false]);
  check("one row menu for every row (no per-row menus)", await q(`[document.querySelectorAll("[data-records-table=row-menu]").length, document.querySelectorAll("${R} tbody [data-slot=menu]").length]`), [1, 0]);
  {
    const th = await center(`${R} th[data-col=orders] [data-slot=records-table-sort]`);
    await p.hover(th.x, th.y); await sleep(200);
    const hoverBg = await q(`getComputedStyle(document.querySelector("${R} th[data-col=orders] [data-slot=records-table-sort]")).backgroundColor`);
    await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: th.x, y: th.y, button: "left", clickCount: 1 }); await sleep(200);
    const pressBg = await q(`getComputedStyle(document.querySelector("${R} th[data-col=orders] [data-slot=records-table-sort]")).backgroundColor`);
    await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: th.x, y: th.y, button: "left", clickCount: 1 }); await sleep(150);
    check("header sort: the press is visible (pressed ≠ hover)", hoverBg !== pressBg && hoverBg !== "rgba(0, 0, 0, 0)", true);
    await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=0`, 300); await ready();
  }

  // sort by pointer
  await clickAt(`${R} th[data-col=company] [data-slot=records-table-sort]`);
  const asc = [...initial].sort(collator.compare);
  check("pointer: Company sorts ascending (aria-sort, row order, row numbers)", [(await sortAttrs()).company, await names(), (await rownums()).join("")], ["ascending", asc, "1234567"]);
  await clickAt(`${R} th[data-col=company] [data-slot=records-table-sort]`);
  check("pointer: again flips to descending", [(await sortAttrs()).company, await names()], ["descending", [...asc].reverse()]);

  check("rows do not animate on sort", await q(`document.querySelector("${R} tbody").getAnimations({subtree:true}).length`), 0);
  /* row hover: lit and unlit at once (the tables' one hover is instant) */
  {
    const hr = await p.rect(`${R} tbody tr:nth-child(2)`);
    const paint = () => q(`(()=>{const e=document.querySelector(\`${R} tbody tr:nth-child(2) td:nth-child(3)\`);const cs=getComputedStyle(e);return [cs.backgroundColor+"|"+cs.backgroundImage, e.getAnimations().filter((a)=>/background/.test(a.transitionProperty)).length]})()`);
    await p.hover(2, 2); await sleep(150); const rest = await paint();
    await p.hover(hr.x + 40, hr.cy); await q(`new Promise((r)=>requestAnimationFrame(r))`); const on = await paint();
    await p.hover(2, 2); await q(`new Promise((r)=>requestAnimationFrame(r))`); const off = await paint();
    check("row hover: lit at once, unlit at once (no background transition)", [on[0] !== rest[0], on[1], off[0] === rest[0], off[1]], [true, 0, true, 0]);
  }
  await clickAt(`${R} th[data-col=company] [data-slot=records-table-sort]`);
  check("pointer: a third click returns to the natural order (aria-sort none everywhere)", [Object.values(await sortAttrs()).every((v) => v === "none" || v == null), await names()], [true, initial]);

  // sort by keyboard: Enter and Space on the header button
  await focusSel(`${R} th[data-col=orders] [data-slot=records-table-sort]`);
  await p.key("Enter"); await sleep(100);
  const nums = (xs) => xs.map((s) => Number(s.replace(/,/g, "")));
  check("keyboard: Enter sorts Orders ascending", [(await sortAttrs()).orders, (await sortAttrs()).company, nums(await colText("orders"))], ["ascending", "none", [0, 47, 95, 312, 860, 1240, 12480]]);
  await p.key(" "); await sleep(100);
  check("keyboard: Space flips to descending", [(await sortAttrs()).orders, nums(await colText("orders"))], ["descending", [12480, 1240, 860, 312, 95, 47, 0]]);
  await p.key(" "); await sleep(100);
  check("keyboard: Space a third time returns to the natural order", [(await sortAttrs()).orders, await names()], ["none", initial]);
  await p.key(" "); await p.key(" "); await sleep(100);
  check("keyboard sort leaves focus on the header button", await q(`document.activeElement === document.querySelector("${R} th[data-col=orders] [data-slot=records-table-sort]")`), true);
  await focusSel(`${R} th[data-col=strength] [data-slot=records-table-sort]`);
  await p.key(" "); await sleep(100);
  check("status columns sort by option order", await colText("strength"), ["No communication", "Very weak", "Very weak", "Weak", "Weak", "Very strong", "Very strong"]);

  // the column menu sorts too; blank values sort last either way
  await focusSel(`${R} th[data-col=website] [data-menu=trigger]`);
  await p.key("Enter"); await sleep(250);
  check("column menu opens from the keyboard with its actions", await openMenuItems(), ["Sort ascending", "Sort descending", "Hide column"]);
  await p.key("ArrowDown"); await p.key("Enter"); await sleep(200);
  const links = await colText("website");
  check("column menu: Sort descending; the blank link stays last", [(await sortAttrs()).website, links[links.length - 1], links[0]], ["descending", "—", "sol-y-nieve.example.com"]);

  // select a row by pointer: the checkbox takes the row number's place under the pointer
  await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=0`, 300); await ready();
  const row2 = await center(`${R} tbody tr:nth-child(2) td[data-col=last]`);
  await p.hover(row2.x, row2.y); await sleep(250);
  check("hover: the row's checkbox replaces its number, its menu trigger shows", await q(`(()=>{const r=document.querySelector("${R} tbody tr:nth-child(2)");return [getComputedStyle(r.querySelector("[data-slot=records-table-gutter] > [data-slot=checkbox]")).opacity,getComputedStyle(r.querySelector("[data-slot=records-table-rownum]")).opacity,getComputedStyle(r.querySelector("td:last-child [data-menu=trigger]")).opacity]})()`), ["1", "0", "1"]);
  check("hover: the row is tinted (gated hover)", await q(`(()=>{const s=(e)=>{const cs=getComputedStyle(e);return cs.backgroundColor+"|"+cs.backgroundImage};return s(document.querySelector("${R} tbody tr:nth-child(2) td"))!==s(document.querySelector("${R} tbody tr:nth-child(3) td"))})()`), true);
  await clickAt(`${R} tbody tr:nth-child(2) [data-slot=checkbox-control]`);
  check("pointer: one row selected, select-all is indeterminate (mixed)", [await selectedIds(), await allState()], [["kumo"], ["indeterminate", true, false]]);
  await sleep(300);
  check("the selection bar reveals with the count", await bar(), [true, false, "1 selected"]);

  // select a row by keyboard
  await p.click(5, 5);
  await focusSel(`${R} tbody tr:nth-child(4) [data-slot=checkbox-input]`);
  await p.key(" "); await sleep(120);
  check("keyboard: Space selects the focused row; its checkbox shows", [await selectedIds(), await q(`getComputedStyle(document.querySelector("${R} tbody tr:nth-child(4) [data-slot=records-table-gutter] > [data-slot=checkbox]")).opacity`)], [["kumo", "maple-orbit"], "1"]);

  // select all, then none
  await clickAt(`${R} thead [data-slot=checkbox-control]`);
  check("select-all from indeterminate selects every row", [(await selectedIds()).length, await allState(), (await bar())[2]], [7, ["checked", false, true], "7 selected"]);
  await focusSel(`${R} thead [data-slot=checkbox-input]`);
  await p.key(" "); await sleep(350);
  check("keyboard: select-all again clears; the bar closes and is inert", [(await selectedIds()).length, await allState(), await bar()], [0, ["unchecked", false, false], [false, true, "0 selected"]]);
  await clickAt(`${R} tbody tr:nth-child(1) [data-slot=checkbox-control]`);
  await sleep(300);
  await clickAt(`${R} [data-records-table=selection-clear]`);
  check("Clear selection empties it", [await selectedIds(), (await allState())[0]], [[], "unchecked"]);

  // hide a column from its menu, show it again from the Columns menu
  await focusSel(`${R} th[data-col=categories] [data-menu=trigger]`);
  await p.key("Enter"); await sleep(250);
  await p.key("End"); await sleep(60);
  await p.key("Enter"); await sleep(250);
  check("Hide column hides the header and every cell of the column", await q(`(()=>{const th=document.querySelector("${R} th[data-col=categories]");return [th.hidden,[...document.querySelectorAll("${R} td[data-col=categories]")].every((td)=>td.hidden),th.offsetWidth]})()`), [true, true, 0]);
  check("focus moves to the Columns menu trigger", await q(`document.activeElement === document.querySelector("${R} [data-records-table=columns-menu] [data-menu=trigger]")`), true);
  check("the table's minimum width drops by the column", await q(`parseFloat(document.querySelector("${R} [data-slot=records-table-table]").style.minWidth)`), 1204 - 220);
  await p.key("Enter"); await sleep(250);
  check("Columns menu lists the hideable columns; Categories is unchecked", await q(`[...document.querySelectorAll("[data-slot=menu-content][data-state=open] [data-slot=menu-item]")].map((i)=>i.textContent.trim()+":"+i.getAttribute("data-state"))`), ["Categories:unchecked", "Last interaction:checked", "Connection strength:checked", "Orders:checked", "Links:checked"]);
  await p.key("Home"); await p.key("Enter"); await sleep(150);
  check("checking it shows the column again; the menu stays open", [await q(`document.querySelector("${R} th[data-col=categories]").hidden`), await q(`!!document.querySelector("[data-slot=menu-content][data-state=open]")`)], [false, true]);
  await p.key("ArrowDown"); await p.key("ArrowDown"); await p.key("ArrowDown"); await p.key("Enter"); await sleep(150);
  check("and unchecking another hides it", await q(`document.querySelector("${R} th[data-col=orders]").hidden`), true);
  await p.key("Escape"); await sleep(200);

  // row menu
  await focusSel(`${R} tbody tr:nth-child(3) td:last-child [data-menu=trigger]`);
  check("row menu trigger is named after the row", await q(`document.activeElement.getAttribute("aria-label")`), "Actions for Sol y Nieve — Buenos Aires");
  await p.key("Enter"); await sleep(250);
  check("row menu opens with the row actions", await openMenuItems(), ["Open record", "Duplicate", "Delete"]);
  check("it opens under the row's own trigger", await q(`(()=>{const t=document.querySelector("${R} tbody tr:nth-child(3) td:last-child [data-menu=trigger]").getBoundingClientRect();const c=document.querySelector("[data-slot=menu-content][data-state=open]").getBoundingClientRect();return Math.abs(c.top-t.bottom-4)<=1.5&&Math.abs(c.right-t.right)<=1.5})()`), true);
  await p.key("ArrowDown"); await p.key("Enter"); await sleep(250);
  check("choosing an action closes it and returns focus to the row's trigger", await q(`!document.querySelector("[data-slot=menu-content][data-state=open]") && document.activeElement === document.querySelector("${R} tbody tr:nth-child(3) td:last-child [data-menu=trigger]")`), true);
  await p.key("Enter"); await sleep(250);
  await p.key("Escape"); await sleep(200);
  check("Escape closes it and returns focus", await q(`!document.querySelector("[data-slot=menu-content][data-state=open]") && document.activeElement === document.querySelector("${R} tbody tr:nth-child(3) td:last-child [data-menu=trigger]")`), true);

  // indeterminate from props, and the empty table
  await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=1`, 300); await ready();
  check("Sorted with selection: aria-sort, two rows selected, mixed select-all", [(await sortAttrs()).strength, await selectedIds(), await allState()], ["descending", ["kumo", "blue-fig"], ["indeterminate", true, false]]);
  await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=2`, 300); await ready();
  check("Empty: one empty-state row spanning every column; select-all disabled", await q(`(()=>{const td=document.querySelector("${R} [data-slot=records-table-empty]");return [td.colSpan,td.textContent.trim(),getComputedStyle(td.querySelector("[data-slot=empty-state]")).flexDirection==="column",document.querySelector("${R} thead [data-slot=checkbox-input]").disabled]})()`), [7, "No records", true, true]);
  // opening rows (onRowOpen) and bulk actions: mounted with a handler (functions are not JSON)
  await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=0`, 300); await ready();
  const openKey = fw === "svelte" ? "onrowopen" : "onRowOpen";
  await q(`(async()=>{window.__opened=[];const spec=await (await import("/src/harness/specs.ts")).specOf("records-table");const e=spec.examples[0];const {mountExample}=await import("/src/harness/mount.ts");await mountExample(document.querySelector("#stage"),{...spec,examples:[{...e,props:{...e.props,${JSON.stringify(openKey)}:(id)=>window.__opened.push(id)${fw === "react" ? ',selectionActions:"Archive"' : ""}}}]},"${fw}",0);return true})()`);
  await sleep(500);
  const ROWS = `${R} tbody [data-slot=records-table-row]`;
  check("openable rows: one tab stop (the first row), pointer cursor", await q(`(()=>{const rows=[...document.querySelectorAll(${S(ROWS)})];return [rows.map((r)=>r.tabIndex).filter((t)=>t===0).length,rows[0].tabIndex,getComputedStyle(rows[0]).cursor]})()`), [1, 0, "pointer"]);
  const ids0 = await q(`[...document.querySelectorAll(${S(ROWS)})].map((r)=>r.dataset.id)`);
  await clickAt(`${ROWS}:nth-child(2) td:nth-child(3)`);
  check("a click on a row opens it", await q(`window.__opened`), [ids0[1]]);
  await clickAt(`${ROWS}:nth-child(2) [data-slot=records-table-gutter]`);
  check("a click on its checkbox selects it and does not open it", [await q(`window.__opened.length`), (await selectedIds()).includes(ids0[1])], [1, true]);
  if (fw === "react") check("bulk actions sit in the selection bar after the count", await q(`(()=>{const a=document.querySelector("${R} [data-slot=records-table-selection-actions]");const c=document.querySelector("${R} [data-slot=records-table-selection-count]");return [a?.textContent,!!a&&c.getBoundingClientRect().right<=a.getBoundingClientRect().left]})()`), ["Archive", true]);
  await focusSel(`${ROWS}:nth-child(1)`);
  await p.key("ArrowDown"); await p.key("ArrowDown"); await sleep(80);
  check("ArrowDown moves the focus between rows; the focused row becomes the tab stop and shows a ring", await q(`(()=>{const a=document.activeElement;const rows=[...document.querySelectorAll(${S(ROWS)})];return [rows.indexOf(a),a.tabIndex,rows.filter((r)=>r.tabIndex===0).length,getComputedStyle(a).outlineStyle]})()`), [2, 0, 1, "solid"]);
  await p.key("Enter"); await sleep(80);
  check("Enter opens the focused row", await q(`window.__opened.slice(-1)`), [ids0[2]]);
  await p.key(" "); await sleep(150);
  check("Space selects it (the focus stays on the row)", [(await selectedIds()).includes(ids0[2]), await q(`document.activeElement.dataset.slot`)], [true, "records-table-row"]);
  await p.key("End"); await sleep(80);
  check("End goes to the last row", await q(`[...document.querySelectorAll(${S(ROWS)})].indexOf(document.activeElement)`), ids0.length - 1);

  /* tagTone: neutral — descriptive tags carry no hue; by default each word keeps its own */
  const tagFills = () => q(`[...new Set([...document.querySelectorAll("#stage [data-slot=records-table-tags] [data-slot=tag]")].map((t)=>getComputedStyle(t).backgroundColor))].length`);
  check("tags: hues by default (several fills)", await (async () => { await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=0`, 300); await ready(); return (await tagFills()) > 1; })(), true);
  check("tagTone neutral: every tag the same neutral fill", await (async () => { await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=3`, 300); await ready(); return tagFills(); })(), 1);

  /* the end veil of a table cut by the region, at the start, the middle and the end of the scroll
   * (the start side has the sticky first column instead), in both directions: it follows the scroll
   * position, with no animation; a table that fits shows none */
  const sweep = () => q(`(async()=>{const root=document.querySelector("${R}");const e=root.querySelector("[data-slot=records-table-scroll]");const frame=()=>new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r)));const read=()=>[e.hasAttribute("data-overflow-start"),e.hasAttribute("data-overflow-end"),getComputedStyle(e,"::after").opacity];root.style.width="2000px";await frame();const fits=read();root.style.width="420px";await frame();const rtl=getComputedStyle(e).direction==="rtl";const range=e.scrollWidth-e.clientWidth;const at=[];for(const f of [0,0.5,1]){e.scrollLeft=(rtl?-1:1)*Math.round(range*f);await frame();at.push(read())}return {fits,at,animation:getComputedStyle(e,"::after").animationName}})()`);
  const SWEPT = { fits: [false, false, "0"], at: [[false, true, "1"], [true, true, "1"], [true, false, "0"]], animation: "none" };
  await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=0`, 300); await ready();
  check("end veil: on while the table continues past the end, off at the end and when it fits; no animation", await sweep(), SWEPT);
  await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&ex=0&dir=rtl`, 300); await ready();
  check("rtl: the same end veil at the start, the middle and the end", await sweep(), SWEPT);
  check("no console errors", p.errors.slice(0, 2), []);
  } catch (error) { failed++; checks.push(`✗ threw: ${String(error.message ?? error).slice(0, 200)}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}

// 500 rows, in each target
const perf = [];
for (const fw of targets) {
  const t0 = Date.now();
  await p.goto(`${BASE}/harness.html?c=records-table&fw=${fw}&data=worst&ex=0`, 100);
  await ready(`document.querySelectorAll("${R} tbody tr").length === 500`);
  const mount = Date.now() - t0 - 300;
  /* scroll the region by 140px per frame, down then right, and record every frame's duration */
  const scroll = await q(`new Promise((done)=>{const s=document.querySelector("${R} [data-slot=records-table-scroll]");const frames=[];let last=performance.now(),i=0;const step=(now)=>{frames.push(now-last);last=now;if(i<120){s.scrollTop+=140;}else{s.scrollLeft+=40;}if(++i<150)requestAnimationFrame(step);else{frames.shift();frames.sort((a,b)=>a-b);done({median:+frames[frames.length>>1].toFixed(1),p95:+frames[Math.floor(frames.length*0.95)].toFixed(1),max:+frames[frames.length-1].toFixed(1),over50:frames.filter((f)=>f>50).length,top:s.scrollTop})}};requestAnimationFrame(step)})`);
  const timed = (js) => q(`new Promise((done)=>{const t=performance.now();${js};requestAnimationFrame(()=>requestAnimationFrame(()=>done(+(performance.now()-t).toFixed(0))))})`);
  const sortMs = await timed(`document.querySelector("${R} th[data-col=orders] [data-slot=records-table-sort]").click()`);
  const sortedOk = await q(`(()=>{const v=[...document.querySelectorAll("${R} tbody td[data-col=orders]")].map((td)=>Number(td.dataset.value));return v.every((x,i)=>i===0||v[i-1]<=x)})()`);
  const allMs = await timed(`document.querySelector("${R} thead [data-slot=checkbox-input]").click()`);
  const allOk = (await selectedIds()).length;
  perf.push({ fw, mountMs: mount, ...scroll, sortMs, sortedOk, selectAllMs: allMs, selected: allOk });
  if (!(scroll.p95 < 50 && sortedOk && allOk === 500)) failed++;
}
if (perf.length) { console.log("500 rows (mount includes page load in dev mode; frame times in ms)"); console.table(perf); }
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
