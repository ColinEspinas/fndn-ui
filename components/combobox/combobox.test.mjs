// Combobox: the select's control and list with a text input. Roles from Ark (Zag combobox), the
// control compared with the select's trigger, pointer and keyboard open (instant from the
// keyboard), filtering, the gliding highlight, choosing, Escape, the empty row, the caret, sizes,
// invalid, disabled, worst cases (long options wrap, no options), right-to-left, dark, 320px; the start
// part, caret=false, keywords and free text (allowCustomValue).
//   node components/combobox/combobox.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "combobox";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search, sel) => {
  for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector(${JSON.stringify(sel)})`).catch(() => false)) break; await sleep(100); }
  await sleep(250);
};
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search, `#stage [data-slot=${c}]`); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const CTRL = "#stage [data-slot=combobox-control]";
const INPUT = "#stage [data-slot=combobox-input]";
const TRIG = "#stage [data-combobox=trigger]";
const LOOK = ["height", "borderRadius", "backgroundColor", "boxShadow", "fontSize", "color"];
const look = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);
const state = () => q(`document.querySelector(${JSON.stringify(INPUT)}).getAttribute("aria-expanded")`);
const rows = () => q(`[...document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item]")].map((e)=>e.textContent.trim())`);
const highlighted = () => q(`document.querySelector("[data-slot=combobox-content] [data-highlighted]")?.textContent.trim() ?? null`);
const inField = () => q(`document.activeElement === document.querySelector(${JSON.stringify(INPUT)})`);
const value = () => q(`document.querySelector(${JSON.stringify(INPUT)}).value`);
/* the duration of one property in an element's transition list */
const dur = (sel, prop) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));const props=cs.transitionProperty.split(",").map((x)=>x.trim());const d=cs.transitionDuration.split(",").map((x)=>x.trim());const i=props.indexOf(${JSON.stringify(prop)});return i<0?null:d[i%d.length]})()`);
const away = async () => { await p.hover(1200, 860); await sleep(250); };

async function run(fw, check) {
  await open(fw, 0);
  check("input is a combobox (aria-expanded=false) controlling a listbox; caret is a Button marked data-combobox=trigger, not a tab stop", await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)}),t=document.querySelector(${JSON.stringify(TRIG)});return [i.getAttribute("role"),i.getAttribute("aria-expanded"),t.dataset.slot,t.tabIndex,!!t.getAttribute("aria-label")]})()`), ["combobox", "false", "button", -1, true]);
  const mine = await look(CTRL);
  await open(fw, 0, "", "select");
  check("at rest the control is the select's trigger (md: height, radius, fill, hairline, type, ink)", mine, await look("#stage [data-slot=select-trigger]"));

  /* pointer: a click in the field opens the list with the popup's scale-in */
  await open(fw, 0);
  await p.clickSel(INPUT); await sleep(30);
  check("a click in the field opens; the popup animates (pointer)", [await state(), (await dur("[data-slot=combobox-content]", "opacity")) !== "0s"], ["true", true]);
  await sleep(350);
  check("popup sits 4px under the control, as wide as it (or wider), focus stays in the field", await q(`(()=>{const t=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),b=document.querySelector("[data-slot=combobox-content]").getBoundingClientRect();return [Math.round(b.top-t.bottom), b.width>=t.width-0.5]})()`).then(async (g) => [...g, await inField()]), [4, true, true]);
  check("focused, the control shows the accent ring", await q(`getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).boxShadow.includes(${JSON.stringify(await token("--fndn-accent", "color"))})`), true);
  check("caret flipped over duration.move (pointer)", [await q(`getComputedStyle(document.querySelector("#stage [data-slot=combobox-indicator]")).rotate`), await dur("#stage [data-slot=combobox-indicator]", "transform")], ["180deg", "0.2s"]);
  const row2 = await p.rect("[data-slot=combobox-content] [data-slot=combobox-item]:nth-of-type(2)");
  await p.hover(row2.cx, row2.cy); await sleep(300);
  check("the highlight glides to the hovered option (4px padding + one 30px row)", await q(`(()=>{const g=document.querySelector("[data-slot=combobox-highlight]");return [g.hasAttribute("data-visible"), g.style.transform]})()`), [true, "translateY(34px)"]);
  await p.click(row2.cx, row2.cy); await sleep(300);
  check("a click chooses: the field takes the label, the list closes, focus stays in the field", [await value(), await state(), await inField()], ["Cobalt Collective", "false", true]);

  /* keyboard: typing filters (instant open), the first match is highlighted, arrows glide, Enter chooses */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab focuses the field; nothing opens", [await inField(), await state()], [true, "false"]);
  await p.type("co"); await sleep(40);
  check("typing opens the list at once (kbd-instant) and filters it; the first match is highlighted", [await state(), await dur("[data-slot=combobox-content]", "opacity"), await rows(), await highlighted()], ["true", "0s", ["Cobalt Collective", "Core Works", "Orchard Freight Co."], "Cobalt Collective"]);
  await p.key("ArrowDown"); await sleep(40);
  check("ArrowDown moves the highlight, and it glides (transform over duration.move)", [await highlighted(), await dur("[data-slot=combobox-highlight]", "transform")], ["Core Works", "0.2s"]);
  await sleep(300);
  check("…and lands on the row", await q(`(()=>{const g=document.querySelector("[data-slot=combobox-highlight]").getBoundingClientRect(),r=document.querySelector("[data-slot=combobox-content] [data-highlighted]").getBoundingClientRect();return Math.abs(g.top-r.top)<0.5})()`), true);
  check("aria-activedescendant follows the highlight", await q(`document.querySelector(${JSON.stringify(INPUT)}).getAttribute("aria-activedescendant")===document.querySelector("[data-slot=combobox-content] [data-highlighted]").id`), true);
  await p.key("End"); await sleep(40);
  const last = await highlighted();
  await p.key("Home"); await sleep(40);
  check("End / Home jump to the last and first match", [last, await highlighted()], ["Orchard Freight Co.", "Cobalt Collective"]);
  await p.key("ArrowDown"); await sleep(40);
  await p.key("Enter"); await sleep(250);
  check("Enter chooses and closes; the field holds the label", [await value(), await state(), await inField()], ["Core Works", "false", true]);
  await p.key("ArrowDown"); await sleep(40);
  check("ArrowDown reopens at once with every option again (the label is not a filter); the caret flips at once", [await state(), (await rows()).length, await dur("[data-slot=combobox-content]", "opacity"), await dur("#stage [data-slot=combobox-indicator]", "transform")], ["true", 6, "0s", "0s"]);
  check("the chosen option is checked", await q(`[...document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item][data-state=checked]")].map((e)=>e.textContent.trim())`), ["Core Works"]);
  await p.key("Escape"); await sleep(200);
  check("Escape closes; focus stays in the field", [await state(), await inField()], ["false", true]);
  /* closing with the pointer while the list is filtered: it keeps the options it shows while it
   * fades (it does not fill up again), and the next opening shows them all */
  const field = await p.rect(INPUT);
  await p.click(field.cx, field.cy); await sleep(250);
  const all = (await rows()).length;
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("co"); await sleep(150);
  const filtered = await rows();
  await p.rate(0.1);
  await p.click(5, 5); await sleep(150);
  const closing = [await state(), await rows()];
  await p.rate(1); await sleep(350);
  await p.click(field.cx, field.cy); await sleep(250);
  check("closed with a click outside while filtered: the list keeps its options as it fades, then reopens with them all", [filtered.length < all, closing, (await rows()).length], [true, ["false", filtered], all]);
  await p.key("Escape"); await sleep(200);
  await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)});i.select()})()`);
  await p.type("zzz"); await sleep(200);
  check("no match: the empty row, no options", await q(`[document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item]").length, document.querySelector("[data-slot=combobox-empty]")?.textContent, Math.round(document.querySelector("[data-slot=combobox-empty]").getBoundingClientRect().height)]`), [0, "No results", 30]);
  await p.click(1200, 860); await sleep(250);
  check("a click outside closes the list and puts back the chosen label", [await state(), await value()], ["false", "Core Works"]);
  await p.clickSel(INPUT); await p.key("Escape"); await sleep(100);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("q"); await p.key("Escape"); await p.key("Escape"); await sleep(100);
  check("Escape closes the list, a second Escape puts back the chosen label", [await state(), await value()], ["false", "Core Works"]);

  /* the caret button toggles the list */
  await open(fw, 0);
  await p.clickSel(TRIG); await sleep(300);
  check("a click on the caret opens; again closes", [await state(), await (async () => { await p.clickSel(TRIG); await sleep(300); return state(); })()], ["true", "false"]);

  /* small: 28px control (subtle), 26px rows, the value's label in the field */
  await open(fw, 1);
  check("sm: 28px control, the value's label in the field", [(await p.rect(CTRL)).h, await value()], [28, "Inter"]);
  const smMine = await look(CTRL);
  await open(fw, 1, "", "select");
  check("sm control = the select's sm trigger (height, radius, fill, type)", [smMine[0], smMine[1], smMine[2], smMine[4]], await look("#stage [data-slot=select-trigger]").then((l) => [l[0], l[1], l[2], l[4]]));
  await open(fw, 1);
  await p.clickSel(INPUT); await sleep(350);
  check("sm: rows are 26px", await q(`[...document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item]")].map((e)=>Math.round(e.getBoundingClientRect().height))`), [26, 26, 26, 26]);
  await away();

  await open(fw, 3);
  check("invalid: a red hairline", await q(`getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).boxShadow.includes(${JSON.stringify(await token("--fndn-red", "color"))})`), true);
  await open(fw, 4);
  await p.clickSel(INPUT); await sleep(250);
  check("disabled: input disabled, half opacity, a click opens nothing", [await q(`document.querySelector(${JSON.stringify(INPUT)}).disabled`), await q(`getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).opacity`), await state()], [true, "0.5", "false"]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  await p.clickSel(INPUT); await sleep(400);
  check("long options: the list grows past its 160px control to 360px and wraps; nothing is cut", await q(`(()=>{const c=document.querySelector("[data-slot=combobox-content]");const t=[...c.querySelectorAll("[data-slot=combobox-item-text]")];return [Math.round(c.getBoundingClientRect().width), t.filter((e)=>e.scrollWidth>e.clientWidth+1||getComputedStyle(e).textOverflow==="ellipsis").length, t.some((e)=>e.getBoundingClientRect().height>20)]})()`), [360, 0, true]);
  await open(fw, 3, "&data=worst");
  check("no options: the field is disabled", await q(`document.querySelector(${JSON.stringify(INPUT)}).disabled`), true);
  await open(fw, 4, "&data=worst&dir=rtl");
  await p.clickSel(INPUT); await sleep(400);
  check("rtl: the list is right-to-left and starts at the control's right edge", await q(`(()=>{const t=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),c=document.querySelector("[data-slot=combobox-content]"),b=c.getBoundingClientRect();return [getComputedStyle(c).direction, Math.abs(b.right-t.right)<=1]})()`), ["rtl", true]);
  check("rtl: the caret sits at the control's left end", await q(`(()=>{const t=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),b=document.querySelector(${JSON.stringify(TRIG)}).getBoundingClientRect();return b.left-t.left<8})()`), true);
  await open(fw, 0, "&theme=dark");
  check("dark: the control takes the dark field fill", (await look(CTRL))[2], await token("--fndn-field"));

  /* start: before the text at the size's padding, the text 8px after it; a press on it is a press in the field */
  const START = "#stage [data-slot=combobox-start]";
  const textAfterStart = () => q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),s=document.querySelector(${JSON.stringify(START)}),b=s.getBoundingClientRect(),i=document.querySelector(${JSON.stringify(INPUT)}),ib=i.getBoundingClientRect(),cs=getComputedStyle(i),ss=getComputedStyle(s);const rtl=getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).direction==="rtl";return rtl?[Math.round(c.right-(b.right-parseFloat(ss.paddingInlineStart))),Math.round(b.left-(ib.right-parseFloat(cs.paddingRight)))]:[Math.round((b.left+parseFloat(ss.paddingInlineStart))-c.left),Math.round((ib.left+parseFloat(cs.paddingLeft))-b.right)]})()`);
  await open(fw, 5);
  check("start: its content sits at the size's padding (md 10px), the text starts 8px after it", await textAfterStart(), [10, 8]);
  check("start: one centre line with the text", await q(`(()=>{const s=document.querySelector(${JSON.stringify(START)}).getBoundingClientRect(),i=document.querySelector(${JSON.stringify(INPUT)}).getBoundingClientRect();return Math.abs((s.top+s.bottom)/2-(i.top+i.bottom)/2)<1})()`), true);
  const st = await p.rect(START);
  await p.click(st.cx, st.cy); await sleep(30);
  check("a press on the start focuses the field and opens the list, as a click in the field (the popup animates)", [await inField(), await state(), (await dur("[data-slot=combobox-content]", "opacity")) !== "0s"], [true, "true", true]);
  await sleep(300);
  await p.type("bill"); await sleep(100);
  check("…and typing still filters", await rows(), ["billing-api"]);
  await away();
  await open(fw, 5, "&data=worst");
  check("long start text: cut at 45% of the field with a title; the value keeps the rest", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),s=document.querySelector(${JSON.stringify(START)}),i=document.querySelector(${JSON.stringify(INPUT)}).getBoundingClientRect();return [s.getBoundingClientRect().width<=c.width*0.45+1, s.getAttribute("title"), i.width>c.width*0.4]})()`), [true, "Out of office until Dec 3", true]);
  await open(fw, 7, "&data=worst&dir=rtl");
  check("rtl: the start sits at the right edge, the text starts 8px to its left", await textAfterStart(), [10, 8]);
  /* a start that begins with a button (a site-information button): 2px from the edge, the end
   * part's rule mirrored. The fixtures cannot carry a button: one is put in the start part */
  await open(fw, 5);
  check("start beginning with a button: 2px from the edge, the text still 8px after it", await q(`(()=>{const s=document.querySelector(${JSON.stringify(START)});s.replaceChildren(Object.assign(document.createElement("button"),{style:"width:24px;height:24px;padding:0"}));const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),b=s.querySelector("button").getBoundingClientRect(),i=document.querySelector(${JSON.stringify(INPUT)});return [Math.round(b.left-c.left), Math.round((i.getBoundingClientRect().left+parseFloat(getComputedStyle(i).paddingLeft))-b.right)]})()`), [2, 8]);

  /* highlightMatch (example 11): while typing, the label dims to ink-2 and its match stays ink */
  await open(fw, 11);
  await p.clickSel(INPUT); await sleep(350);
  check("highlightMatch: nothing typed, nothing marked", await q(`document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item-match]").length`), 0);
  await p.type("Limit"); await sleep(250);
  const ink = await token("--fndn-ink", "color"), ink2 = await token("--fndn-ink-2", "color");
  check("highlightMatch: each label's match (case as written) in ink, the rest in ink-2; the label reads whole", await q(`[...document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item-text]")].map((t)=>{const m=t.querySelector("[data-slot=combobox-item-match]");return [t.textContent, m?.textContent ?? null, getComputedStyle(t).color, m ? getComputedStyle(m).color : null, m ? getComputedStyle(m).fontWeight===getComputedStyle(t).fontWeight : null]})`), [["rate-limit.ts", "limit", ink2, ink, true], ["rate-limits.md", "limit", ink2, ink, true], ["limits.yaml", "limit", ink2, ink, true]]);
  await p.key("Escape"); await sleep(100); await p.key("Escape"); await sleep(100);
  await p.clickSel(INPUT); await sleep(300);
  await p.type("thrott"); await sleep(250);
  check("highlightMatch: an option found by a keyword is not marked, its label stays ink", await q(`[...document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item-text]")].map((t)=>[t.textContent, !!t.querySelector("[data-slot=combobox-item-match]"), getComputedStyle(t).color])`), [["rate-limits.md", false, ink]]);
  await p.key("Escape"); await sleep(100);

  /* end: after the text; the text stops 8px before it; the field's end padding follows it */
  const END = "#stage [data-slot=combobox-end]";
  const endGaps = () => q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),e=document.querySelector(${JSON.stringify(END)}),b=e.getBoundingClientRect(),i=document.querySelector(${JSON.stringify(INPUT)}),ib=i.getBoundingClientRect(),cs=getComputedStyle(i),es=getComputedStyle(e);const t=document.querySelector(${JSON.stringify(TRIG)});return [Math.round(b.left-(ib.right-parseFloat(cs.paddingRight))), t?Math.round(t.getBoundingClientRect().left-b.right):Math.round(c.right-(b.right-parseFloat(es.paddingRight)))]})()`);
  await open(fw, 9);
  check("end, no caret: the text stops 8px before it; it keeps the size's padding (md 10px) from the edge", await endGaps(), [8, 10]);
  const en = await p.rect(END);
  await p.click(en.cx, en.cy); await sleep(30);
  check("a press on the end focuses the field and opens the list", [await inField(), await state()], [true, "true"]);
  await away();
  await open(fw, 10);
  check("end before the caret: the text stops 8px before it, and it sits against the caret", await endGaps(), [8, 0]);

  /* caret false: no caret button; the text keeps the size's padding at its end; the list still opens */
  await open(fw, 6);
  check("caret=false: no caret button; the field runs to the end with the size's padding (sm 8px)", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),i=document.querySelector(${JSON.stringify(INPUT)});return [!!document.querySelector(${JSON.stringify(TRIG)}), Math.round(c.right-i.getBoundingClientRect().right), getComputedStyle(i).paddingRight]})()`), [false, 0, "8px"]);
  await p.click(5, 5); await p.key("Tab"); await p.key("ArrowDown"); await sleep(40);
  check("caret=false: ArrowDown opens the list at once", [await state(), await dur("[data-slot=combobox-content]", "opacity")], ["true", "0s"]);
  await p.key("Escape"); await sleep(100);
  await open(fw, 7, "&data=worst&dir=rtl");
  check("rtl, caret=false: the text keeps the padding at the left end", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),i=document.querySelector(${JSON.stringify(INPUT)});return [Math.round(i.getBoundingClientRect().left-c.left), getComputedStyle(i).paddingLeft]})()`), [0, "10px"]);

  /* keywords: a query matches the label or a keyword; the option is shown by its label */
  const texts = () => q(`[...document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item-text]")].map((e)=>e.textContent.trim())`);
  await open(fw, 7);
  await p.clickSel(INPUT); await sleep(300);
  const found = [];
  for (const typed of ["tokyo", "deu", "sao", "united"]) { await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type(typed); await sleep(120); found.push(await texts()); }
  check("keywords: a city, an ISO code, an accentless name find their option; the label still matches", found, [["Japan"], ["Germany"], ["Brazil"], ["United Kingdom", "United States"]]);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("tokyo"); await sleep(120);
  await p.key("Enter"); await sleep(250);
  check("keywords: Enter chooses the match; the field shows its label", [await value(), await state()], ["Japan", "false"]);
  await open(fw, 7, "&data=worst&dir=rtl");
  await p.clickSel(INPUT); await sleep(300); await p.type("bill"); await sleep(150);
  check("keywords match in a right-to-left list too", await texts(), ["الفوترة"]);
  await away();

  /* free text (allowCustomValue): Enter with nothing highlighted keeps what was typed */
  await open(fw, 8);
  await p.clickSel(INPUT); await sleep(300);
  await p.type("needs-design "); await sleep(150);
  check("free text: no match shows the empty row and highlights nothing", [await rows(), await highlighted(), await q(`document.querySelector("[data-slot=combobox-empty]")?.textContent`)], [[], null, "Press Enter to create this label"]);
  await p.key("Enter"); await sleep(250);
  check("free text: Enter keeps the typed text (trimmed) as the value and closes; focus stays", [await value(), await state(), await inField()], ["needs-design", "false", true]);
  await p.key("ArrowDown"); await sleep(60);
  check("…the kept text is an option of its own, checked, after the others", await q(`[...document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item]")].map((e)=>e.querySelector("[data-slot=combobox-item-text]").textContent.trim()+":"+e.dataset.state)`), ["bug:unchecked", "feature:unchecked", "docs:unchecked", "wontfix:unchecked", "needs-design:checked"]);
  await p.key("Escape"); await sleep(100);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("fea"); await sleep(120);
  await p.key("Enter"); await sleep(250);
  check("free text: with a match highlighted, Enter chooses the option (not the typed text)", [await value(), await state()], ["feature", "false"]);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("wontfix"); await sleep(120);
  await p.key("Enter"); await sleep(250);
  check("free text: the exact name of a disabled option is never kept; the chosen label comes back", [await value(), await state()], ["feature", "false"]);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("draft"); await sleep(120);
  await p.key("Escape"); await p.key("Escape"); await sleep(150);
  check("free text: Escape never keeps text; a second Escape puts back the chosen label", [await value(), await state()], ["feature", "false"]);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("draft"); await sleep(120);
  await p.click(1200, 860); await sleep(250);
  check("free text: a click outside never keeps text", await value(), "feature");
  /* without allowCustomValue: Enter with no match puts back the chosen label */
  await open(fw, 1);
  await p.clickSel(INPUT); await sleep(300);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("Comic"); await sleep(120);
  await p.key("Enter"); await sleep(250);
  check("no allowCustomValue: Enter with no match puts back the chosen label and closes", [await value(), await state()], ["Inter", "false"]);
  await open(fw, 6, "&data=worst");
  await p.clickSel(INPUT); await sleep(300);
  await p.type("customer-reported-regression-in-invoice-export");
  for (let t = 0; t < 20 && (await value()) !== "customer-reported-regression-in-invoice-export"; t++) await sleep(50);
  await sleep(150);
  await p.key("Enter"); await sleep(250); await p.key("ArrowDown"); await sleep(400);
  check("long free text: kept, and shown whole in the list (wraps, never cut)", await q(`(()=>{const t=[...document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item-text]")].pop();return [t.textContent, t.scrollWidth<=t.clientWidth+1, getComputedStyle(t).textOverflow]})()`), ["customer-reported-regression-in-invoice-export", true, "clip"]);
  await p.key("Escape"); await sleep(100);

  /* 320px wide: nothing overflows */
  await p.viewport(320, 700, 1.25);
  await open(fw, 0, "&data=worst");
  await p.clickSel(INPUT); await sleep(400);
  check("320px: the page does not scroll sideways; the list stays in view", await q(`(()=>{const b=document.querySelector("[data-slot=combobox-content]").getBoundingClientRect();return [document.documentElement.scrollWidth<=320, b.left>=0 && b.right<=320]})()`), [true, true]);
  await p.viewport(1280, 900, 1.25);
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await p.viewport(1280, 900, 1.25).catch(() => {}); await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
/* item icons: the JSON fixtures cannot carry an icon component, so the docs' example file
 * (components/combobox/examples/go-to-file) is opened in each framework when the docs server runs
 * (http://localhost:4321, or DOCS_URL) and lists it; otherwise this is skipped, not failed. */
{
  const SITE = BASE.replace(/\/$/, "");
  const EX = `[data-docs-example="go-to-file"]`;
  const listed = await fetch(`${SITE}/components/combobox`).then((r) => r.ok, () => false);
  for (const fw of listed ? targets : []) {
    await p.goto(SITE + "/", 800);
    await q(`localStorage.setItem("fndn-docs-fw", "${fw}"); true`);
    await p.goto(`${SITE}/components/combobox`, 2500);
    if (!(await q(`!!document.querySelector(${JSON.stringify(`${EX} [data-slot=combobox-input]`)})`))) { console.log(`${fw}\n  – item icons: the docs do not show go-to-file yet (restart the docs server); skipped`); continue; }
    await q(`document.querySelector(${JSON.stringify(EX)}).scrollIntoView({block:"center"}); true`); await sleep(200);
    await p.clickSel(`${EX} [data-slot=combobox-input]`); await sleep(400);
    const got = await q(`(()=>{const rows=[...document.querySelectorAll("[data-slot=combobox-content] [data-slot=combobox-item]")].filter((r)=>r.offsetParent);return [rows.length, rows.every((r)=>{const i=r.querySelector("[data-slot=combobox-item-icon]");return i&&i===r.firstElementChild&&i.getAttribute("aria-hidden")==="true"&&Math.round(i.querySelector("svg").getBoundingClientRect().width)===14})]})()`);
    await p.key("Escape");
    const ok = JSON.stringify(got) === JSON.stringify([5, true]);
    if (!ok) failed++;
    console.log(`${fw}\n  ${ok ? "✓" : "✗"} item icons (docs example go-to-file): every option leads with an aria-hidden 14px icon${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
  }
  if (listed) await q(`localStorage.removeItem("fndn-docs-fw"); true`).catch(() => {});
  else console.log(`– item icons: the docs server is not running at ${SITE}; skipped`);
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
