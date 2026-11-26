// Button group: real Buttons joined (compared with a Button), corners and hairline joins, focus
// rising, keyboard stops, vertical, items props, worst cases, right-to-left, dark.
//   node components/button-group/button-group.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "button-group";
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
const away = async () => { await p.hover(1200, 860); await sleep(300); };

const R = "#stage [data-slot=button-group]";
const B = `${R} > [data-slot=button]`;
const kids = () => q(`(()=>{const round=(n)=>Math.round(n*100)/100;return [...document.querySelectorAll(${JSON.stringify(B)})].map((b)=>{const r=b.getBoundingClientRect(),cs=getComputedStyle(b);return {x0:round(r.left),x1:round(r.right),y0:round(r.top),y1:round(r.bottom),w:round(r.width),h:round(r.height),tl:cs.borderTopLeftRadius,tr:cs.borderTopRightRadius,bl:cs.borderBottomLeftRadius,br:cs.borderBottomRightRadius,z:cs.zIndex}})})()`);
const LOOK = ["height", "paddingInlineStart", "paddingInlineEnd", "fontSize", "fontWeight", "lineHeight", "boxShadow", "backgroundColor", "color"];
const look = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);
const round = (r) => parseFloat(r) > 100;
const square = (r) => r === "0px";

async function run(fw, check) {
  await open(fw, 0);
  check("a group named History of three Buttons marked data-button-group=item", await q(`(()=>{const g=document.querySelector(${JSON.stringify(R)});return [g.getAttribute("role"),g.getAttribute("aria-label"),[...g.children].map((b)=>[b.tagName,b.dataset.slot,b.dataset.buttonGroup,b.textContent.trim()])]})()`), ["group", "History", [["BUTTON", "button", "item", "Undo"], ["BUTTON", "button", "item", "Redo"], ["BUTTON", "button", "item", "History"]]]);
  const mine = await look(`${B}:nth-child(2)`);
  await open(fw, 1, "", "button");
  check("each is the Button (outline md: height, padding, type, ring, fill, ink)", mine, await look("#stage [data-slot=button]"));
  await open(fw, 0);
  let k = await kids();
  check("joined: each starts one pixel after the previous ends (the join's one hairline), one row, 32px", [k.slice(1).every((b, i) => Math.abs(b.x0 - k[i].x1 - 1) < 0.01), k.every((b) => b.y0 === k[0].y0 && b.h === 32)], [true, true]);
  check("corners: outer ends pill, inner corners square", k.map((b) => [round(b.tl), round(b.tr), round(b.br), round(b.bl)]), [[true, false, false, true], [false, false, false, false], [false, true, true, false]]);
  /* the join is one hairline: the next button's ring covers the previous one's edge */
  check("a join is one 1px line: the later button paints over the earlier (DOM order, no z-index at rest)", k.map((b) => b.z), ["auto", "auto", "auto"]);
  /* keyboard: every button is a stop; the focused one rises */
  await p.click(5, 5); await p.key("Tab");
  check("Tab: the first button", await q(`document.activeElement.textContent.trim()`), "Undo");
  await p.key("Tab");
  check("Tab: the second, which rises above its neighbours (z-index 2)", [await q(`document.activeElement.textContent.trim()`), await q(`getComputedStyle(document.activeElement).zIndex`)], ["Redo", "2"]);
  await p.key("Tab");
  check("Tab: the third (three stops, not one)", await q(`document.activeElement.textContent.trim()`), "History");
  const r = await p.rect(`${B}:nth-child(2)`);
  await p.hover(r.cx, r.cy); await sleep(200);
  check("hover is the Button's own (outline: inset)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(B + ":nth-child(2)")})).backgroundColor`), await token("--fndn-inset"));
  await away();

  await open(fw, 1);
  k = await kids();
  check("rounded sm: 28px, outer corners radius.chip (6px), inner square", [k[0].h, k[0].tl, k[0].tr, k[2].tr, k[2].tl], [28, "6px", "0px", "6px", "0px"]);
  await open(fw, 2);
  k = await kids();
  check("vertical: one column, every button as wide as the widest, one pixel apart (the join's hairline)", [new Set(k.map((b) => b.w)).size, k.slice(1).every((b, i) => Math.abs(b.y0 - k[i].y1 - 1) < 0.01)], [1, true]);
  check("vertical corners: radius.control at the top of the first and the bottom of the last, square inside", [k[0].tl, k[0].tr, k[0].bl, k[1].tl, k[1].bl, k[2].bl, k[2].br, k[2].tl], ["8px", "8px", "0px", "0px", "0px", "8px", "8px", "0px"]);
  await open(fw, 3);
  check("a disabled item: native disabled, the others enabled", await q(`[...document.querySelectorAll(${JSON.stringify(B)})].map((b)=>b.disabled)`), [false, true]);
  await open(fw, 4);
  check("ghost sm: 28px, transparent", await q(`(()=>{const b=document.querySelector(${JSON.stringify(B)});return [b.getBoundingClientRect().height,getComputedStyle(b).backgroundColor]})()`), [28, "rgba(0, 0, 0, 0)"]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long labels in 220px: the buttons share it, labels cut at the end with a title, nothing overflows", await q(`(()=>{const g=document.querySelector(${JSON.stringify(R)});const ls=[...g.querySelectorAll("[data-slot=button-label]")];return [Math.round(g.getBoundingClientRect().width)<=220,g.scrollWidth<=g.clientWidth+1,ls.some((l)=>l.getAttribute("title")===l.textContent)]})()`), [true, true, true]);
  await open(fw, 1, "&data=worst");
  k = await kids();
  check("one item: every corner round", [round(k[0].tl), round(k[0].tr), round(k[0].br), round(k[0].bl)], [true, true, true, true]);
  await open(fw, 2, "&data=worst");
  check("twelve items in 320px: nothing overflows", await q(`(()=>{const g=document.querySelector(${JSON.stringify(R)});return g.scrollWidth<=g.clientWidth+1&&g.getBoundingClientRect().width<=320})()`), true);
  await open(fw, 3, "&data=worst&dir=rtl");
  k = await kids();
  check("rtl: the first button is at the right, its right corners round, the join mirrored", [k[0].x0 > k[1].x0, round(k[0].tr), round(k[0].tl), round(k[2].tl), round(k[2].tr)], [true, true, false, true, false]);
  await open(fw, 4, "&data=worst");
  check("no items: an empty group, no error", await q(`document.querySelector(${JSON.stringify(R)}).children.length`), 0);
  await open(fw, 0, "&theme=dark");
  check("dark: the Button's dark surface", await q(`getComputedStyle(document.querySelector(${JSON.stringify(B)})).backgroundColor`), await token("--fndn-surface"));
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
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
