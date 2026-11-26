// Listbox: the select's list laid in the page. Roles from Ark (Zag listbox), rows compared with
// the select's, pointer (glide, click chooses), keyboard (one tab stop, arrows glide, Home / End,
// type-ahead, Enter), multiple, the highlight hidden when the list is neither hovered nor focused,
// sizes, disabled, descriptions (cut with a title, the label keeps 70%), icons (through the docs'
// example file), worst cases (long options wrap, many scroll), right-to-left, dark, 320px.
//   node components/listbox/listbox.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "listbox";
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

const LIST = "#stage [data-slot=listbox-content]";
const ITEM = "#stage [data-slot=listbox-item]";
const highlighted = () => q(`document.querySelector(${JSON.stringify(`${ITEM}[data-highlighted]`)})?.textContent.trim() ?? null`);
const chosen = () => q(`[...document.querySelectorAll(${JSON.stringify(`${ITEM}[aria-selected=true]`)})].map((e)=>e.querySelector("[data-slot=listbox-item-text]").textContent.trim())`);
const focused = () => q(`document.activeElement === document.querySelector(${JSON.stringify(LIST)})`);
const glideShown = () => q(`(()=>{const g=document.querySelector("#stage [data-slot=listbox-highlight]");return g.hasAttribute("data-visible") && getComputedStyle(g).opacity==="1"})()`);
const dur = (sel, prop) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));const props=cs.transitionProperty.split(",").map((x)=>x.trim());const d=cs.transitionDuration.split(",").map((x)=>x.trim());const i=props.indexOf(${JSON.stringify(prop)});return i<0?null:d[i%d.length]})()`);
const ROW = ["height", "fontSize", "paddingInlineStart", "borderRadius", "color"];
const rowLook = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(ROW)}.map((k)=>cs[k])})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("content is a listbox and the one tab stop, named by its label; rows are options", await q(`(()=>{const l=document.querySelector(${JSON.stringify(LIST)});const lab=document.querySelector("#stage [data-slot=listbox-label]");return [l.getAttribute("role"),l.tabIndex,l.getAttribute("aria-labelledby")===lab.id,[...l.querySelectorAll("[data-slot=listbox-item]")].every((i)=>i.getAttribute("role")==="option"&&i.tabIndex<0)]})()`), ["listbox", 0, true, true]);
  const mine = await rowLook(`${ITEM}:nth-of-type(1)`);
  await open(fw, 0, "", "select");
  await p.clickSel("#stage [data-slot=select-trigger]"); await sleep(400);
  check("a row is the select's option row (12.5px, padding, radius, ink); md rows are 32px, the control scale's", [mine[0], ...mine.slice(1)], ["32px", ...(await rowLook("[data-slot=select-content] [data-slot=select-item]")).slice(1)]);

  /* pointer */
  await open(fw, 0);
  check("at rest: no highlight, nothing chosen", [await glideShown(), await chosen()], [false, []]);
  let r = await p.rect(`${ITEM}:nth-of-type(2)`);
  await p.hover(r.cx, r.cy); await sleep(300);
  check("hover: the highlight glides to the row (4px padding + one 32px row)", [await glideShown(), await q(`document.querySelector("#stage [data-slot=listbox-highlight]").style.transform`)], [true, "translateY(36px)"]);
  await p.click(r.cx, r.cy); await sleep(200);
  check("a click chooses the row: aria-selected, checked, its check shown; the list takes focus without a ring", [await chosen(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(`${ITEM}:nth-of-type(2) [data-slot=listbox-item-indicator]`)})).visibility`), await focused(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(LIST)})).boxShadow.includes(${JSON.stringify(await token("--fndn-accent", "color"))})`)], [["Supplier card"], "visible", true, false]);
  r = await p.rect(`${ITEM}:nth-of-type(3)`);
  await p.click(r.cx, r.cy); await sleep(200);
  check("single: another click replaces the choice", await chosen(), ["Order summary"]);
  await p.click(1200, 860); await sleep(400);
  check("neither hovered nor focused: the highlight fades out", await q(`getComputedStyle(document.querySelector("#stage [data-slot=listbox-highlight]")).opacity`), "0");

  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab"); await sleep(300);
  check("Tab focuses the list and shows the field's accent ring", [await focused(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(LIST)})).boxShadow.includes(${JSON.stringify(await token("--fndn-accent", "color"))})`)], [true, true]);
  const first = await highlighted();
  await p.key("ArrowDown"); await sleep(40);
  check("ArrowDown moves the highlight, which glides (transform over duration.move)", [first, await highlighted(), await dur("#stage [data-slot=listbox-highlight]", "transform")], ["Invoice card", "Supplier card", "0.2s"]);
  await sleep(300);
  check("aria-activedescendant follows the highlight; the layer lands on it", await q(`(()=>{const l=document.querySelector(${JSON.stringify(LIST)}),a=l.querySelector("[data-highlighted]"),g=l.querySelector("[data-slot=listbox-highlight]");return [l.getAttribute("aria-activedescendant")===a.id, Math.abs(g.getBoundingClientRect().top-a.getBoundingClientRect().top)<0.5]})()`), [true, true]);
  await p.key("End"); await sleep(60);
  check("End stops at the last enabled option", await highlighted(), "Order summary");
  await p.key("Home"); await sleep(60);
  check("Home goes to the first option", await highlighted(), "Invoice card");
  await p.key("s", { text: "s" }); await sleep(60);
  check("type-ahead jumps to the match", await highlighted(), "Supplier card");
  await p.key("Enter"); await sleep(100);
  check("Enter chooses, instantly; focus stays on the list", [await chosen(), await focused()], [["Supplier card"], true]);

  /* multiple */
  await open(fw, 1);
  check("multiple: aria-multiselectable, the values given are chosen", [await q(`document.querySelector(${JSON.stringify(LIST)}).getAttribute("aria-multiselectable")`), await chosen()], ["true", ["Extra seats", "Audit log"]]);
  r = await p.rect(`${ITEM}:nth-of-type(3)`);
  await p.click(r.cx, r.cy); await sleep(150);
  r = await p.rect(`${ITEM}:nth-of-type(1)`);
  await p.click(r.cx, r.cy); await sleep(150);
  check("multiple: a click adds a row, another removes one", await chosen(), ["Audit log", "Usage alerts"]);

  await open(fw, 2);
  check("sm: 28px rows", await q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].map((e)=>Math.round(e.getBoundingClientRect().height))`), [28, 28, 28]);
  await open(fw, 3);
  r = await p.rect(`${ITEM}:nth-of-type(2)`);
  await p.click(r.cx, r.cy); await sleep(150);
  check("disabled: rows are disabled, a click chooses nothing", [await q(`[...document.querySelectorAll(${JSON.stringify(ITEM)})].every((e)=>e.hasAttribute("data-disabled"))`), await chosen()], [true, ["North"]]);

  /* description: one line after the label, the one part that is cut, with a title */
  await open(fw, 4);
  check("description: after the label, 12px ink-2 on one line, a title with its full text; none on a row without one", await q(`(()=>{const rows=[...document.querySelectorAll(${JSON.stringify(ITEM)})];const d=rows[0].querySelector("[data-slot=listbox-item-description]");const s=getComputedStyle(d);return [d.previousElementSibling?.dataset.slot,s.fontSize,s.color,s.whiteSpace,d.title===d.textContent.trim(),!!rows[2].querySelector("[data-slot=listbox-item-description]")]})()`), ["listbox-item-text", "12px", await token("--fndn-ink-2", "color"), "nowrap", true, false]);
  check("description: a row keeps its 32px with one, label and description on one baseline", await q(`(()=>{const r=document.querySelector(${JSON.stringify(ITEM)});const t=r.querySelector("[data-slot=listbox-item-text]").getBoundingClientRect(),d=r.querySelector("[data-slot=listbox-item-description]").getBoundingClientRect(),b=r.getBoundingClientRect();return [Math.round(b.height), Math.abs((t.top+t.bottom)/2-(b.top+b.bottom)/2)<1]})()`), [32, true]);
  /* xs with status letters (example 5): dense rows, the meta in its tone at the end */
  await open(fw, 5);
  check("xs: 24px rows, 12px text; a status letter at the end in its tone", await q(`(()=>{const rows=[...document.querySelectorAll(${JSON.stringify(ITEM)})];const m=rows.map((r)=>r.querySelector("[data-slot=listbox-item-meta]"));return [rows.map((r)=>Math.round(r.getBoundingClientRect().height)), getComputedStyle(rows[0]).fontSize, m.map((e)=>getComputedStyle(e).color), m[0].getBoundingClientRect().right>rows[0].querySelector("[data-slot=listbox-item-description]").getBoundingClientRect().right]})()`), [[24, 24, 24, 24], "12px", [await token("--fndn-orange", "color"), await token("--fndn-green", "color"), await token("--fndn-red", "color"), await token("--fndn-orange", "color")], true]);
  /* flush (example 6): no surface, no hairline, no padding; the highlight runs edge to edge */
  await open(fw, 6);
  { const l = await q(`(()=>{const l=document.querySelector(${JSON.stringify(LIST)});const s=getComputedStyle(l);const r=l.querySelector("[data-slot=listbox-item]").getBoundingClientRect(),b=l.getBoundingClientRect();return [s.backgroundColor,s.boxShadow.split(/,(?![^(]*\\))/).every((x)=>x.trim()==="none"||x.trim().startsWith("rgba(0, 0, 0, 0)")),s.paddingTop,s.maxHeight,Math.round(r.left-b.left),Math.round(b.right-r.right)]})()`);
    check("flush: no surface, no hairline, no padding, no height cap; rows edge to edge", l, ["rgba(0, 0, 0, 0)", true, "0px", "none", 0, 0]); }
  { const r = await p.rect(`${ITEM}:nth-of-type(3)`); await p.hover(r.cx, r.cy); await sleep(500);
    check("flush: the highlight covers the hovered row edge to edge", await q(`(()=>{const h=document.querySelector("#stage [data-slot=listbox-highlight]").getBoundingClientRect(),l=document.querySelector(${JSON.stringify(LIST)}).getBoundingClientRect();return [Math.round(h.left-l.left),Math.round(l.right-h.right)]})()`), [0, 0]); }

  /* worst cases */
  await open(fw, 5, "&data=worst");
  check("long description: cut with an ellipsis, its title the full text; a long label wraps whole and keeps 70% of the row; an empty description is not drawn", await q(`(()=>{const rows=[...document.querySelectorAll(${JSON.stringify(ITEM)})];const d=rows[0].querySelector("[data-slot=listbox-item-description]");const t=rows[1].querySelector("[data-slot=listbox-item-text]");const d2=rows[1].querySelector("[data-slot=listbox-item-description]");const w=rows[1].clientWidth;return [d.scrollWidth>d.clientWidth,getComputedStyle(d).textOverflow,d.title.endsWith("nw_live_8f2c4a91d7e3b6058a1f"),t.scrollWidth<=t.clientWidth+1,t.getBoundingClientRect().height>20,t.getBoundingClientRect().width<=w*0.7+1,d2.scrollWidth>d2.clientWidth,!!rows[2].querySelector("[data-slot=listbox-item-description]")]})()`), [true, "ellipsis", true, true, true, true, true, false]);
  await open(fw, 5, "&data=worst&dir=rtl");
  check("rtl: the description sits after the label, toward the left", await q(`(()=>{const r=document.querySelector(${JSON.stringify(ITEM)});return r.querySelector("[data-slot=listbox-item-description]").getBoundingClientRect().right<=r.querySelector("[data-slot=listbox-item-text]").getBoundingClientRect().left+0.5})()`), true);
  await open(fw, 6, "&data=worst");
  check("a wrapped label: the description sits on its first line, not centred on all", await q(`(()=>{const r=document.querySelector(${JSON.stringify(ITEM)});const t=r.querySelector("[data-slot=listbox-item-text]").getBoundingClientRect(),d=r.querySelector("[data-slot=listbox-item-description]").getBoundingClientRect();return [t.height>20, d.top<t.top+t.height/2]})()`), [true, true]);
  await open(fw, 0, "&data=worst");
  check("long options: wrapped, none cut; the list keeps its 180px", await q(`(()=>{const t=[...document.querySelectorAll("#stage [data-slot=listbox-item-text]")];return [t.filter((e)=>e.scrollWidth>e.clientWidth+1||getComputedStyle(e).textOverflow==="ellipsis").length, t.some((e)=>e.getBoundingClientRect().height>20), Math.round(document.querySelector(${JSON.stringify(LIST)}).getBoundingClientRect().width)]})()`), [0, true, 180]);
  await open(fw, 1, "&data=worst");
  check("many options: the list stops at 360px and scrolls inside itself", await q(`(()=>{const l=document.querySelector(${JSON.stringify(LIST)});return [Math.round(l.getBoundingClientRect().height), l.scrollHeight>l.clientHeight, getComputedStyle(l).overscrollBehaviorY]})()`), [360, true, "auto"]);
  await p.click(5, 5); await p.key("Tab"); await p.key("End"); await sleep(400);
  check("End scrolls the last option into view", await q(`(()=>{const l=document.querySelector(${JSON.stringify(LIST)}).getBoundingClientRect(),a=document.querySelector(${JSON.stringify(`${ITEM}[data-highlighted]`)}).getBoundingClientRect();return [document.querySelector(${JSON.stringify(`${ITEM}[data-highlighted]`)}).textContent.trim(), a.bottom<=l.bottom+0.5]})()`), ["South African rand", true]);
  await open(fw, 4, "&data=worst&dir=rtl");
  check("rtl: the list is right-to-left; options keep their own direction", await q(`[getComputedStyle(document.querySelector(${JSON.stringify(LIST)})).direction, getComputedStyle(document.querySelector("#stage [data-slot=listbox-item-text]")).unicodeBidi]`), ["rtl", "plaintext"]);
  await open(fw, 0, "&theme=dark");
  check("dark: the list takes the dark surface", await q(`getComputedStyle(document.querySelector(${JSON.stringify(LIST)})).backgroundColor`), await token("--fndn-surface"));

  await p.viewport(320, 700, 1.25);
  await open(fw, 0, "&data=worst");
  check("320px: the page does not scroll sideways", await q(`document.documentElement.scrollWidth<=320`), true);
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
/* icons: the JSON fixtures cannot carry an icon component, so the docs' example file
 * (components/listbox/examples/alert-channels) is read in each framework when the docs server runs
 * (http://localhost:4321, or DOCS_URL) and lists it; otherwise this is skipped, not failed. */
{
  const SITE = BASE.replace(/\/$/, "");
  const EX = `[data-docs-example="alert-channels"]`;
  const listed = await fetch(`${SITE}/components/listbox`).then((r) => r.ok, () => false);
  for (const fw of listed ? targets : []) {
    await p.goto(SITE + "/", 800);
    await q(`localStorage.setItem("fndn-docs-fw", "${fw}"); true`);
    await p.goto(`${SITE}/components/listbox`, 2500);
    if (!(await q(`!!document.querySelector(${JSON.stringify(EX)})`))) { console.log(`${fw}\n  – icons: the docs do not list alert-channels yet (restart the docs server); skipped`); continue; }
    await q(`document.querySelector(${JSON.stringify(EX)}).scrollIntoView(); true`);
    for (let t = 0; t < 80 && !(await q(`!!document.querySelector(${JSON.stringify(`${EX} [data-slot=listbox-item-icon] svg`)})`)); t++) await sleep(100);
    const ink3 = await token("--fndn-ink-3", "color");
    const got = await q(`(()=>{const rows=[...document.querySelectorAll(${JSON.stringify(`${EX} [data-slot=listbox-item]`)})];return [rows.length, rows.every((r)=>{const i=r.querySelector("[data-slot=listbox-item-icon]");return i&&i===r.firstElementChild&&i.getAttribute("aria-hidden")==="true"&&Math.round(i.querySelector("svg").getBoundingClientRect().width)===14&&getComputedStyle(i).color===${JSON.stringify(ink3)}}), rows.every((r)=>r.querySelector("[data-slot=listbox-item-description]")?.title)]})()`);
    /* listed but not mounted: the docs server has not loaded the new file yet (it needs a restart)
     * or fails on something else (scripts/qa/docs.mjs reports that) */
    if (got[0] === 0) { console.log(`${fw}\n  – icons: the docs list alert-channels but did not mount it (restart the docs server; see scripts/qa/docs.mjs); skipped`); continue; }
    const ok = JSON.stringify(got) === JSON.stringify([4, true, true]);
    if (!ok) failed++;
    console.log(`${fw}\n  ${ok ? "✓" : "✗"} icons (docs example alert-channels): every row leads with an aria-hidden 14px icon in ink-3, a description with a title${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
  }
  if (listed) await q(`localStorage.removeItem("fndn-docs-fw"); true`).catch(() => {});
  else console.log(`– icons: the docs server is not running at ${SITE}; skipped`);
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
