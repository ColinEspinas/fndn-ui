// Date picker: one field (the shared control, compared with the select's trigger at md, sm, xs and
// lg) with the calendar icon at its start and the dates in words ("Mar 12, 2025"; a range in one
// phrase, "Mar 10 – 14, 2025"); a press anywhere on the field opens the calendar (from the pointer,
// it grows out of the field) and leaves the caret in the text; Arrow Down opens it at once; the
// calendar's keys; choosing (click and Enter); Escape; typing (words, numeric, ISO, a range, a bad
// date); a tap opens without the keyboard; the field hugs its text and is never narrower than it;
// invalid, disabled, right-to-left, German and Tamil, dark, 320px.
// "Today" is pinned to 2025-03-19 in the page, so the fixtures (March 2025) are stable.
//   node components/date-picker/date-picker.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "date-picker";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const T=Date.UTC(2025,2,19,12);const D=Date;function F(...a){return a.length?new D(...a):new D(T)}F.prototype=D.prototype;F.now=()=>T;F.UTC=D.UTC;F.parse=D.parse;globalThis.Date=F;})()` });
/* transitions that start on the calendar popup, from the first paint on (defaultOpen lands) */
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__popRuns=[];document.addEventListener("transitionrun",(e)=>{if(e.target.closest?.("[data-slot=date-picker-content]"))window.__popRuns.push(e.propertyName)},true);` });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search, sel) => {
  for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector(${JSON.stringify(sel)})`).catch(() => false)) break; await sleep(100); }
  await sleep(250);
};
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search, c === C ? "#stage [data-slot=date-picker-input]" : `#stage [data-slot=${c}]`); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const CTRL = "#stage [data-slot=date-picker-control]";
const INPUT = "#stage [data-slot=date-picker-input]";
const ICON = "#stage [data-slot=date-picker-icon]";
const POP = "[data-slot=date-picker-content]";
const VIEW = POP + " [data-slot=calendar-view]:not([hidden])";
const day = (iso) => `${POP} [data-slot=calendar-cell-trigger][data-view=day][data-value="${iso}"]`;
const LOOK = ["height", "borderRadius", "backgroundColor", "boxShadow", "fontSize", "color"];
const look = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);
const state = () => q(`document.querySelector(${JSON.stringify(INPUT)}).getAttribute("aria-expanded")`);
const focused = () => q(`document.activeElement?.dataset.value ?? document.activeElement?.dataset.slot ?? null`);
const text = () => q(`document.querySelector(${JSON.stringify(INPUT)}).value`);
const title = () => q(`document.querySelector(${JSON.stringify(VIEW + " [data-calendar=title]")}).textContent.trim()`);
const dur = (sel, prop) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));const props=cs.transitionProperty.split(",").map((x)=>x.trim());const d=cs.transitionDuration.split(",").map((x)=>x.trim());const i=props.indexOf(${JSON.stringify(prop)});return i<0?null:d[i%d.length]})()`);
const away = async () => { await p.hover(1200, 860); await sleep(200); };
/* the text is never cut: the input shows all of it */
const whole = () => q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)});return i.scrollWidth<=i.clientWidth+1})()`);
const retype = async (str) => { await p.key("a", { ctrl: true }); await p.key("Backspace"); await p.type(str); await sleep(60); };
const tap = async (sel) => {
  const r = await p.rect(sel);
  const point = [{ x: r.cx, y: r.cy, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
  await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point });
  await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(60);
};

async function run(fw, check) {
  await open(fw, 0);
  check("one input in the control, a combobox that opens a dialog-like calendar; the icon is aria-hidden", await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)});return [document.querySelectorAll(${JSON.stringify(INPUT)}).length,i.getAttribute("role"),i.getAttribute("aria-haspopup"),i.getAttribute("aria-expanded"),document.querySelector(${JSON.stringify(ICON)}).getAttribute("aria-hidden"),document.querySelectorAll("#stage button").length]})()`), [1, "combobox", "dialog", "false", "true", 0]);
  check("the label names the input", await q(`document.querySelector("#stage [data-slot=date-picker-label]").htmlFor === document.querySelector(${JSON.stringify(INPUT)}).id`), true);
  check("the date reads in words, in the locale", await text(), "Mar 12, 2025");
  check("the icon: at the start, 14px, ink-3, as far from the edge as the text would be; the text 8px after it", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),s=document.querySelector(${JSON.stringify(ICON + " svg")}),g=s.getBoundingClientRect(),i=document.querySelector(${JSON.stringify(INPUT)});return [Math.round(g.width),getComputedStyle(s).color,Math.round(g.left-c.left),Math.round(parseFloat(getComputedStyle(i).paddingLeft)-(g.right-c.left))]})()`), [14, await token("--fndn-ink-3", "color"), 10, 8]);
  const mine = await look(CTRL);
  await open(fw, 0, "", "select");
  check("at rest the control is the select's trigger (md: height, radius, fill, hairline, type, ink)", mine, await look("#stage [data-slot=select-trigger]"));

  /* pointer: the whole field opens */
  await open(fw, 0);
  const c = await p.rect(CTRL);
  await p.click(c.x + c.w - 6, c.cy); await sleep(30);
  check("a click at the field's far end opens; the popup animates (pointer); the caret stays in the field", [await state(), (await dur(POP, "opacity")) !== "0s", await focused()], ["true", true, "date-picker-input"]);
  await sleep(350);
  check("popup sits 4px under the control, starts at its edge, grows from the control (origin 4px above it)", await q(`(()=>{const t=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),b=document.querySelector(${JSON.stringify(POP)}).getBoundingClientRect();return [Math.round(b.top-t.bottom), Math.abs(b.left-t.left)<=1, getComputedStyle(document.querySelector(${JSON.stringify(POP)})).transformOrigin.split(" ")[1]]})()`), [4, true, "-4px"]);
  check("open: the control keeps the accent ring", await q(`getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).boxShadow.includes(${JSON.stringify(await token("--fndn-accent", "color"))})`), true);
  await p.clickSel(INPUT); await sleep(150);
  check("a second click in the field keeps the calendar open (it is for the caret)", await state(), "true");
  const r5 = await p.rect(day("2025-03-05"));
  await p.hover(r5.cx, r5.cy); await sleep(200);
  check("the hovered date and the selected date are distinct (hover / ink)", await q(`[getComputedStyle(document.querySelector('${day("2025-03-05")}')).backgroundColor, getComputedStyle(document.querySelector('${day("2025-03-12")}')).backgroundColor]`), [await token("--fndn-hover"), await token("--fndn-ink")]);
  await p.click(r5.cx, r5.cy); await sleep(300);
  check("a click chooses: the field takes the date, the popup closes, focus in the field", [await text(), await state(), await focused()], ["Mar 5, 2025", "false", "date-picker-input"]);
  await away();
  await open(fw, 0);
  await p.clickSel(ICON); await sleep(300);
  check("a click on the icon opens too", await state(), "true");
  await p.click(1200, 860); await sleep(300);
  check("a click outside closes", await state(), "false");

  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab focuses the field and selects its text; nothing opens", [await focused(), await state(), await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)});return i.selectionEnd-i.selectionStart})()`)], ["date-picker-input", "false", "Mar 12, 2025".length]);
  await p.key("ArrowDown"); await sleep(40);
  check("Arrow Down opens at once (kbd-instant) on the selected date", [await state(), await dur(POP, "opacity"), await focused()], ["true", "0s", "2025-03-12"]);
  await p.key("ArrowRight"); await p.key("ArrowDown"); await sleep(30);
  const moved = await focused();
  await p.key("PageDown"); await sleep(40);
  const paged = [await focused(), await title()];
  await p.key("PageUp"); await sleep(40);
  check("arrows and Page Down / Up move through the calendar", [moved, ...paged, await focused()], ["2025-03-20", "2025-04-20", "April 2025", "2025-03-20"]);
  await p.key("Enter"); await sleep(200);
  check("Enter chooses, closes at once, focus back in the field", [await text(), await state(), await focused(), await dur(POP, "opacity")], ["Mar 20, 2025", "false", "date-picker-input", "0s"]);
  await p.key("ArrowDown"); await sleep(60);
  await p.key("Escape"); await sleep(150);
  check("Escape closes; focus back in the field; the value is kept", [await state(), await focused(), await text()], ["false", "date-picker-input", "Mar 20, 2025"]);

  /* typing */
  await open(fw, 3);
  check("empty: the placeholder", await q(`document.querySelector(${JSON.stringify(INPUT)}).placeholder`), "Select date");
  await p.clickSel(INPUT); await sleep(300);
  await p.type("3/18/2025"); await sleep(80);
  check("typing keeps the calendar open and moves it to the date read so far", [await state(), await q(`document.querySelector('${day("2025-03-18")}').hasAttribute("data-focus")`)], ["true", true]);
  await p.key("Enter"); await sleep(250);
  check("Enter takes the typed date: it reads in words, the calendar closes", [await text(), await state()], ["Mar 18, 2025", "false"]);
  await retype("mar 25"); await p.key("Enter"); await sleep(150);
  check("a month name and a day (this year)", await text(), "Mar 25, 2025");
  await retype("2025-03-11"); await p.key("Tab"); await sleep(150);
  check("ISO, taken when focus leaves", await text(), "Mar 11, 2025");
  await p.clickSel(INPUT); await sleep(100);
  await retype("Mar 32"); await p.click(1200, 860); await sleep(200);
  check("not a date: the field shows its value again", await text(), "Mar 11, 2025");
  await p.clickSel(INPUT); await sleep(100);
  await retype("Mar 14, 2025"); await p.key("Enter"); await sleep(150);
  check("an unavailable date is not taken", await text(), "Mar 11, 2025");
  await p.clickSel(INPUT); await sleep(100);
  await retype("Mar 6"); await p.key("Escape"); await sleep(100);
  check("Escape while typing restores the value", await text(), "Mar 11, 2025");
  await p.key("Escape"); await sleep(150);
  await p.clickSel(INPUT); await sleep(350);
  check("min, max, unavailable: struck through, not selectable", await q(`["2025-03-02","2025-03-14","2025-03-29"].map((v)=>getComputedStyle(document.querySelector('${POP} [data-slot=calendar-cell-trigger][data-view=day][data-value="'+v+'"]')).textDecorationLine)`), ["line-through", "line-through", "line-through"]);
  await p.key("Escape"); await sleep(100);
  await away();

  /* range */
  await open(fw, 2);
  check("range: one phrase, one line, 32px", [await text(), (await p.rect(CTRL)).h], ["Mar 10 – 14, 2025", 32]);
  await p.clickSel(INPUT); await sleep(350);
  await p.clickSel(day("2025-03-28")); await sleep(120);
  check("range: the first click keeps the calendar open", await state(), "true");
  await p.clickSel(VIEW + " [data-calendar=next]"); await sleep(150);
  await p.clickSel(day("2025-04-02")); await sleep(300);
  check("…the second sets the end and closes; across months the phrase keeps both months", [await text(), await state()], ["Mar 28 – Apr 2, 2025", "false"]);
  await retype("Dec 30 – Jan 2, 2026"); await p.key("Enter"); await sleep(150);
  check("a typed range across years: the start takes the year before", await text(), "Dec 30, 2025 – Jan 2, 2026");
  await retype("03/03/2025 - 03/07/2025"); await p.key("Enter"); await sleep(150);
  check("a typed numeric range", await text(), "Mar 3 – 7, 2025");
  await away();
  await open(fw, 6);
  check("an empty range: \"Select dates\"", await q(`document.querySelector(${JSON.stringify(INPUT)}).placeholder`), "Select dates");

  /* sizes: the field is the select's trigger at every size */
  for (const [ex, size, px] of [[7, "xs", 24], [1, "sm", 28], [8, "lg", 36]]) {
    await open(fw, ex);
    check(`${size}: the control is ${px}px and its dates read whole`, [(await p.rect(CTRL)).h, await whole()], [px, true]);
  }
  await open(fw, 1);
  const smGhost = await look(CTRL);
  await open(fw, 2, "", "select");
  check("sm ghost = the select's sm ghost trigger (height, radius, fill, type)", [smGhost[0], smGhost[1], smGhost[2], smGhost[4]], await look("#stage [data-slot=select-trigger]").then((l) => [l[0], l[1], l[2], l[4]]));
  await open(fw, 1);
  check("ghost (report period): as wide as its phrase, no fill at rest", [await text(), await whole(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).backgroundColor`)], ["Mar 1 – 31, 2025", true, "rgba(0, 0, 0, 0)"]);
  await open(fw, 8);
  check("lg range across years: one phrase, whole", [await text(), await whole()], ["Dec 30, 2025 – Jan 2, 2026", true]);

  await open(fw, 4);
  check("invalid: a red hairline", await q(`getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).boxShadow.includes(${JSON.stringify(await token("--fndn-red", "color"))})`), true);
  await open(fw, 5);
  await p.clickSel(INPUT); await sleep(200);
  check("disabled: input disabled, half opacity, a click opens nothing", [await q(`document.querySelector(${JSON.stringify(INPUT)}).disabled`), await q(`getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).opacity`), await state()], [true, "0.5", "false"]);

  /* touch: a tap opens the calendar without the keyboard */
  await open(fw, 0);
  await p.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await tap(INPUT); await sleep(400);
  check("a tap opens the calendar and focuses it, not the text (no on-screen keyboard)", [await state(), await focused()], ["true", "2025-03-12"]);
  await tap(INPUT); await sleep(200);
  check("a tap while it is open puts the caret in the text", await focused(), "date-picker-input");
  await p.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await p.key("Escape"); await sleep(150);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("range in 160px: the phrase is never cut; the field grows past the width rather than cut it", [await text(), await whole(), (await p.rect(CTRL)).h], ["Feb 24 – Dec 31, 2025", true, 32]);
  await open(fw, 1, "&data=worst");
  check("a long label wraps; the control stays 32px; Tamil reads whole", [await q(`document.querySelector("#stage [data-slot=date-picker-label]").getBoundingClientRect().height>24`), (await p.rect(CTRL)).h, await whole()], [true, 32, true]);
  await open(fw, 4, "&data=worst");
  check("German: a range across years in words, whole", [await text(), await whole(), await q(`document.querySelector(${JSON.stringify(INPUT)}).placeholder`)], ["30. Dez. 2025 – 2. Jan. 2026", true, "Zeitraum wählen"]);
  await p.clickSel(INPUT); await sleep(100);
  await retype("10.03.2025 – 28.03.2025"); await p.key("Enter"); await sleep(150);
  check("German: the numeric range typed in the locale's order", await text(), "10.–28. März 2025");
  await open(fw, 5, "&data=worst");
  check("Tamil range: whole, as wide as its phrase", await whole(), true);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the icon sits at the right end, the text starts after it", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),g=document.querySelector(${JSON.stringify(ICON + " svg")}).getBoundingClientRect();return [Math.round(c.right-g.right), getComputedStyle(document.querySelector(${JSON.stringify(INPUT)})).paddingRight]})()`), [10, "32px"]);
  await p.clickSel(INPUT); await sleep(400);
  check("rtl: the popup is right-to-left and starts at the control's right edge", await q(`(()=>{const t=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),c=document.querySelector(${JSON.stringify(POP)}),b=c.getBoundingClientRect();return [getComputedStyle(c).direction, Math.abs(b.right-t.right)<=1]})()`), ["rtl", true]);
  await p.key("Escape"); await sleep(150);
  await open(fw, 0, "&theme=dark");
  check("dark: the control takes the dark field fill", (await look(CTRL))[2], await token("--fndn-field"));

  /* defaultOpen: the calendar is there at mount, with no entrance, and the focus stays where it was */
  await open(fw, 9);
  check("defaultOpen: the calendar is open at mount, landed (no transition ran), focus not taken", await q(`(()=>{const c=[...document.querySelectorAll("[data-slot=date-picker-content]")].find((e)=>e.getBoundingClientRect().height>0);return [c?.dataset.state ?? null, window.__popRuns.length, !!document.activeElement?.closest("[data-slot=date-picker], [data-slot=date-picker-content]")]})()`), ["open", 0, false]);
  await p.key("Escape"); await sleep(150);
  await p.viewport(320, 700, 1.25);
  await open(fw, 0);
  await p.clickSel(INPUT); await sleep(400);
  check("320px: the page does not scroll sideways; the popup stays in view", await q(`(()=>{const b=document.querySelector(${JSON.stringify(POP)}).getBoundingClientRect();return [document.documentElement.scrollWidth<=320, b.left>=0 && b.right<=320]})()`), [true, true]);
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
