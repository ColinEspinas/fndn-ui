// Editable: a preview that becomes the real Input (Zag editable). The preview has the Input's box
// (height, padding, type) and keeps its text in place when the field takes over; focus, click
// and double click start an edit, Enter and a click away save, Escape cancels; the edit / save /
// cancel Buttons; inline (the text around it); sizes, disabled, worst cases (a long text is cut
// with a title), right-to-left, dark, 320px.
//   node components/editable/editable.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "editable";
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

const PREVIEW = "#stage [data-slot=editable-preview]";
const INPUT = "#stage [data-editable=input]";
const editing = () => q(`!document.querySelector(${JSON.stringify(INPUT)}).hidden`);
const shown = () => q(`document.querySelector(${JSON.stringify(PREVIEW)}).textContent`);
const BOX = ["height", "paddingInlineStart", "fontSize", "borderRadius"];
const box = (sel) => q(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});const cs=getComputedStyle(e);return [...${JSON.stringify(BOX)}.map((k)=>cs[k]), Math.round(e.getBoundingClientRect().width)]})()`);
const away = async () => { await p.hover(1200, 860); await sleep(250); };

async function run(fw, check) {
  await open(fw, 0);
  check("the preview: a tab stop showing the value, the input hidden", await q(`[document.querySelector(${JSON.stringify(PREVIEW)}).tabIndex, document.querySelector(${JSON.stringify(PREVIEW)}).textContent, document.querySelector(${JSON.stringify(INPUT)}).hidden]`), [0, "Summer launch", true]);
  const rest = await box(PREVIEW);
  check("the preview has the Input's md box: 32px, 10px in, 14px type, control radius", rest.slice(0, 4), ["32px", "10px", "14px", "8px"]);
  const r = await p.rect(PREVIEW);
  await p.hover(r.cx, r.cy); await sleep(250);
  check("hovered (pointer), the preview takes the hover fill", await q(`getComputedStyle(document.querySelector(${JSON.stringify(PREVIEW)})).backgroundColor`), await token("--fndn-hover"));
  await away();

  /* keyboard: Tab starts the edit (activationMode focus) */
  await p.click(5, 5); await p.key("Tab"); await sleep(150);
  check("Tab starts the edit: the real Input, focused, the text selected", await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)});return [i.hidden, i.dataset.slot, document.activeElement===i, i.selectionStart, i.selectionEnd, document.querySelector(${JSON.stringify(PREVIEW)}).hidden]})()`), [false, "input", true, 0, 13, true]);
  check("the field takes the preview's place: same box, same width", await box(INPUT), rest);
  await p.type("Fall launch"); await p.key("Enter"); await sleep(150);
  check("Enter saves: the preview shows the new text", [await editing(), await shown()], [false, "Fall launch"]);
  await p.key("Tab", { shift: true }); await p.key("Tab"); await sleep(150);
  await p.type("Nope"); await p.key("Escape"); await sleep(150);
  check("Escape cancels: the text is put back", [await editing(), await shown()], [false, "Fall launch"]);
  await p.clickSel(PREVIEW); await sleep(150);
  check("a click on the preview starts the edit too (focus)", await editing(), true);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("Winter"); await p.click(1200, 860); await sleep(200);
  check("a click away saves", [await editing(), await shown()], [false, "Winter"]);

  await open(fw, 1);
  check("empty: the placeholder in ink-3", await q(`[document.querySelector(${JSON.stringify(PREVIEW)}).textContent, getComputedStyle(document.querySelector(${JSON.stringify(PREVIEW)})).color]`), ["Add a note", await token("--fndn-ink-3", "color")]);
  await open(fw, 2);
  const sm = await box(PREVIEW);
  await p.clickSel(PREVIEW); await sleep(150);
  check("sm: the preview and the field are the Input's 28px box, 8px in, 13px type", [sm.slice(0, 3), (await box(INPUT)).slice(0, 3)], [["28px", "8px", "13px"], ["28px", "8px", "13px"]]);

  /* buttons; double click */
  await open(fw, 3);
  const vis = () => q(`[...document.querySelectorAll("#stage [data-editable$=trigger]")].filter((b)=>!b.hidden).map((b)=>b.getAttribute("aria-label"))`);
  const w0 = await box(PREVIEW);
  check("with buttons: the edit Button alone at rest (named, a Button)", [await vis(), await q(`document.querySelector("#stage [data-editable=edit-trigger]").dataset.slot`)], [["Edit"], "button"]);
  await p.clickSel(PREVIEW); await sleep(150);
  check("activationMode dblclick: a click does not edit", await editing(), false);
  const pr = await p.rect(PREVIEW);
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: pr.cx, y: pr.cy, button: "left", clickCount: 2 });
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pr.cx, y: pr.cy, button: "left", clickCount: 2 });
  await sleep(200);
  check("a double click edits; save and cancel show; the field keeps the preview's width", [await editing(), await vis(), (await box(INPUT))[4]], [true, ["Save", "Cancel"], w0[4]]);
  await p.type("x"); await p.clickSel("#stage [data-editable=cancel-trigger]"); await sleep(200);
  check("Cancel puts the text back", [await editing(), await shown()], [false, "Q3 revenue report"]);
  await p.clickSel("#stage [data-editable=edit-trigger]"); await sleep(200);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("Q4 report"); await p.clickSel("#stage [data-editable=submit-trigger]"); await sleep(200);
  check("Edit, then Save, saves", [await editing(), await shown()], [false, "Q4 report"]);
  await p.hover(1200, 860); await sleep(100);
  const eb = await p.rect("#stage [data-editable=edit-trigger]");
  await p.hover(eb.cx, eb.cy); await sleep(900);
  check("the edit Button's Tooltip names it", await q(`document.querySelector("[data-slot=tooltip]")?.textContent.trim()`), "Edit");
  await away();

  /* inline: the text around it */
  await open(fw, 4);
  const inl = await q(`(()=>{const p=document.querySelector(${JSON.stringify(PREVIEW)}),host=document.querySelector("#stage [data-slot=editable]").parentElement;return [getComputedStyle(p).fontSize===getComputedStyle(host).fontSize, Math.round(p.getBoundingClientRect().height)]})()`);
  await p.clickSel(PREVIEW); await sleep(150);
  check("inline: the preview takes the surrounding type; the field has its height", [inl[0], Math.round((await p.rect(INPUT)).h)], [true, inl[1]]);
  /* the preview reaches 6px past the area on each side, so its text starts and ends with the area's
   * edges in both directions and is not cut (it once kept the area's width and slid 6px) */
  const textFits = () => q(`(()=>{const p=document.querySelector(${JSON.stringify(PREVIEW)}),a=p.parentElement.getBoundingClientRect(),b=p.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(p);const t=r.getBoundingClientRect();return [Math.abs(t.left-a.left)<0.6, Math.abs(t.right-a.right)<0.6, Math.abs(a.left-b.left-6)<0.6, Math.abs(b.right-a.right-6)<0.6, p.scrollWidth<=p.clientWidth]})()`);
  await open(fw, 4);
  check("inline: the text lines up with the area's edges, the box reaches 6px past each, nothing cut", await textFits(), [true, true, true, true, true]);
  await open(fw, 4, "&dir=rtl");
  check("inline, right-to-left: the same", await textFits(), [true, true, true, true, true]);
  await open(fw, 5);
  check("disabled: no tab stop, half opacity", await q(`[document.querySelector(${JSON.stringify(PREVIEW)}).hasAttribute("tabindex"), getComputedStyle(document.querySelector(${JSON.stringify(PREVIEW)})).opacity]`), [false, "0.5"]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  await sleep(200);
  check("a long text is cut at the end on one line; its title holds the whole text", await q(`(()=>{const e=document.querySelector(${JSON.stringify(PREVIEW)});return [getComputedStyle(e).textOverflow, e.scrollWidth>e.clientWidth, e.getAttribute("title")===e.textContent, Math.round(e.getBoundingClientRect().height)]})()`), ["ellipsis", true, true, 32]);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the text keeps its direction and sits on the right", await q(`(()=>{const e=document.querySelector(${JSON.stringify(PREVIEW)});const b=e.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect();return [getComputedStyle(e).unicodeBidi, b.right-t.right<12]})()`), ["plaintext", true]);
  /* multiline: a description; the preview and the textarea are the same box, the text does not move */
  await open(fw, 6);
  const lines = () => q(`(()=>{const e=[...document.querySelectorAll("#stage [data-slot=editable-preview], #stage [data-editable=input]")].find((x)=>!x.hidden);const r=document.createRange();r.selectNodeContents(e.tagName==="TEXTAREA"?e:e);const b=e.getBoundingClientRect();const cs=getComputedStyle(e);return {tag:e.tagName,h:Math.round(b.height),pt:cs.paddingTop,lh:cs.lineHeight,x:Math.round((b.x+parseFloat(cs.paddingLeft))*100)/100,y:Math.round((b.y+parseFloat(cs.paddingTop))*100)/100}})()`);
  const at = await lines();
  check("multiline preview: the text shown whole on several lines (pre-wrap), not cut", await q(`(()=>{const e=document.querySelector(${JSON.stringify(PREVIEW)});const cs=getComputedStyle(e);return [cs.whiteSpace,cs.textOverflow,e.getBoundingClientRect().height>40,e.hasAttribute("title")]})()`), ["pre-wrap", "clip", true, false]);
  await p.clickSel(PREVIEW); await sleep(250);
  const ed = await lines();
  check("multiline: the field is a textarea in the preview's box: same height, padding, leading, the text's start unmoved", [ed.tag, ed.h, ed.pt, ed.lh, Math.abs(ed.x - at.x) <= 0.5, Math.abs(ed.y - at.y) <= 0.5], ["TEXTAREA", at.h, at.pt, at.lh, true, true]);
  await p.key("End", { ctrl: true }); await p.key("Enter"); await p.type("Owner: Priya"); await sleep(150);
  check("Enter is a new line (still editing) and the field grows with it", [await editing(), (await lines()).h > ed.h], [true, true]);
  await p.key("Enter", { ctrl: true }); await sleep(200);
  check("Ctrl+Enter saves: the preview shows the three lines", [await editing(), (await shown()).split("\n").length], [false, 3]);

  await open(fw, 0, "&theme=dark");
  await p.clickSel(PREVIEW); await sleep(300);
  check("dark: the field takes the dark surface while focused", await q(`getComputedStyle(document.querySelector(${JSON.stringify(INPUT)})).backgroundColor`), await token("--fndn-surface"));

  await p.viewport(320, 700, 1.25);
  await open(fw, 1, "&data=worst");
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
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
