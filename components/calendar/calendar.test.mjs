// Calendar: roles from Ark (Zag date-picker), tab stops, the keyboard (arrows, Page Up / Down,
// Home / End, Enter: all instant), pointer hover and choice (hover and selected distinct), today's
// dot, range band, min / max / unavailable days, the month and year views, a size that never
// changes, worst cases (long weekday names, four-week month), right-to-left, dark, 320px.
// "Today" is pinned to 2025-03-19 in the page, so the fixtures (March 2025) show it.
//   node components/calendar/calendar.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "calendar";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const T=Date.UTC(2025,2,19,12);const D=Date;function F(...a){return a.length?new D(...a):new D(T)}F.prototype=D.prototype;F.now=()=>T;F.UTC=D.UTC;F.parse=D.parse;globalThis.Date=F;})()` });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search, sel) => {
  for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector(${JSON.stringify(sel)})`).catch(() => false)) break; await sleep(100); }
  await sleep(250);
};
const open = async (fw, ex, extra = "") => { p.errors.length = 0; const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search, `#stage [data-slot=calendar-cell-trigger]`); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const VIEW = "#stage [data-slot=calendar-view]:not([hidden])";
const day = (iso) => `#stage [data-slot=calendar-cell-trigger][data-view=day][data-value="${iso}"]`;
const focused = () => q(`document.activeElement?.dataset.value ?? document.activeElement?.dataset.calendar ?? null`);
const title = () => q(`document.querySelector(${JSON.stringify(VIEW + " [data-calendar=title]")}).textContent.trim()`);
const bg = (sel) => q(`getComputedStyle(document.querySelector(${JSON.stringify(sel)})).backgroundColor`);
const dur = (sel, prop) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));const props=cs.transitionProperty.split(",").map((x)=>x.trim());const d=cs.transitionDuration.split(",").map((x)=>x.trim());const i=props.indexOf(${JSON.stringify(prop)});return i<0?null:d[i%d.length]})()`);
const selected = () => q(`[...document.querySelectorAll("#stage [data-slot=calendar-cell-trigger][data-view=day][data-selected]")].map((e)=>e.dataset.value)`);
const box = () => q(`(()=>{const b=document.querySelector(${JSON.stringify(VIEW)}).getBoundingClientRect();return [Math.round(b.width),Math.round(b.height)]})()`);
const away = async () => { await p.hover(1200, 860); await sleep(200); };

async function run(fw, check) {
  await open(fw, 0);
  check("content is a labelled application; the grid is a grid of gridcells holding buttons; header buttons are Buttons marked data-calendar", await q(`(()=>{const r=document.querySelector("#stage [data-slot=calendar]");const k=r.querySelector("[data-slot=calendar-content]");const g=r.querySelector("[data-slot=calendar-grid]");const c=g.querySelector("[data-slot=calendar-cell]");return [k.getAttribute("role"),k.getAttribute("aria-label"),g.getAttribute("role"),c.getAttribute("role"),c.firstElementChild.getAttribute("role"),[...r.querySelectorAll("[data-calendar]:not([hidden] *)")].map((b)=>b.dataset.slot+":"+b.dataset.calendar).join(" ")]})()`), ["application", "Delivery date", "grid", "gridcell", "button", "button:prev button:title button:next"]);
  check("the selected date is aria-selected; today carries aria-current=date and a dot", await q(`(()=>{const s=document.querySelector(${JSON.stringify(day("2025-03-12"))}),t=document.querySelector(${JSON.stringify(day("2025-03-19"))});const a=getComputedStyle(t,"::after");return [s.parentElement.getAttribute("aria-selected"),t.parentElement.getAttribute("aria-current"),a.content!=="none"&&a.width==="4px"&&a.borderRadius!=="0px"]})()`), ["true", "date", true]);
  check("the view is 224px wide; six weeks of 32px under 24px of weekdays", [await box(), await q(`[...document.querySelectorAll("#stage [data-slot=calendar-view]:not([hidden]) tbody [data-slot=calendar-row]")].length`), (await p.rect(day("2025-03-05"))).w], [[224, 252], 6, 32]);
  const [ink, hover] = [await token("--fndn-ink"), await token("--fndn-hover")];
  const r5 = await p.rect(day("2025-03-05"));
  await p.hover(r5.cx, r5.cy); await sleep(250);
  check("pointer: the hovered date takes the hover colour, the selected one keeps ink: distinct", [await bg(day("2025-03-05")), await bg(day("2025-03-12"))], [hover, ink]);
  await p.click(r5.cx, r5.cy); await sleep(250);
  check("a click chooses the date (aria-selected moves)", await selected(), ["2025-03-05"]);
  await away();
  const t0 = await title();
  await p.clickSel(VIEW + " [data-calendar=next]"); await sleep(150);
  const t1 = await title();
  await p.clickSel(VIEW + " [data-calendar=prev]"); await sleep(150);
  check("next and previous page the month; the box keeps its size", [t0, t1, await title(), await box()], ["March 2025", "April 2025", "March 2025", [224, 252]]);

  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5);
  const stops = [];
  for (let i = 0; i < 4; i++) { await p.key("Tab"); stops.push(await focused()); }
  check("Tab: previous, title, next, then the selected date (one stop in the grid)", stops, ["prev", "title", "next", "2025-03-12"]);
  await p.key("ArrowRight"); await sleep(30);
  const right = await focused();
  await p.key("ArrowDown"); await sleep(30);
  const down = await focused();
  check("ArrowRight one day, ArrowDown one week; instant (no transition on the date)", [right, down, await q(`getComputedStyle(document.activeElement).transitionDuration.split(",").every((d)=>d.trim()==="0s")`)], ["2025-03-13", "2025-03-20", true]);
  await p.key("PageDown"); await sleep(60);
  const pd = [await focused(), await title()];
  await p.key("PageUp"); await sleep(60);
  check("Page Down / Page Up move a month, the title follows", [...pd, await focused(), await title()], ["2025-04-20", "April 2025", "2025-03-20", "March 2025"]);
  await p.key("Home"); await sleep(30);
  const home = await focused();
  await p.key("End"); await sleep(30);
  check("Home / End: first and last day of the month", [home, await focused()], ["2025-03-01", "2025-03-31"]);
  await p.key("ArrowLeft"); await p.key("ArrowLeft"); await p.key("ArrowUp"); await sleep(30);
  await p.key("Enter"); await sleep(60);
  check("Enter chooses the focused date; focus stays on it", [await selected(), await focused()], [["2025-03-22"], "2025-03-22"]);
  check("the focused date shows the focus ring (keyboard), drawn inside it: the dates touch", await q(`(()=>{const cs=getComputedStyle(document.activeElement);return [cs.outlineStyle!=="none", parseFloat(cs.outlineOffset)+parseFloat(cs.outlineWidth)<=0]})()`), [true, true]);
  await p.key("ArrowLeft"); await p.key(" "); await sleep(60);
  check("Space chooses too", await selected(), ["2025-03-21"]);

  /* views */
  await open(fw, 0);
  const dayBox = await box();
  await p.clickSel(VIEW + " [data-calendar=title]"); await sleep(150);
  check("the title opens the month view, the same size as the day view", [await q(`document.querySelector(${JSON.stringify(VIEW + " [data-slot=calendar-grid]")}).dataset.view`), await title(), await box()], ["month", "2025", dayBox]);
  await p.clickSel(VIEW + " [data-calendar=title]"); await sleep(150);
  check("…then the year view (its title is a disabled, full-opacity heading)", [await q(`document.querySelector(${JSON.stringify(VIEW + " [data-slot=calendar-grid]")}).dataset.view`), await title(), await q(`(()=>{const t=document.querySelector(${JSON.stringify(VIEW + " [data-calendar=title]")});return [t.disabled,getComputedStyle(t).opacity]})()`), await box()], ["year", "2020 – 2029", [true, "1"], dayBox]);
  await p.clickSel(`${VIEW} [data-slot=calendar-cell-trigger][data-value="2027"]`); await sleep(150);
  await p.clickSel(`${VIEW} [data-slot=calendar-cell-trigger][data-value="6"]`); await sleep(150);
  check("choosing a year then a month comes back to the day view of that month", [await q(`document.querySelector(${JSON.stringify(VIEW + " [data-slot=calendar-grid]")}).dataset.view`), await title()], ["day", "June 2027"]);

  /* range */
  await open(fw, 1);
  check("range: the band runs from start to end on the cells, rounded at its ends; the ends are ink", await q(`(()=>{const c=(v)=>document.querySelector('#stage [data-slot=calendar-cell-trigger][data-view=day][data-value="'+v+'"]');const cs=(v)=>getComputedStyle(c(v).parentElement);return [cs("2025-03-12").backgroundColor===cs("2025-03-11").backgroundColor && cs("2025-03-12").backgroundColor!=="rgba(0, 0, 0, 0)", cs("2025-03-12").borderRadius, cs("2025-03-10").borderStartStartRadius, getComputedStyle(c("2025-03-14")).backgroundColor, cs("2025-03-15").backgroundColor]})()`), [true, "0px", "6px", ink, "rgba(0, 0, 0, 0)"]);
  await p.clickSel(day("2025-03-03")); await sleep(100);
  const r7 = await p.rect(day("2025-03-07"));
  await p.hover(r7.cx, r7.cy); await sleep(150);
  check("choosing a new start previews the band under the pointer in the hover colour", await q(`getComputedStyle(document.querySelector('${day("2025-03-05")}').parentElement).backgroundColor`), hover);
  await p.click(r7.cx, r7.cy); await sleep(150);
  check("…and the second click ends the range", await selected(), ["2025-03-03", "2025-03-07"]);
  const band = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}).parentElement);const i=cs.transitionProperty.split(",").map((x)=>x.trim()).indexOf("background-color");return i<0?null:cs.transitionDuration.split(",")[i].trim()})()`);
  check("the band changes colour as the dates do (duration.fast)", [await band(day("2025-03-05")), await dur(day("2025-03-05"), "background-color")], ["0.1s", "0.1s"]);

  /* limits */
  await open(fw, 2);
  check("min: previous is disabled; before min and unavailable days are struck through and not selectable", await q(`(()=>{const c=(v)=>document.querySelector('#stage [data-slot=calendar-cell-trigger][data-view=day][data-value="'+v+'"]');return [document.querySelector(${JSON.stringify(VIEW + " [data-calendar=prev]")}).disabled, getComputedStyle(c("2025-03-02")).textDecorationLine, getComputedStyle(c("2025-03-14")).textDecorationLine, c("2025-03-14").getAttribute("aria-disabled"), getComputedStyle(c("2025-03-13")).textDecorationLine]})()`), [true, "line-through", "line-through", "true", "none"]);
  await p.clickSel(day("2025-03-14")); await sleep(100);
  check("a click on an unavailable day chooses nothing", await selected(), []);
  check("the other month's days are ink-3", await q(`getComputedStyle(document.querySelector('${day("2025-04-01")}')).color`), await token("--fndn-ink-3", "color"));

  await open(fw, 3);
  check("locale and week start: German names, Monday first", [await title(), await q(`document.querySelector("#stage [data-slot=calendar-weekday]").textContent`)], ["März 2025", "Mo"]);
  await open(fw, 5);
  await p.clickSel(day("2025-03-05")); await sleep(100);
  check("disabled: half opacity, no tab stop in the grid, a click chooses nothing", [await q(`getComputedStyle(document.querySelector("#stage [data-slot=calendar]")).opacity`), await q(`document.querySelector('${day("2025-03-12")}').tabIndex`), await selected()], ["0.5", -1, ["2025-03-12"]]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long weekday names fall back to narrow ones; none overflows its column", await q(`[...document.querySelectorAll("#stage [data-slot=calendar-weekday]")].filter((e)=>e.scrollWidth>e.clientWidth+1).length`), 0);
  await open(fw, 1, "&data=worst");
  check("fixedWeeks off: February 2026 is four weeks", await q(`document.querySelectorAll("#stage [data-slot=calendar-view]:not([hidden]) tbody [data-slot=calendar-row]").length`), 4);
  await open(fw, 2, "&data=worst");
  check("one day selectable: both page buttons disabled, one date enabled", await q(`[document.querySelector(${JSON.stringify(VIEW + " [data-calendar=prev]")}).disabled, document.querySelector(${JSON.stringify(VIEW + " [data-calendar=next]")}).disabled, document.querySelectorAll("#stage [data-slot=calendar-view]:not([hidden]) [data-slot=calendar-cell-trigger]:not([data-disabled])").length]`), [true, true, 1]);

  /* right-to-left */
  await open(fw, 4, "&data=worst&dir=rtl");
  check("rtl: the grid runs right to left, previous at the right with a mirrored caret", await q(`(()=>{const a=document.querySelector('${day("2025-03-01")}').getBoundingClientRect(),b=document.querySelector('${day("2025-03-02")}').getBoundingClientRect(),v=document.querySelector(${JSON.stringify(VIEW)}).getBoundingClientRect(),pr=document.querySelector(${JSON.stringify(VIEW + " [data-calendar=prev]")}).getBoundingClientRect();return [b.left<a.left, pr.right>v.right-40, getComputedStyle(document.querySelector(${JSON.stringify(VIEW + " [data-calendar=prev] svg")})).transform.startsWith("matrix(-1")]})()`), [true, true, true]);
  await p.clickSel(day("2025-03-12")); await p.key("ArrowRight"); await sleep(40);
  check("rtl: ArrowRight goes to the previous day", await focused(), "2025-03-11");

  await open(fw, 0, "&theme=dark");
  check("dark: the selected date is the dark ink, its text on-ink", [await bg(day("2025-03-12")), await q(`getComputedStyle(document.querySelector('${day("2025-03-12")}')).color`)], [await token("--fndn-ink"), await token("--fndn-on-ink", "color")]);

  await p.viewport(320, 700, 1.25);
  await open(fw, 1);
  check("320px: the page does not scroll sideways", await q(`document.documentElement.scrollWidth<=320`), true);
  await p.viewport(1280, 900, 1.25);
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]} (after ${checks.length} checks)`); }
    if (failed > before && attempt < 2) { failed = before; await p.viewport(1280, 900, 1.25).catch(() => {}); await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
