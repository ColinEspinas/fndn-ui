// Table: the records table's look (row height, type, rules, card), the data form, numeric columns,
// the caption, the body row's instant hover, the sideways scroller, worst cases, right-to-left,
// dark. Static: no keyboard path but the scroller's (a focusable card when it scrolls).
//   node components/table/table.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "table";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
/* hover: true makes headless Chromium report a mouse, so the gated hover rules apply */
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);
const away = async () => { await p.hover(1200, 860); await sleep(200); };

const R = "#stage [data-slot=table]";
const cs = (sel, keys) => q(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});const s=getComputedStyle(e);return ${JSON.stringify(keys)}.map((k)=>s[k])})()`);
const h = (sel) => q(`Math.round(document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().height*100)/100`);
const HEAD = `${R} [data-slot=table-head]`;
const ROW = (i) => `${R} [data-slot=table-body] > [data-slot=table-row]:nth-child(${i + 1})`;
const CELL = (i, j) => `${ROW(i)} > [data-slot=table-cell]:nth-child(${j + 1})`;
/* the edge veils at the start, the middle and the end of the scroll, in the page's direction:
 * [data-overflow-start, data-overflow-end, ::before opacity, ::after opacity] at each, then the
 * animation names of the scroller and its two veils (none: the scroll position drives them) */
const veilSweep = (sel) => q(`(async()=>{const e=document.querySelector(${JSON.stringify(sel)});const rtl=getComputedStyle(e).direction==="rtl";const range=e.scrollWidth-e.clientWidth;const frame=()=>new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r)));const at=[];for(const f of [0,0.5,1]){e.scrollLeft=(rtl?-1:1)*Math.round(range*f);await frame();at.push([e.hasAttribute("data-overflow-start"),e.hasAttribute("data-overflow-end"),getComputedStyle(e,"::before").opacity,getComputedStyle(e,"::after").opacity])}e.scrollLeft=0;await frame();return {at,animations:[getComputedStyle(e).animationName,getComputedStyle(e,"::before").animationName,getComputedStyle(e,"::after").animationName]}})()`);
const VEILS_SWEPT = { at: [[false, true, "0", "1"], [true, true, "1", "1"], [true, false, "1", "0"]], animations: ["none", "none", "none"] };

async function run(fw, check) {
  await open(fw, 0);
  check("data form: a <table> in the card, thead with 4 th scope=col, tbody with 4 rows", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const t=e.querySelector(":scope > [data-slot=table-table]");return [e.tagName,t.tagName,[...t.querySelectorAll("thead th")].map((x)=>x.scope).join(","),t.querySelectorAll("tbody > tr").length,t.querySelectorAll("tbody td").length]})()`), ["DIV", "TABLE", "col,col,col,col", 4, 16]);
  const surface = await token("--fndn-surface");
  check("card: radius.card, surface, a shadow, scrolls sideways (overscroll-x contain)", await cs(R, ["borderRadius", "backgroundColor", "overflowX", "overscrollBehaviorX"]).then((v) => [...v.slice(0, 2), v[2], v[3]]), ["10px", surface, "auto", "contain"]);
  check("a table that fits its card shows no veil", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.hasAttribute("data-overflow-start"),e.hasAttribute("data-overflow-end"),getComputedStyle(e,"::before").opacity,getComputedStyle(e,"::after").opacity]})()`), [false, false, "0", "0"]);
  check("card has the card shadow", await q(`getComputedStyle(document.querySelector(${JSON.stringify(R)})).boxShadow!=="none"`), true);

  /* the model's metrics: rows 35px, header 12.5px/500 ink-2, values 13px/500 ink */
  const rows = await q(`[...document.querySelectorAll(${JSON.stringify(R + " tr")})].map((r)=>Math.round(r.getBoundingClientRect().height*100)/100)`);
  check("every row is 35px tall, as the records table's", rows.every((x) => x === 35), true);
  const ink2 = await token("--fndn-ink-2", "color"), ink = await token("--fndn-ink", "color");
  check("head cell: 12.5px/500 ink-2, starts at the inline start, padding 12px", await cs(HEAD, ["fontSize", "fontWeight", "color", "textAlign", "paddingInlineStart"]), ["12.5px", "500", ink2, "left", "12px"]);
  check("cell: 13px/500 ink, padding 12px (header and value share their start)", await cs(CELL(0, 0), ["fontSize", "fontWeight", "color", "paddingInlineStart"]), ["13px", "500", ink, "12px"]);
  check("head label and value start at the same x", await q(`Math.abs(document.querySelector(${JSON.stringify(HEAD)}).getBoundingClientRect().x-document.querySelector(${JSON.stringify(CELL(0, 0))}).getBoundingClientRect().x)<0.5`), true);
  check("numeric column: header and values at the end", [await cs(`${HEAD}:nth-child(3)`, ["textAlign"]), await cs(CELL(0, 2), ["textAlign"])], [["right"], ["right"]]);
  /* text baselines of a row's cells line up (same line box, middle aligned) */
  check("a row's values share one baseline", await q(`(()=>{const tops=[...document.querySelectorAll(${JSON.stringify(ROW(0) + " > td")})].map((c)=>{const r=document.createRange();r.selectNodeContents(c);return Math.round(r.getBoundingClientRect().bottom*100)/100});return new Set(tops).size})()`), 1);
  /* rules: 1px (one device pixel) under each cell and at the inline end, none after the last column or under the last row */
  check("rules: one device pixel under and at the end; none after the last column", await q(`(()=>{const w=(e,k)=>Math.round(parseFloat(getComputedStyle(e)[k])*devicePixelRatio);const c=document.querySelector(${JSON.stringify(CELL(0, 0))}),l=document.querySelector(${JSON.stringify(CELL(0, 3))});return [w(c,"borderBottomWidth"),w(c,"borderInlineEndWidth"),w(l,"borderInlineEndWidth")]})()`), [1, 1, 0]);
  check("no rule under the last row (the card's edge ends it)", await q(`parseFloat(getComputedStyle(document.querySelector(${JSON.stringify(CELL(3, 0))})).borderBottomWidth)`), 0);

  /* hover: a body row fills hover at once (no transition); the header row does not */
  const r1 = await p.rect(CELL(1, 1));
  await p.hover(r1.cx, r1.cy); await sleep(30);
  check("hover: the body row fills hover at once", [await cs(ROW(1), ["backgroundColor", "transitionDuration"])], [[await token("--fndn-hover"), "0s"]]);
  const rh = await p.rect(HEAD);
  await p.hover(rh.cx, rh.cy); await sleep(30);
  check("the header row does not hover", await cs(`${R} [data-slot=table-header] > tr`, ["backgroundColor"]), ["rgba(0, 0, 0, 0)"]);
  await away();

  /* caption under the rows, 12px ink-2 */
  await open(fw, 1);
  check("caption: under the rows, 12px ink-2, names the table", await q(`(()=>{const c=document.querySelector("${R} [data-slot=table-caption]");const t=document.querySelector("${R} tbody").getBoundingClientRect();const s=getComputedStyle(c);return [c.getBoundingClientRect().top>=t.bottom-0.5,s.fontSize,s.color===${JSON.stringify(await token("--fndn-ink-2", "color"))},s.captionSide,c.textContent]})()`), [true, "12px", true, "bottom", "Invoices paid in October"]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long values wrap whole (no ellipsis), rows grow past 35px", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CELL(0, 0))});const s=getComputedStyle(c);return [s.textOverflow,s.whiteSpace,c.getBoundingClientRect().height>35]})()`), ["clip", "normal", true]);
  check("an unbreakable value widens its column and the card scrolls; the page does not", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.scrollWidth>e.clientWidth,document.documentElement.scrollWidth<=innerWidth,Math.round(e.getBoundingClientRect().width)]})()`), [true, true, 360]);
  await open(fw, 1, "&data=worst");
  /* edge veils (as the records and filter tables): at the start only the end one shows, scrolled
   * both, at the end only the start one; drawn from the scroll position, no animation */
  check("a table wider than its card fades at the edge it continues past (end veil, both, start veil), no animation", await veilSweep(R), VEILS_SWEPT);
  await open(fw, 1, "&data=worst&dir=rtl");
  check("rtl: the same veils at the start, the middle and the end", await veilSweep(R), VEILS_SWEPT);
  await open(fw, 1, "&data=worst");
  check("many columns at 320px: the card scrolls sideways, every header label whole", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.scrollWidth>e.clientWidth,[...e.querySelectorAll("th")].every((t)=>t.scrollWidth<=t.clientWidth+1)]})()`), [true, true]);
  await p.click(5, 5); await p.key("Tab");
  check("a scrolling card is reachable by Tab and draws its ring inside", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const s=getComputedStyle(e);return [document.activeElement===e,s.outlineStyle,parseFloat(s.outlineOffset)<0]})()`), [true, "solid", true]);
  await p.key("ArrowRight"); await sleep(300);
  check("ArrowRight scrolls it", await q(`document.querySelector(${JSON.stringify(R)}).scrollLeft>0`), true);
  await open(fw, 2, "&data=worst");
  check("no rows: the header alone, no error", await q(`[document.querySelectorAll("${R} th").length,document.querySelectorAll("${R} tbody tr").length]`), [2, 0]);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: header and text start on the right, numbers on the left; each value in its own direction", await q(`(()=>{const th=document.querySelectorAll("${R} th");const td=document.querySelector(${JSON.stringify(CELL(1, 0))});return [getComputedStyle(th[0]).textAlign,getComputedStyle(th[2]).textAlign,getComputedStyle(td).textAlign,getComputedStyle(td).unicodeBidi]})()`), ["right", "left", "right", "plaintext"]);
  /* flush: an issue list in a pane: no card, no column rules, one line per row, the title gives way */
  await open(fw, 3);
  check("flush: no card (no surface, shadow or radius)", await cs(R, ["backgroundColor", "boxShadow", "borderRadius"]).then(([b, sh, rad]) => [b, sh === "none" || sh.split(/,(?![^(]*\))/).every((x) => x.trim().startsWith("rgba(0, 0, 0, 0)")), rad]), ["rgba(0, 0, 0, 0)", true, "0px"]);
  check("flush: every row is one 35px line", await q(`[...document.querySelectorAll(${JSON.stringify(R + " tr")})].map((r)=>Math.round(r.getBoundingClientRect().height*100)/100)`), [35, 35, 35, 35, 35]);
  check("flush: a hairline between rows, no rule between columns", await q(`(()=>{const w=(e,k)=>Math.round(parseFloat(getComputedStyle(e)[k])*devicePixelRatio);const c=document.querySelector(${JSON.stringify(CELL(0, 0))});const h=document.querySelector(${JSON.stringify(HEAD)});return [w(c,"borderBottomWidth"),getComputedStyle(c).borderInlineEndColor,w(h,"borderBottomWidth"),getComputedStyle(h).borderInlineEndColor]})()`), [1, "rgba(0, 0, 0, 0)", 1, "rgba(0, 0, 0, 0)"]);
  const cut = () => q(`(()=>{const c=document.querySelector(${JSON.stringify(CELL(0, 1))});const s=getComputedStyle(c);const others=[0,2,3,4].map((j)=>{const e=document.querySelector(${JSON.stringify(ROW(0))}+" > td:nth-child("+(j+1)+")");return e.scrollWidth<=e.clientWidth+1&&getComputedStyle(e).whiteSpace==="nowrap"});return [s.textOverflow,s.whiteSpace,c.scrollWidth>c.clientWidth,c.getAttribute("title")===c.textContent,others.every(Boolean)]})()`);
  await sleep(100);
  check("flush: the title cell is cut with an ellipsis and carries its text as a title; the other cells are whole, on one line", await cut(), ["ellipsis", "nowrap", true, true, true]);
  check("flush: a short title is not cut and has no title", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CELL(2, 1))});return [c.scrollWidth<=c.clientWidth+1,c.hasAttribute("title")]})()`), [true, false]);
  check("no class attribute on the row groups (all three targets alike)", await q(`[document.querySelector("${R} thead").hasAttribute("class"),document.querySelector("${R} tbody").hasAttribute("class")]`), [false, false]);
  await open(fw, 5, "&data=worst");
  check("flush at 320px: the title gives way first, names stay whole, the pane scrolls sideways (the page does not)", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const t=document.querySelector(${JSON.stringify(CELL(0, 1))});const a=document.querySelector(${JSON.stringify(CELL(1, 3))});return [getComputedStyle(t).textOverflow,a.scrollWidth<=a.clientWidth+1,e.scrollWidth>e.clientWidth,document.documentElement.scrollWidth<=innerWidth,[...e.querySelectorAll("tr")].every((r)=>Math.round(r.getBoundingClientRect().height)===35)]})()`), ["ellipsis", true, true, true, true]);
  /* loading: placeholder rows, aria-busy */
  await open(fw, 4);
  check("loading: aria-busy, the header and 4 placeholder rows of 35px, one hidden bar per cell", await q(`(()=>{const t=document.querySelector("${R} table");const rows=[...t.querySelectorAll("tbody tr")];return [t.getAttribute("aria-busy"),t.querySelectorAll("thead th").length,rows.length,rows.every((r)=>Math.round(r.getBoundingClientRect().height)===35),rows.every((r)=>[...r.cells].every((c)=>c.querySelectorAll("[data-slot=table-skeleton][aria-hidden=true]").length===1))]})()`), ["true", 5, 4, true, true]);
  check("loading: the bars are still (no animation) and a number column's bar sits at the end", await q(`(()=>{const b=document.querySelector("${R} tbody tr td:last-child [data-slot=table-skeleton]");const c=b.parentElement.getBoundingClientRect(),r=b.getBoundingClientRect();return [document.querySelector("${R} [data-slot=table-skeleton]").getAnimations().length,Math.abs(c.right-parseFloat(getComputedStyle(b.parentElement).paddingRight)-r.right)<1]})()`), [0, true]);
  await open(fw, 5, "&step=1");
  check("loaded: aria-busy gone, the rows replace the placeholders", await q(`(()=>{const t=document.querySelector("${R} table");return [t.hasAttribute("aria-busy"),t.querySelectorAll("tbody tr").length,t.querySelectorAll("[data-slot=table-skeleton]").length,t.querySelector("tbody td").textContent]})()`), [false, 3, 0, "main"]);

  await open(fw, 1, "&theme=dark");
  check("dark: the card is the dark surface, values in the dark ink", [await cs(R, ["backgroundColor"]), await cs(CELL(0, 0), ["color"])], [[await token("--fndn-surface")], [await token("--fndn-ink", "color")]]);
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
/* rich cells in the data form (React: nodes as values; Vue: the cell slot; Svelte: the cell
 * snippet): the JSON fixtures cannot carry a component, so the docs' example file
 * (components/table/examples/deploy-history) is opened in each framework when the docs server runs
 * and lists it; otherwise this is skipped, not failed. The three must render the same DOM. */
{
  const SITE = BASE.replace(/\/$/, "");
  const EX = `[data-docs-example="deploy-history"]`;
  const listed = await fetch(`${SITE}/components/table`).then((r) => r.ok, () => false);
  /* the cells' DOM as text: elements, data-slot, class, href, aria-hidden, and the trimmed text */
  const shape = `(()=>{const walk=(n)=>n.nodeType===3?(n.textContent.trim()?JSON.stringify(n.textContent.trim()):""):n.nodeType!==1?"":"<"+n.tagName.toLowerCase()+["data-slot","class","href","aria-hidden"].map((a)=>n.hasAttribute(a)?" "+a+"="+JSON.stringify(n.getAttribute(a)):"").join("")+">"+[...n.childNodes].map(walk).join("")+"</>";return walk(document.querySelector(${JSON.stringify(`${EX} [data-slot=table-body]`)}))})()`;
  const shapes = {};
  for (const fw of listed ? targets : []) {
    await p.goto(SITE + "/", 800);
    await q(`localStorage.setItem("fndn-docs-fw", "${fw}"); true`);
    await p.goto(`${SITE}/components/table`, 2500);
    if (!(await q(`!!document.querySelector(${JSON.stringify(EX)})`))) { console.log(`${fw}\n  – rich cells: the docs do not list deploy-history yet (restart the docs server); skipped`); continue; }
    await q(`document.querySelector(${JSON.stringify(EX)}).scrollIntoView({block:"center"}); true`);
    for (let t = 0; t < 80 && !(await q(`!!document.querySelector(${JSON.stringify(`${EX} [data-slot=table-cell] [data-slot=status-pill]`)})`)); t++) await sleep(100);
    const got = await q(`(()=>{const rows=[...document.querySelectorAll(${JSON.stringify(`${EX} [data-slot=table-body] > [data-slot=table-row]`)})];return [rows.length, rows.every((r)=>{const c=[...r.cells];return c.length===5&&c[0].firstElementChild?.dataset.slot==="link"&&c[0].textContent.trim()===c[0].firstElementChild.textContent&&c[1].children.length===0&&c[2].firstElementChild?.dataset.slot==="status-pill"&&!!c[3].querySelector("[data-slot=avatar]")&&c[4].children.length===0&&Math.round(r.getBoundingClientRect().height)>=35}), rows[0]?.cells[0].querySelector("a")?.getAttribute("href")]})()`);
    if (got[0] === 0) { console.log(`${fw}\n  – rich cells: the docs list deploy-history but did not mount it (restart the docs server; see scripts/qa/docs.mjs); skipped`); continue; }
    shapes[fw] = await q(shape);
    const ok = JSON.stringify(got) === JSON.stringify([4, true, "/web-app/deploys/dpl_7f3a9c"]);
    if (!ok) failed++;
    console.log(`${fw}\n  ${ok ? "✓" : "✗"} rich cells (docs example deploy-history): a link, a status pill and an avatar in their cells, the other values as plain text${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
  }
  const [first, ...others] = Object.keys(shapes);
  for (const fw of others) {
    const ok = shapes[fw] === shapes[first];
    if (!ok) failed++;
    console.log(`${ok ? "✓" : "✗"} rich cells: ${fw} renders the same cells as ${first}${ok ? "" : `\n    ${first}: ${shapes[first].slice(0, 600)}\n    ${fw}: ${shapes[fw].slice(0, 600)}`}`);
  }
  if (listed) await q(`localStorage.removeItem("fndn-docs-fw"); true`).catch(() => {});
  else console.log(`– rich cells: the docs server is not running at ${SITE}; skipped`);
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
