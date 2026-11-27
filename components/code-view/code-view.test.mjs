// Keyboard and pointer contract of the Code View, run against every target through the harness.
//   node components/code-view/code-view.test.mjs            all three targets
//   node components/code-view/code-view.test.mjs react      one target
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const INVOICE = [
  "export async function sendInvoice() {",
  '  const account = await getAccount("northwind");',
  "  const base = await billing.fetch({ account });",
  '  await ledger.store(base, { terms: "net-30" });',
  "  if (!base.approved) return null;",
  "  return base.total;",
  "}",
].join("\n");
/* a mouse, so the fold markers stay hidden until the gutter is hovered */
const p = await launch({ dpr: 2, hover: true });
let failed = 0;
/* CodeMirror's module can be held back, to look at the plain listing it replaces */
let holding = false;
const held = [];
p.on("Fetch.requestPaused", (e) => { if (holding) held.push(e.requestId); else void p.send("Fetch.continueRequest", { requestId: e.requestId }); });
await p.send("Fetch.enable", { patterns: [{ urlPattern: "*code-view.editor*" }] });
const release = async () => { holding = false; for (const id of held.splice(0)) await p.send("Fetch.continueRequest", { requestId: id }); };
const open = async (fw, ex, extra = "") => {
  await p.goto(`${BASE}/harness.html?c=code-view&fw=${fw}&ex=${ex}${extra}`, 150);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(25); }
};
/* the editor is loaded on demand: wait until it has replaced the listing */
const editorReady = async () => {
  for (let t = 0; t < 120; t++) { if (await p.eval(`!!document.querySelector("#stage .cm-editor") && !document.querySelector("#stage [data-slot=code-view-body]")`)) return true; await sleep(25); }
  return false;
};
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  p.errors.length = 0;
  const q = (js) => p.eval(js);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  try {
  /* the whole view as pixels */
  const pixels = async (name) => {
    await p.hover(1, 1);
    await sleep(60);
    const b = await p.rect("#stage [data-slot=code-view]");
    const file = path.join(os.tmpdir(), `code-view-${fw}-${name}-${process.pid}.png`);
    await p.shot(file, { x: b.x, y: b.y, width: b.w, height: b.h });
    const data = fs.readFileSync(file).toString("base64");
    fs.rmSync(file);
    return data;
  };
  const differing = (a, b) => q(`(async()=>{const load=(s)=>new Promise((ok)=>{const i=new Image();i.onload=()=>ok(i);i.src="data:image/png;base64,"+s});const [A,E]=await Promise.all([load(${JSON.stringify(a)}),load(${JSON.stringify(b)})]);if(A.width!==E.width||A.height!==E.height) return "size "+A.width+"x"+A.height+" vs "+E.width+"x"+E.height;const px=(img)=>{const c=document.createElement("canvas");c.width=img.width;c.height=img.height;const x=c.getContext("2d");x.drawImage(img,0,0);return x.getImageData(0,0,img.width,img.height).data};const a=px(A),e=px(E);let n=0;for(let i=0;i<a.length;i+=4) if(a[i]!==e[i]||a[i+1]!==e[i+1]||a[i+2]!==e[i+2]) n++;return n})()`);
  const lines = `[...document.querySelectorAll("#stage .cm-line")].map((l)=>l.textContent).join("\\n")`;

  /* Read-only: the plain listing is the first frame, then CodeMirror takes its place */
  holding = true;
  await open(fw, 0);
  check("first frame: the plain listing, every target the same code, whitespace included", await q(`[!!document.querySelector("#stage .cm-editor"), [...document.querySelectorAll("#stage [data-slot=code-view-code]")].map((c)=>c.textContent).join("\\n")]`), [false, INVOICE]);
  check("no frame of its own: no shadow, no radius, no border", await q(`(()=>{const cs=getComputedStyle(document.querySelector("#stage [data-slot=code-view]"));return [cs.boxShadow, cs.borderTopLeftRadius, cs.borderTopWidth]})()`), ["none", "0px", "0px"]);
  check("line numbers are not selectable; rows are 20px; the code is 12.5px mono", await q(`(()=>{const n=document.querySelector("#stage [data-slot=code-view-num]"),c=document.querySelector("#stage [data-slot=code-view-code]");return [getComputedStyle(n).userSelect, Math.round(n.parentElement.getBoundingClientRect().height), getComputedStyle(c).fontSize, getComputedStyle(c).fontFamily.includes("JetBrains Mono")]})()`), ["none", 20, "12.5px", true]);
  check("syntax colours: keywords, strings, calls", await q(`[...new Set([...document.querySelectorAll("#stage [data-slot=code-view-tok]")].map((t)=>t.className))].length`), 3);
  const plainShot = await pixels("plain");
  await release();
  check("read-only: CodeMirror arrives and replaces the listing", await editorReady(), true);
  check("read-only: the same code", await q(lines), INVOICE);
  check("read-only: not a pixel moves when CodeMirror arrives", await differing(plainShot, await pixels("cm")), 0);
  check("read-only: one tab stop, a named read-only multi-line text box; the gutter hidden from assistive tech", await q(`(()=>{const c=document.querySelector("#stage .cm-content");return [c.getAttribute("tabindex"), c.getAttribute("role"), c.getAttribute("aria-readonly"), c.getAttribute("aria-multiline"), c.getAttribute("contenteditable"), c.getAttribute("aria-label"), document.querySelector("#stage .cm-gutters").getAttribute("aria-hidden")]})()`), ["0", "textbox", "true", "true", "false", "src/billing/invoice.ts", "true"]);
  check("read-only: no current line given, nothing tinted", await q(`!!document.querySelector("#stage .cm-hostLine, #stage .cm-activeLine")`), false);
  await p.click(5, 5);
  await p.key("Tab");
  check("Tab reaches the code; no caret is drawn", await q(`[document.activeElement?.classList.contains("cm-content"), !!document.querySelector("#stage .cm-cursor")]`), [true, false]);
  await p.key("f", { ctrl: true });
  await sleep(120);
  check("Mod+F opens find, with no replace caret", await q(`[...document.querySelectorAll("#stage [data-slot=code-view-search] button")].map((b)=>b.getAttribute("aria-label")||b.textContent.trim())`), ["Match case", "Match whole word", "Use regular expression", "Previous match", "Next match", "Close"]);
  await p.type("base");
  await sleep(80);
  check("it counts the matches", await q(`document.querySelector("#stage [data-slot=code-view-search-count]").textContent`), "4 results");
  await p.key("Escape");
  await sleep(50);
  check("Escape closes it and returns the focus to the code", await q(`[!!document.querySelector("#stage [data-slot=code-view-search]"), document.activeElement?.classList.contains("cm-content")]`), [false, true]);
  const l2 = await q(`(()=>{const r=[...document.querySelectorAll("#stage .cm-line")][1].getBoundingClientRect();return {x1:r.left+20,x2:r.left+200,y:r.top+10}})()`);
  await p.drag(l2.x1, l2.y, l2.x2, l2.y);
  check("text can be selected with the pointer, for copying", await q(`getSelection().toString().length > 5`), true);
  await p.key("a", { ctrl: true });
  check("Mod+A selects the whole listing", await q(`getSelection().toString().replace(/\\n+$/,"")`), INVOICE);

  /* Diff and highlighted lines stay the plain listing */
  await open(fw, 1);
  await sleep(300);
  check("Diff: the plain listing (no CodeMirror), one row per line, kinds tinted, bars on add and del, no current line", await q(`(()=>{const rows=[...document.querySelectorAll("#stage [data-slot=code-view-row]")];return [!!document.querySelector("#stage .cm-editor"), rows.length, rows.filter((r)=>r.querySelector("[data-slot=code-view-bar]")).length, document.querySelectorAll("#stage [data-slot=code-view-piece]").length, !!document.querySelector("#stage [aria-current]")]})()`), [false, 4, 2, 2, false]);
  await open(fw, 4);
  await sleep(300);
  check("highlighted lines: the plain listing, shown as given", await q(`[!!document.querySelector("#stage .cm-editor"), document.querySelector("#stage [data-slot=code-view-code]").innerHTML.includes("<span")]`), [false, true]);

  /* Read-only with a current line, no wrap (ex 3): the same file as the editable example */
  holding = true;
  await open(fw, 3);
  check("first frame: currentLine 7, that row alone is current", await q(`(()=>{const rows=[...document.querySelectorAll("#stage [data-slot=code-view-row]")];const cur=rows.filter((r)=>r.getAttribute("aria-current")==="true");return [cur.length, rows.indexOf(cur[0])+1]})()`), [1, 7]);
  check("first frame: an overflowing listing is a named, focusable region", await q(`(()=>{const b=document.querySelector("#stage [data-slot=code-view-body]");return [b.getAttribute("tabindex"), b.getAttribute("role"), b.getAttribute("aria-label")]})()`), ["0", "region", "src/middleware/rate-limit.ts"]);
  const geometry = `(()=>{const root=document.querySelector("#stage [data-slot=code-view]");const rb=root.getBoundingClientRect();const text=(e)=>{const g=document.createRange();g.selectNodeContents(e);const b=g.getBoundingClientRect();return [Math.round((b.left-rb.left)*4)/4, Math.round((b.top-rb.top)*4)/4]};
    const cm=root.querySelector(".cm-editor");
    const nums=cm?[...cm.querySelectorAll(".cm-lineNumbers .cm-gutterElement")].filter((e)=>e.offsetHeight):[...root.querySelectorAll("[data-slot=code-view-num]")];
    const lines=cm?[...cm.querySelectorAll(".cm-line")]:[...root.querySelectorAll("[data-slot=code-view-code]")];
    return {height: Math.round(rb.height), num: nums.slice(0,8).map(text), code: lines.slice(0,8).filter((l)=>l.textContent).map(text)}})()`;
  const readonly = await q(geometry);
  const plain3 = await pixels("plain3");
  await release();
  await editorReady();
  check("read-only, current line: not a pixel moves when CodeMirror arrives", await differing(plain3, await pixels("cm3")), 0);
  check("read-only: the host's line 7 is tinted, its number ink; no caret", await q(`(()=>{const l=document.querySelector("#stage .cm-line.cm-hostLine"),g=document.querySelector("#stage .cm-lineNumbers .cm-gutterElement.cm-hostLine");return [l?.textContent.trim().slice(0,12), g?.textContent, !!document.querySelector("#stage .cm-activeLine"), !!document.querySelector("#stage .cm-cursor")]})()`), ["const bucket", "7", false, false]);
  await q(`document.querySelector("#stage .cm-content").focus()`);
  const top0 = await q(`document.querySelector("#stage .cm-scroller").scrollTop`);
  await p.key("ArrowDown"); await p.key("ArrowDown"); await p.key("ArrowDown"); await p.key("PageDown");
  await sleep(200);
  check("the arrow keys and Page Down scroll it", await q(`document.querySelector("#stage .cm-scroller").scrollTop > ${top0}`), true);
  const fold3 = await q(`(()=>{const row=[...document.querySelectorAll("#stage .cm-line")].find((l)=>l.textContent.startsWith("export function")).getBoundingClientRect();const m=[...document.querySelectorAll("#stage .cm-foldGutter [data-fold=open]")].find((e)=>{const r=e.getBoundingClientRect();return Math.abs(r.top+r.height/2-(row.top+10))<3});if(!m) return null;const r=m.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  check("read-only: the function's line has a fold marker", !!fold3, true);
  if (fold3) { await p.click(fold3.x, fold3.y); await sleep(80); }
  check("read-only: clicking it folds the body", await q(`!!document.querySelector("#stage .cm-foldPlaceholder")`), true);

  /* Editable (ex 2): the listing first, then the editor in its place, drawn the same */
  await open(fw, 2);
  const listing = await q(geometry);
  check("editable or read-only, the listing keeps the fold column: numbers and code at the same place", [listing.num, listing.code], [readonly.num, readonly.code]);
  check("editable: the editor arrives and replaces the listing", await editorReady(), true);
  const editor = await q(geometry);
  check("editable: nothing moves when the editor arrives (numbers, code, height)", editor, listing);
  check("editable: a named, multi-line text box; the gutter is hidden from assistive tech", await q(`(()=>{const c=document.querySelector("#stage .cm-content");return [c.getAttribute("role"), c.getAttribute("aria-multiline"), c.getAttribute("aria-label"), document.querySelector("#stage .cm-gutters").getAttribute("aria-hidden")]})()`), ["textbox", "true", "src/middleware/rate-limit.ts", "true"]);
  check("editable: line 7 is the current line, tinted hover, its number ink", await q(`(()=>{const tok=(v,p)=>{const d=document.createElement("div");d.style[p]="var("+v+")";document.body.append(d);const c=getComputedStyle(d)[p];d.remove();return c};const l=document.querySelector("#stage .cm-activeLine");const g=document.querySelector("#stage .cm-lineNumbers .cm-activeLineGutter");return [g.textContent, getComputedStyle(l).backgroundColor===tok("--fndn-hover","backgroundColor"), getComputedStyle(g).color===tok("--fndn-ink","color")]})()`), ["7", true, true]);
  check("editable: no CodeMirror default look (no focus outline, transparent editor, surface gutter, no gutter border)", await q(`(()=>{const e=document.querySelector("#stage .cm-editor"),g=document.querySelector("#stage .cm-gutters");return [getComputedStyle(e).backgroundColor, getComputedStyle(g).backgroundColor===getComputedStyle(document.querySelector("#stage [data-slot=code-view]")).backgroundColor, getComputedStyle(g).borderRightWidth]})()`), ["rgba(0, 0, 0, 0)", true, "0px"]);

  /* typing, undo, the caret's line */
  const line = (n) => `[...document.querySelectorAll("#stage .cm-line")][${n - 1}].textContent`;
  await p.clickSel("#stage .cm-line:nth-child(4)");
  await p.key("Home");
  check("editable: a click puts the caret there and makes that line current", await q(`document.querySelector("#stage .cm-lineNumbers .cm-activeLineGutter").textContent`), "4");
  await p.type("x");
  check("typing edits the line", await q(line(4)), "xconst LIMIT = 120;");
  await p.key("z", { ctrl: true });
  check("Ctrl+Z undoes it", await q(line(4)), "const LIMIT = 120;");
  await p.key("ArrowDown");
  check("ArrowDown moves the current line with the caret", await q(`document.querySelector("#stage .cm-lineNumbers .cm-activeLineGutter").textContent`), "5");
  await p.key("Tab");
  check("Tab indents inside the editor; focus stays", await q(`[${line(5)}.startsWith("  ") || ${line(5)}.startsWith("\\t"), document.activeElement?.classList.contains("cm-content")]`), [true, true]);
  await p.key("z", { ctrl: true });
  await p.key("Escape");
  await p.key("Tab");
  check("Escape, then Tab, moves focus out of the editor", await q(`!!document.activeElement && !document.activeElement.closest("#stage .cm-editor")`), true);

  /* find: a widget floating over the code; it never pushes or scrolls it */
  const W = `document.querySelector("#stage [data-slot=code-view-search]")`;
  const count = () => q(`${W}?.querySelector("[data-slot=code-view-search-count]")?.textContent ?? null`);
  const at = await q(`(()=>{const l=[...document.querySelectorAll("#stage .cm-line")][6].getBoundingClientRect();return {x:l.left+30,y:l.top+10}})()`);
  await p.click(at.x, at.y);
  const still = `(()=>{const s=document.querySelector("#stage .cm-scroller");return [s.scrollTop, s.scrollLeft, Math.round(document.querySelector("#stage .cm-line").getBoundingClientRect().top), Math.round(document.querySelector("#stage [data-slot=code-view]").getBoundingClientRect().height)]})()`;
  const rest = await q(still);
  await p.key("f", { ctrl: true });
  await sleep(120);
  check("Ctrl+F opens the find widget: one row, the field focused, the replace row hidden", await q(`(()=>{const w=${W};return [!!w, w?.querySelectorAll("[data-slot=code-view-search-row]").length, document.activeElement?.getAttribute("aria-label"), document.activeElement?.dataset.codeView]})()`), [true, 1, "Find", "search-field"]);
  check("opening it moves nothing: no scroll, no line shifted, same height", await q(still), rest);
  check("it floats at the top end corner, 8px clear, inside the view", await q(`(()=>{const w=${W}.getBoundingClientRect(),r=document.querySelector("#stage [data-slot=code-view]").getBoundingClientRect();return [Math.round(w.top-r.top), Math.round(r.right-w.right), w.left>=r.left+7.5]})()`), [8, 8, true]);
  check("the options are named toggles; Previous, Next and Close are named", await q(`[...${W}.querySelectorAll("button")].map((b)=>b.getAttribute("aria-label")||b.textContent.trim())`), ["Toggle replace", "Match case", "Match whole word", "Use regular expression", "Previous match", "Next match", "Close"]);
  await p.type("bucket");
  await sleep(100);
  check("typing marks the matches and counts them, politely announced", [await count(), await q(`${W}.querySelector("[data-slot=code-view-search-count]").getAttribute("role")`), await q(`document.querySelectorAll("#stage .cm-searchMatch").length > 3`)], ["10 results", "status", true]);
  await p.key("Enter");
  check("Enter: the next match, \"2 of 10\"; a match in view does not scroll", [await count(), (await q(still))[0]], ["2 of 10", rest[0]]);
  await p.key("Enter", { shift: true });
  check("Shift+Enter: the previous one", await count(), "1 of 10");
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Next match']");
  check("the Next button", await count(), "2 of 10");
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Previous match']");
  check("the Previous button", await count(), "1 of 10");
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Match case']");
  check("a toggle presses and narrows the query", await q(`${W}.querySelector("[aria-label='Match case']").getAttribute("aria-pressed")`), "true");
  await q(`${W}.querySelector("input[data-code-view=search-field]").focus()`);
  await p.type("zz");
  await sleep(80);
  check("no match: \"No results\"", await count(), "No results");
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Toggle replace']");
  check("the caret shows the replace row under the find field", await q(`(()=>{const rows=${W}.querySelectorAll("[data-slot=code-view-search-row]");const f=${W}.querySelector("input[data-code-view=search-field]").closest("[data-slot=input-group]").getBoundingClientRect(),r=${W}.querySelector("input[data-code-view=replace-field]").closest("[data-slot=input-group]").getBoundingClientRect();return [rows.length, ${W}.querySelector("[aria-label='Toggle replace']").getAttribute("aria-expanded"), Math.round(f.left)===Math.round(r.left)]})()`), [2, "true", true]);
  await q(`${W}.querySelector("input[data-code-view=search-field]").select()`);
  await q(`${W}.querySelector("input[data-code-view=search-field]").focus()`);
  await p.type("LIMIT");
  await q(`${W}.querySelector("input[data-code-view=replace-field]").focus()`);
  await p.type("MAX");
  await p.clickSel("#stage [data-slot=code-view-search] button:not([aria-label]):last-of-type");
  await sleep(80);
  check("Replace all replaces every match", await q(`[...document.querySelectorAll("#stage .cm-line")].map((l)=>l.textContent).filter((t)=>t.includes("MAX")).length`), 2);
  await q(`${W}.querySelector("input[data-code-view=search-field]").focus()`);
  await p.key("Escape");
  await sleep(50);
  check("Escape closes the widget and returns the focus to the code", await q(`[!!${W}, document.activeElement?.classList.contains("cm-content")]`), [false, true]);
  await p.key("f", { ctrl: true });
  await sleep(100);
  check("opened again, the replace row is hidden", await q(`${W}.querySelectorAll("[data-slot=code-view-search-row]").length`), 1);
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Close']");
  await sleep(50);
  check("Close closes it", await q(`!!${W}`), false);
  await p.key("z", { ctrl: true });
  await q(`document.querySelector("#stage [data-slot=code-view]").style.width="900px"`);
  await q(`document.querySelector("#stage .cm-content").focus()`);
  await p.key("f", { ctrl: true });
  await sleep(100);
  check("in a wide view the widget stays compact, at the end", await q(`(()=>{const w=${W}.getBoundingClientRect(),r=document.querySelector("#stage [data-slot=code-view]").getBoundingClientRect();return [w.width<560, Math.round(r.right-w.right)]})()`), [true, 8]);
  await p.key("Escape");
  await q(`document.querySelector("#stage [data-slot=code-view]").style.width=""`);

  /* folding by indentation, from the gutter */
  const fold = await q(`(()=>{const m=document.querySelectorAll("#stage .cm-foldGutter [data-fold=open]");const t=[...m].find((e)=>{const r=e.getBoundingClientRect();const row=[...document.querySelectorAll("#stage .cm-line")][5].getBoundingClientRect();return Math.abs(r.top+r.height/2-(row.top+10))<3});if(!t) return null;const r=t.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  check("a fold marker sits on the function's line", !!fold, true);
  if (fold) { await p.click(fold.x, fold.y); await sleep(80); }
  check("clicking it folds the indented body; the closing line stays", await q(`[!!document.querySelector("#stage .cm-foldPlaceholder"), [...document.querySelectorAll("#stage .cm-line")].some((l)=>l.textContent==="}")]`), [true, true]);

  /* switching to read-only keeps CodeMirror, read-only */
  await q(`window.__harnessMounted.update({ editable: false })`);
  await sleep(150);
  check("editable off: the same CodeMirror view, now read-only; no caret line tinted", await q(`[!!document.querySelector("#stage [data-slot=code-view-body]"), document.querySelector("#stage .cm-content")?.getAttribute("contenteditable"), !!document.querySelector("#stage .cm-activeLine")]`), [false, "false", false]);

  /* fill: as tall as its container, the code scrolls inside */
  await open(fw, 5);
  await editorReady();
  await sleep(100);
  check("fill: 200px tall, scrolls; the current line (40) is in view; the page does not scroll", await q(`(()=>{const r=document.querySelector("#stage [data-slot=code-view]"),b=r.querySelector(".cm-scroller");const c=r.querySelector(".cm-line.cm-hostLine").getBoundingClientRect(),bb=b.getBoundingClientRect();return [Math.round(r.getBoundingClientRect().height), b.scrollHeight>b.clientHeight, c.top>=bb.top&&c.bottom<=bb.bottom, scrollY]})()`), [200, true, true, 0]);
  } catch (error) { check("script ran to the end", String(error.message).split("\n")[0].slice(0, 160), "ok"); }
  check("no console errors", p.errors.slice(0, 2), []);
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
